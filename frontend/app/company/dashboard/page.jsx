"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ethers } from "ethers"
import { Download, Eye } from "lucide-react"
import mammoth from "mammoth"; // Import Mammoth

// ... (rest of imports)

export default function CompanyDashboard() {
    // ... (state)
    const [docHtml, setDocHtml] = useState("") // New state for HTML content (docx)

    // ... (loadData etc)

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

            // Special handling for DOCX
            if(type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                setDocHtml(result.value);
            } 
            // Special handling for Text
            else if (type === "text/plain") {
                const text = await blob.text();
                setDocHtml(`<pre>${text}</pre>`);
            }
            else {
                setDocHtml("");
            }

            setViewModalOpen(true);
            toast.success("Document Decrypted");

        } catch (e) {
            console.error(e);
            toast.error("View Error: " + e.message);
        }
    }

    // Helper for rendering content
    const renderContent = () => {
        if (!selectedDocUrl) return (
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-[60vh] w-[800px]" />
                <p>Loading document securely...</p>
            </div>
        );

        // Images
        if (selectedDocType.startsWith("image/")) {
            return <img src={selectedDocUrl} alt="Medical Record" className="max-h-full max-w-full object-contain" />;
        }
        
        // PDFs
        if (selectedDocType === "application/pdf") {
            return <iframe src={selectedDocUrl} className="w-full h-full" title="Document" />;
        }

        // DOCX / HTML / Text
        if (docHtml) {
            return (
                <div className="w-full h-full overflow-auto bg-white p-8 prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: docHtml }} />
                </div>
            )
        }

        // Fallback - BLOCKED DOWNLOAD
        return (
            <div className="text-center space-y-4 p-8 bg-gray-50 rounded border flex flex-col items-center justify-center h-full">
                <div className="bg-red-100 p-4 rounded-full">
                    <Eye className="h-8 w-8 text-red-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Preview Unavailable</h3>
                    <p className="text-gray-600 mt-2">
                        This file format ({selectedDocType || "Unknown"}) cannot be rendered securely in the browser.
                    </p>
                    <p className="text-red-500 font-semibold mt-4 text-sm bg-red-50 p-2 rounded border border-red-200 inline-block">
                        ⚠ DOWNLOAD DISABLED: DATA SOVEREIGNTY PROTOCOL
                    </p>
                </div>
            </div>
        )
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
                    <div className="flex-1 w-full h-full border rounded bg-gray-100 flex items-center justify-center overflow-hidden p-4">
                        {renderContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
