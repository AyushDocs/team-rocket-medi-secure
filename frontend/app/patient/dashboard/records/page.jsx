"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ethers } from "ethers"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

// ... (imports remain same) we need to update state variables only
export default function RecordsPatient() {
  const { patientContract, account } = useWeb3()
  const [healthRecords, setHealthRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Upload State
  const [file, setFile] = useState(null)
  const [docName, setDocName] = useState("")
  const [docDate, setDocDate] = useState("")
  const [hospital, setHospital] = useState("")
  const [uploading, setUploading] = useState(false)

  // Document Viewing State
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedDocUrl, setSelectedDocUrl] = useState("")
  const [viewingDoc, setViewingDoc] = useState(false)

  useEffect(() => {
    const fetchRecords = async () => {
      if (!patientContract || !account) return;
      try {
        setLoading(true)
        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") return; 

        const records = await patientContract.getMedicalRecords(patientId)
        setHealthRecords(
          records.map((record, index) => ({
            id: index + 1,
            type: "Medical Record",
            fileName: record.fileName || record[1],
            ipfsHash: record.ipfsHash || record[0],
            date: record.recordDate || record[2] || "Unknown Date",
            hospital: record.hospital || record[3] || "Unknown Location",
            shared: true,
          }))
        )
      } catch (err) {
        console.error("Error fetching records:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [patientContract, account])

  const handleUpload = async (e) => {
    e.preventDefault();
    if(!patientContract || !file || !docName || !docDate || !hospital) {
        setError("Please fill all fields and select a file.");
        return;
    }
    
    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userAddress", account); 

      const response = await fetch("http://localhost:5000/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file to the server")
      }

      const data = await response.json()
      const ipfsHash = data.ipfsHash
      
      // Call updated contract function with 4 args
      const tx = await patientContract.addMedicalRecord(ipfsHash, docName, docDate, hospital)
      await tx.wait()

      setHealthRecords((prevRecords) => [
        ...prevRecords,
        {
          id: prevRecords.length + 1,
          type: "Medical Record",
          date: docDate,
          fileName: docName, // Use the user-provided name
          hospital: hospital,
          ipfsHash: ipfsHash,
          shared: true,
        },
      ])
      
      // Reset Form
      setFile(null);
      setDocName("");
      setDocDate("");
      setHospital("");

    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleViewDocument = async (ipfsHash) => {
      try {
          setViewingDoc(true);
          if (!window.ethereum) throw new Error("No crypto wallet found");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const signature = await signer.signMessage(ipfsHash);

          const response = await fetch(`http://localhost:5000/files/${ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${account}`);
          
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Failed to fetch document access");
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setSelectedDocUrl(url);
          setViewModalOpen(true);

      } catch (err) {
          console.error("View document error:", err);
          alert("Error opening document: " + err.message);
      } finally {
          setViewingDoc(false);
      }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Medical Records</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Form */}
        <div className="mb-6 p-4 border rounded bg-gray-50 space-y-3">
            <h3 className="font-semibold text-sm">Add New Record</h3>
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
                        onChange={(e) => setFile(e.target.files[0])}
                        className="p-1 border rounded text-sm w-full bg-white"
                        required
                    />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <Button type="submit" size="sm" disabled={uploading} className="bg-[#703FA1] hover:bg-[#5a2f81]">
                    {uploading ? "Uploading..." : "Upload Record"}
                </Button>
            </form>
        </div>

        {healthRecords.length === 0 ? (
          <p className="text-gray-500 text-sm">No medical records found.</p>
        ) : (
          <ul className="space-y-4">
            {healthRecords.map((record) => (
              <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-white shadow-sm">
                <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 truncate max-w-md">
                        {record.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                        {record.date} • {record.hospital}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{/*record.ipfsHash*/ "Secured on Blockchain"}</p>
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
                    <p>Loading document...</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
