"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ethers } from "ethers"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function RecordsPatient() {
  const { patientContract, account } = useWeb3()
  const [healthRecords, setHealthRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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
        if (patientId.toString() === "0") {
             // Not registered
             return; 
        }

        const records = await patientContract.getMedicalRecords(patientId)
        const recordsArray = Array.from(records);
        setHealthRecords(
          recordsArray.map((record, index) => ({
            id: index + 1,
            type: "Medical Record",
            date: "Unknown", 
            description: record, // IPFS Hash
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

  const uploadMedicalRecord = async (file) => {
    if(!patientContract) return;
    try {
      setLoading(true)
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

      const patientId = await patientContract.walletToPatientId(account)
      const tx = await patientContract.addMedicalRecord(ipfsHash)
      await tx.wait()

      setHealthRecords((prevRecords) => [
        ...prevRecords,
        {
          id: prevRecords.length + 1,
          type: "Medical Record",
          date: new Date().toISOString().split("T")[0],
          description: ipfsHash,
          shared: true,
        },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
        <input
          type="file"
          onChange={(e) => uploadMedicalRecord(e.target.files[0])}
          className="mb-4"
        />
        {healthRecords.length === 0 ? (
          <p>No medical records found.</p>
        ) : (
          <ul className="space-y-4">
            {healthRecords.map((record) => (
              <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-white shadow-sm">
                <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 truncate max-w-md" title={record.description}>
                        {record.description}
                    </p>
                    <p className="text-xs text-gray-400">IPFS Hash</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDocument(record.description)}
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
