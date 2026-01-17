"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { useEffect, useState } from "react"
import SafeDocumentViewer from "../../../../components/safe-document-viewer"
import { useWeb3 } from "../../../../context/Web3Context"

export default function DocumentsDoctor() {
  const { doctorContract, account } = useWeb3()
  const [accessDocs, setAccessDocs] = useState([])
  const [viewingDoc, setViewingDoc] = useState(null)

  const fetchAccessList = async () => {
    if (!doctorContract) {
        console.warn("Doctor contract not loaded. Skipping access list fetch.");
        return;
    }
    try {
      const result = await doctorContract.getAccessList();
      // Result is array of structs. Map to usable format.
      // Ethers returns Result objects which are array-like.
      const docs = result.map(doc => ({
        patient: doc.patient || doc[0],
        ipfsHash: doc.ipfsHash || doc[1],
        fileName: doc.fileName || doc[2] || `Document`,
        hasAccess: doc.hasAccess || doc[3]
      })).filter(doc => doc.hasAccess); // Only show if access is true
      setAccessDocs(docs);
    } catch (err) {
      console.error("Failed to fetch access list:", err);
    }
  }

  useEffect(() => {
    fetchAccessList()
  }, [doctorContract, account])

  return (
    <Card>
      <CardHeader><CardTitle>Authorized Medical Records</CardTitle></CardHeader>
      <CardContent>
        {viewingDoc ? (
            <SafeDocumentViewer 
              ipfsHash={viewingDoc.ipfsHash} 
              patientAddress={viewingDoc.patient}
              onClose={() => setViewingDoc(null)}
            />
        ) : (
            <div>
                {accessDocs.length === 0 ? (
                    <p className="text-gray-500">No authorized documents found.</p>
                ) : (
                    <div className="grid gap-4">
                        {accessDocs.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-2 rounded text-blue-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{doc.fileName}</p>
                                        <p className="text-sm text-gray-500">Patient: <span className="font-mono">{doc.patient}</span></p>
                                        <p className="text-xs text-gray-400 truncate max-w-xs">{/*doc.ipfsHash*/ "Secured on Blockchain"}</p>
                                    </div>
                                </div>
                                <Button onClick={() => setViewingDoc(doc)} variant="outline">
                                    View Securely
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  )
}
