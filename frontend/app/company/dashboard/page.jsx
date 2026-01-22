"use client"
import ComputeSandbox from "@/components/ComputeSandbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ethers } from "ethers"
import { Cpu, Download, Eye, LogOut, PlayCircle, Shield } from "lucide-react"
import mammoth from "mammoth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useWeb3 } from "../../../context/Web3Context"

const CompanyDashboard = () => {
    const { marketplaceContract, account, disconnect, loading: web3Loading } = useWeb3()
    const router = useRouter()
    
    // State
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [purchases, setPurchases] = useState([])
    const [myOffers, setMyOffers] = useState([])
    
    // Offer Form
    const [offerTitle, setOfferTitle] = useState("")
    const [offerDesc, setOfferDesc] = useState("")
    const [price, setPrice] = useState("")
    const [budget, setBudget] = useState("")

    // Viewer
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedDocUrl, setSelectedDocUrl] = useState("")
    const [selectedDocType, setSelectedDocType] = useState("")
    const [selectedDocName, setSelectedDocName] = useState("")
    const [docHtml, setDocHtml] = useState("")

    useEffect(() => {
        if (marketplaceContract && account) {
            loadData()
        }
    }, [marketplaceContract, account])

    const loadData = async () => {
        setLoadingData(true)
        try {
            const [allOffers, myPurchases] = await Promise.all([
                marketplaceContract.getAllOffers(),
                marketplaceContract.getCompanyPurchases()
            ])
            
            setMyOffers(allOffers.filter(o => o.company.toLowerCase() === account.toLowerCase()))
            setPurchases(myPurchases)
        } catch (e) {
            console.error("Failed to load dashboard data:", e)
        } finally {
            setLoadingData(false)
        }
    }

    const createOffer = async () => {
        if (!offerTitle || !offerDesc || !price || !budget) {
            toast.error("Please fill all fields")
            return
        }
        setLoading(true)
        try {
            const priceWei = ethers.parseEther(price)
            const budgetWei = ethers.parseEther(budget)
            const tx = await marketplaceContract.createOffer(offerTitle, offerDesc, priceWei, { value: budgetWei })
            await tx.wait()
            toast.success("Offer Created!")
            loadData()
            setOfferTitle(""); setOfferDesc(""); setPrice(""); setBudget("")
        } catch (e) {
            console.error(e)
            toast.error("Failed to create offer")
        } finally {
            setLoading(false)
        }
    }

    const handleView = async (ipfsHash, patientAddr) => {
        try {
            if (!window.ethereum) throw new Error("No crypto wallet found");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(ipfsHash);

            const response = await fetch(`http://localhost:5000/files/${ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${patientAddr}`);
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to fetch document content");
            }

            const blob = await response.blob();
            const type = blob.type;
            const url = URL.createObjectURL(blob);
            
            setSelectedDocUrl(url);
            setSelectedDocType(type); 
            setSelectedDocName(`document_${ipfsHash.slice(0,6)}`);

            if(type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                setDocHtml(result.value);
            } else if (type === "text/plain") {
                const text = await blob.text();
                setDocHtml(`<pre>${text}</pre>`);
            } else {
                setDocHtml("");
            }

            setViewModalOpen(true);
            toast.success("Document Decrypted");
        } catch (e) {
            console.error(e);
            toast.error("View Error: " + e.message);
        }
    }

    const handleExport = () => {
        if (purchases.length === 0) return;
        const csvContent = [["Patient Address", "IPFS Hash", "Purchase Date", "Timestamp"], ...purchases.map(p => [p.patient, p.ipfsHash, new Date(Number(p.timestamp) * 1000).toLocaleString(), p.timestamp.toString()])].map(e => e.join(",")).join("\n");
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

    const handleLogout = () => {
        disconnect();
        router.push("/");
    }

    const renderContent = () => {
        if (!selectedDocUrl) return (
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-[60vh] w-[800px]" />
                <p>Loading document securely...</p>
            </div>
        );
        if (selectedDocType.startsWith("image/")) return <img src={selectedDocUrl} alt="Medical Record" className="max-h-full max-w-full object-contain" />;
        if (selectedDocType === "application/pdf") return <iframe src={selectedDocUrl} className="w-full h-full" title="Document" />;
        if (docHtml) return <div className="w-full h-full overflow-auto bg-white p-8 prose max-w-none"><div dangerouslySetInnerHTML={{ __html: docHtml }} /></div>;
        return (
            <div className="text-center space-y-4 p-8 bg-gray-50 rounded border flex flex-col items-center justify-center h-full">
                <div className="bg-red-100 p-4 rounded-full"><Eye className="h-8 w-8 text-red-600" /></div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Preview Unavailable</h3>
                    <p className="text-gray-600 mt-2">This file format ({selectedDocType || "Unknown"}) cannot be rendered securely in the browser.</p>
                    <p className="text-red-500 font-semibold mt-4 text-sm bg-red-50 p-2 rounded border border-red-200 inline-block">⚠ DOWNLOAD DISABLED: DATA SOVEREIGNTY PROTOCOL</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                        <Shield className="h-6 w-6 text-purple-700" />
                        <span className="font-bold text-xl text-gray-800">MediMarketplace</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {account && <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded hidden sm:block">{account.slice(0,6)}...{account.slice(-4)}</span>}
                        <Button variant="ghost" onClick={handleLogout} className="text-gray-600 hover:text-red-600 hover:bg-red-50 font-bold">
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Company Dashboard</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold border border-purple-200">
                        <Cpu u className="h-4 w-4" />
                        DeSci Compute Ready
                    </div>
                </div>
                
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-white border p-1 h-12">
                        <TabsTrigger value="overview" className="px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">Overview</TabsTrigger>
                        <TabsTrigger value="compute" className="px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Compute Sandbox
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 mt-0">
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

                        <Card>
                            <CardHeader><CardTitle>My Active Campaigns</CardTitle></CardHeader>
                            <CardContent>
                                {loadingData ? <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : myOffers.length === 0 ? <p>No active campaigns.</p> : (
                                    <ul className="space-y-2">
                                        {myOffers.map((o, i) => (
                                            <li key={i} className="p-3 border rounded bg-white flex justify-between">
                                                <span className="font-medium">{o.title}</span>
                                                <span className="font-mono text-green-600">{ethers.formatEther(o.budget)} ETH remaining</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Purchased Data</CardTitle>
                                <Button variant="outline" size="sm" onClick={handleExport} disabled={purchases.length===0}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loadingData ? <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : purchases.length === 0 ? <p>No data purchased yet.</p> : (
                                    <ul className="space-y-2">
                                        {purchases.map((p, i) => (
                                            <li key={i} className="p-3 border rounded bg-white flex justify-between items-center group hover:border-purple-300 transition-colors">
                                                <div>
                                                    <p className="font-bold text-sm truncate w-64">{p.ipfsHash}</p>
                                                    <p className="text-xs text-gray-500">From: {p.patient.slice(0,6)}...{p.patient.slice(-4)} • {new Date(Number(p.timestamp)*1000).toLocaleDateString()}</p>
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
                    </TabsContent>

                    <TabsContent value="compute" className="mt-0">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0">
                                <CardTitle className="text-2xl font-bold">Compute-Over-Data (DeSci)</CardTitle>
                                <CardDescription>
                                    Securely train your models on patient data without downloading raw records. 
                                    Your script runs in a isolated Docker sandbox and only returns logs and specific artifacts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0">
                                <ComputeSandbox purchasedData={purchases} account={account} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Document Viewer</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 w-full h-full border rounded bg-gray-100 flex items-center justify-center overflow-hidden p-4">
                        {renderContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
export default CompanyDashboard;