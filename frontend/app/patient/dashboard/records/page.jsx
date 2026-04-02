"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ethers } from "ethers"
import { Eye } from "lucide-react"
import mammoth from "mammoth"
import React, { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"

export default function RecordsPatient() {
  const { patientContract, account } = useWeb3()
  const [healthRecords, setHealthRecords] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Create Ref for File Input
  const fileInputRef = React.useRef(null);
  
  // Upload State
  const [docName, setDocName] = useState("")
  const [docDate, setDocDate] = useState("")
  const [ hospital, setHospital] = useState("")
  const [isEmergency, setIsEmergency] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Document Viewing State
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedDocUrl, setSelectedDocUrl] = useState("")
  const [docHtml, setDocHtml] = useState("") // HTML content state for DOCX/Text
  const [viewingDoc, setViewingDoc] = useState(false)

  useEffect(() => {
    const fetchRecords = async () => {
      if (!patientContract || !account) return;
      try {
        setLoading(true)
        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") {
             setLoading(false);
             return; 
        }

        const records = await patientContract.getMedicalRecords(patientId)
        setHealthRecords(
          records.map((record, index) => ({
            id: index + 1,
            tokenId: record.tokenId ? record.tokenId.toString() : (record[0] ? record[0].toString() : "N/A"),
            ipfsHash: record.ipfsHash || record[1],
            fileName: record.fileName || record[2],
            date: record.recordDate || record[3] || "Unknown Date",
            hospital: record.hospital || record[4] || "Unknown Location",
            isEmergencyViewable: record.isEmergencyViewable || record[5],
            shared: true,
          }))
        )
      } catch (err) {
        console.error("Error fetching records:", err)
        toast.error("Failed to fetch medical records");
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [patientContract, account])

  const handleUpload = async (e) => {
    e.preventDefault();
    const currentFile = fileInputRef.current?.files?.[0]; // Get file from Ref
    
    console.log("Selected File:", currentFile);

    if(!patientContract || !currentFile || !docName || !docDate || !hospital) {
        toast.error("Please fill all fields and select a file.");
        return;
    }

    if (!(currentFile instanceof File)) {
        toast.error("Invalid file object. Please try again.");
        console.error("File is not instance of File:", currentFile);
        return;
    }
    
    setUploading(true);
    const toastId = toast.loading("Securely Uploading to IPFS...");

    try {
        // 1. Upload to Pinata (Backend)
        const formData = new FormData();
        formData.append("file", currentFile); 
        formData.append("userAddress", account); 
  
        const response = await fetch("http://localhost:5000/files", {
            method: "POST",
            body: formData,
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload file");
        }
  
        const data = await response.json();
        const ipfsHash = data.ipfsHash;
        
        // 2. Mint NFT (Blockchain)
        toast.loading("Minting NFT Record...", { id: toastId });
        const tx = await patientContract.addMedicalRecord(ipfsHash, docName, docDate, hospital, isEmergency);
        await tx.wait();
        
        toast.success("Record Minted & Secured!", { id: toastId });
        window.location.reload(); 

    } catch(e) {
        console.error("Upload Error:", e);
        toast.error(`Upload Failed: ${e.message}`, { id: toastId });
    } finally {
        setUploading(false);
    }
  }

  const handleToggleEmergency = async (recordId, currentIndex) => {
    try {
        const toastId = toast.loading("Updating visibility...");
        const tx = await patientContract.toggleEmergencyVisibility(currentIndex);
        await tx.wait();
        toast.success("Emergency visibility updated!", { id: toastId });
        window.location.reload();
    } catch (err) {
        console.error("Toggle visibility error:", err);
        toast.error("Failed to update visibility");
    }
  }

  const handleViewDocument = async (ipfsHash) => {
      try {
          setViewingDoc(true);
          setDocHtml("");
          setSelectedDocUrl("");
          
          if (!window.ethereum) throw new Error("No crypto wallet found");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const signature = await signer.signMessage(ipfsHash);

          const response = await fetch(`http://localhost:5000/files/${ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${account}`);
          
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Failed to fetch document");
          }

          const blob = await response.blob();
          const type = blob.type;
          
          // DOCX Conversion
          if(type.includes("wordprocessingml") || type.includes("docx")) {
             const arrayBuffer = await blob.arrayBuffer();
             const result = await mammoth.convertToHtml({ arrayBuffer });
             setDocHtml(result.value);
          } 
          // Text
          else if (type.startsWith("text/")) {
             const text = await blob.text();
             setDocHtml(`<pre>${text}</pre>`);
          }
          // PDF / Images
          else {
             const url = URL.createObjectURL(blob);
             setSelectedDocUrl(url);
          }
          
          setViewModalOpen(true);
          toast.success("Document Decrypted!");

      } catch (err) {
          console.error("View document error:", err);
          toast.error("View Failed: " + err.message);
      } finally {
          setViewingDoc(false);
      }
  };

  const renderViewerContent = () => {
      if (docHtml) {
          return (
             <div className="w-full h-full overflow-auto bg-white p-8 prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: docHtml }} />
             </div>
          )
      }
      if (selectedDocUrl) {
          return (
             <iframe 
                src={selectedDocUrl} 
                className="w-full h-full" 
                title="Document"
             />
          )
      }
      return (
        <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-[60vh] w-[800px]" />
            <p>Loading document securely...</p>
        </div>
      )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Medical Records (NFTs)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Form */}
        <div className="mb-6 p-4 border rounded bg-gray-50 space-y-3">
            <h3 className="font-semibold text-sm">Mint New Record NFT</h3>
            <form onSubmit={handleUpload} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                        type="text" 
                        placeholder="Document Name (e.g. MRI Scan)" 
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="p-2 border rounded text-sm w-full"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Hospital / Lab Name" 
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        className="p-2 border rounded text-sm w-full"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                        type="datetime-local" 
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        className="p-2 border rounded text-sm w-full"
                        required
                    />
                    <input 
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf,image/*,.docx"
                        className="p-1 border rounded text-sm w-full bg-white"
                        required
                    />
                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id="isEmergency"
                            checked={isEmergency}
                            onChange={(e) => setIsEmergency(e.target.checked)}
                            className="w-4 h-4 text-purple-600"
                        />
                        <label htmlFor="isEmergency" className="text-sm font-medium text-gray-700">
                             Make Viewable in Emergency
                        </label>
                    </div>
                </div>
                <Button type="submit" size="sm" disabled={uploading} className="bg-[#703FA1] hover:bg-[#5a2f81]">
                    {uploading ? "Minting..." : "Mint NFT Record"}
                </Button>
            </form>
        </div>

        {loading ? (
             <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-center p-3 border rounded-lg">
                        <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                        </div>
                        <Skeleton className="h-8 w-20 mt-2 sm:mt-0" />
                    </div>
                ))}
            </div>
        ) : healthRecords.length === 0 ? (
          <p className="text-gray-500 text-sm">No medical records found.</p>
        ) : (
          <ul className="space-y-4">
            {healthRecords.map((record) => (
              <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-white shadow-sm">
                <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 truncate max-w-md flex items-center gap-2">
                        {record.fileName}
                         <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-mono">
                            NFT #{record.tokenId}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        {record.date} • {record.hospital}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{/*record.ipfsHash*/ "Secured on Blockchain"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end mr-4">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Emergency View</p>
                        <Button 
                            variant={record.isEmergencyViewable ? "default" : "outline"} 
                            size="sm" 
                            className={`h-6 text-[10px] px-2 ${record.isEmergencyViewable ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' : ''}`}
                            onClick={() => handleToggleEmergency(record.id, record.id - 1)}
                        >
                            {record.isEmergencyViewable ? "ENABLED" : "DISABLED"}
                        </Button>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDocument(record.ipfsHash)}
                        disabled={viewingDoc}
                    >
                       <Eye className="w-4 h-4 mr-2" />
                       View
                    </Button>
                </div>
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
                <DialogDescription>
                    Securely viewing your decrypted medical record.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full h-full border rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                {renderViewerContent()}
            </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
