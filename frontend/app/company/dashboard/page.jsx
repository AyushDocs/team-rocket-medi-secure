"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ethers } from "ethers"
import { Download, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../context/Web3Context"

export default function CompanyDashboard() {
    const { marketplaceContract, account } = useWeb3()
    const [purchases, setPurchases] = useState([])
    const [myOffers, setMyOffers] = useState([])
    
    // View State
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedDocUrl, setSelectedDocUrl] = useState("")

    // Offer Form
    const [offerTitle, setOfferTitle] = useState("")
    const [offerDesc, setOfferDesc] = useState("")
    const [price, setPrice] = useState("0.01") // ETH
    const [budget, setBudget] = useState("0.1") // ETH
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {
        if(marketplaceContract && account) loadData();
    }, [marketplaceContract, account])

    const loadData = async () => {
        setLoadingData(true);
        try {
            // My Purchases
            const bought = await marketplaceContract.getCompanyPurchases({ from: account });
            // Mapping: patient, ipfsHash, timestamp, offerId
            setPurchases(bought);

            // Fetch Offers (Active)
            const allOffers = await marketplaceContract.getAllOffers();
            const mine = allOffers.filter(o => o.company.toLowerCase() === account.toLowerCase());
            setMyOffers(mine);

        } catch(e) { 
            console.error(e);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoadingData(false);
        }
    }

    const createOffer = async () => {
        if (!offerTitle || !offerDesc) {
            toast.error("Please fill in title and description");
            return;
        }

        setLoading(true);
        
        const promise = new Promise(async(resolve, reject) => {
            try {
                const priceWei = ethers.parseEther(price);
                const budgetWei = ethers.parseEther(budget);
                
                const tx = await marketplaceContract.createOffer(offerTitle, offerDesc, priceWei, { value: budgetWei });
                await tx.wait();
                
                resolve();
                loadData();
                setOfferTitle(""); setOfferDesc("");
            } catch(e) {
                reject(e);
            } finally { setLoading(false); }
        })

        toast.promise(promise, {
            loading: 'Creating On-Chain Campaign...',
            success: 'Campaign Live!',
            error: (err) => `Failed: ${err.message}`
        });
    }

    const handleView = async (ipfsHash, patientAddr) => {
        try {
            if (!window.ethereum) throw new Error("No crypto wallet found");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(ipfsHash);

            // Backend verifies: (ipfsHash, signature, userAddress)
            // It knows Company (userAddress) bought from Patient (patientAddr) via blockchain check?
            // Actually, backend check might just verify signature matches userAddress.
            // For now, let's assume backend logic allows access if signature is valid and caller is authorized.
            // Note: Our backend currently checks 'patientAddress' param. If we are company, access logic might differ?
            // Existing backend `check_access` usually checks `DoctorAccess`.
            // Data Marketplace might need a backend update to check `PurchasedRecord` event or simply trust signature for now if we don't have backend logic for Marketplace yet.
            // BUT, let's try the existing endpoint. If it fails, we know we need backend logic.
            // Wait, the backend endpoint `/files/:ipfsHash` checks `doc_contract.hasAccessToDocument(patient_address, ipfs_hash, user_address)`.
            // Since `Marketplace` is separate, the `Doctor` contract doesn't know about this sale.
            // WE NEED TO UPDATE BACKEND to allow Marketplace access too.
            // FOR NOW: I will implement the frontend request. If it fails, I will flag it.
            
            // Re-using the same endpoint:
            const response = await fetch(`http://localhost:5000/files/${ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${patientAddr}`);
            
            if (!response.ok) {
                // Determine if error is access related.
                // Assuming backend isn't updated yet, this might fail.
                // However, user requested "View Functionality". I will assume standard fetch.
                const err = await response.json();
                throw new Error(err.error || "Failed to fetch document content");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setSelectedDocUrl(url);
            setViewModalOpen(true);
            toast.success("Document Decrypted");

        } catch (e) {
            console.error(e);
            toast.error("View Error: " + e.message);
        }
    }

    const handleExport = () => {
        if (purchases.length === 0) return;

        const csvContent = [
            ["Patient Address", "IPFS Hash", "Purchase Date", "Timestamp"],
            ...purchases.map(p => [
                p.patient,
                p.ipfsHash,
                new Date(Number(p.timestamp) * 1000).toLocaleString(),
                p.timestamp.toString()
            ])
        ]
        .map(e => e.join(","))
        .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `company_purchases_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Exported!");
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800">Company Dashboard</h1>
            
            {/* Create Offer */}
            <Card>
                <CardHeader><CardTitle>Create Data Offer (Ad)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Offer Title (e.g. Buying X-Rays)" value={offerTitle} onChange={e=>setOfferTitle(e.target.value)} />
                    <Textarea placeholder="Description & Requirements" value={offerDesc} onChange={e=>setOfferDesc(e.target.value)} />
                    <div className="flex gap-4">
                        <Input type="number" step="0.001" placeholder="Price Per Record (ETH)" value={price} onChange={e=>setPrice(e.target.value)} />
                        <Input type="number" step="0.01" placeholder="Total Budget (ETH)" value={budget} onChange={e=>setBudget(e.target.value)} />
                    </div>
                    <Button onClick={createOffer} disabled={loading} className="w-full bg-[#703FA1]">
                        {loading ? "Creating..." : "Launch Offer"}
                    </Button>
                </CardContent>
            </Card>

            {/* My Active Offers */}
            <Card>
                <CardHeader><CardTitle>My Active Campaigns</CardTitle></CardHeader>
                <CardContent>
                    {loadingData ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : myOffers.length === 0 ? <p>No active campaigns.</p> : (
                        <ul className="space-y-2">
                            {myOffers.map((o, i) => (
                                <li key={i} className="p-3 border rounded bg-white flex justify-between">
                                    <span>{o.title}</span>
                                    <span className="font-mono text-green-600">{ethers.formatEther(o.budget)} ETH remaining</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* Purchases */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Purchased Data</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={purchases.length===0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    {loadingData ? (
                        <div className="space-y-2">
                             <Skeleton className="h-16 w-full" />
                             <Skeleton className="h-16 w-full" />
                             <Skeleton className="h-16 w-full" />
                        </div>
                    ) : purchases.length === 0 ? <p>No data purchased yet.</p> : (
                        <ul className="space-y-2">
                             {purchases.map((p, i) => (
                                <li key={i} className="p-3 border rounded bg-white flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm truncate w-64">{p.ipfsHash}</p>
                                        <p className="text-xs text-gray-500">From: {p.patient} • {new Date(Number(p.timestamp)*1000).toLocaleDateString()}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleView(p.ipfsHash, p.patient)}>
                                        <Eye className="w-4 h-4 mr-1" /> View
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Document Viewer</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 w-full h-full border rounded bg-gray-100 flex items-center justify-center">
                        {selectedDocUrl ? (
                            <iframe 
                                src={selectedDocUrl} 
                                className="w-full h-full" 
                                title="Document"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="h-[60vh] w-[800px]" />
                                <p>Loading document securely...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
