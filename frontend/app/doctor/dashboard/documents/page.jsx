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
      const docs = result.map(doc => {
        const grantTime = Number(doc.grantTime || doc[4] || 0);
        const duration = Number(doc.duration || doc[5] || 0);
        const now = Math.floor(Date.now() / 1000);
        const isExpired = (grantTime + duration) < now;
        const remaining = (grantTime + duration) - now;
        
        return {
            patient: doc.patient || doc[0],
            ipfsHash: doc.ipfsHash || doc[1],
            fileName: doc.fileName || doc[2] || `Document`,
            hasAccess: doc.hasAccess || doc[3],
            grantTime,
            duration,
            isExpired,
            remaining
        };
      }).filter(doc => doc.hasAccess); // Access must be granted initially
      
      setAccessDocs(docs);
    } catch (err) {
      console.error("Failed to fetch access list:", err);
    }
  }

  useEffect(() => {
    fetchAccessList()
  }, [doctorContract, account])

  const formatRemaining = (sec) => {
      if(sec <= 0) return "Expired";
      if(sec < 3600) return `${Math.floor(sec/60)}m remaining`;
      if(sec < 86400) return `${(sec/3600).toFixed(1)}h remaining`;
      return `${(sec/86400).toFixed(1)}d remaining`;
  }

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
                                    <div className={`p-2 rounded ${doc.isExpired ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{doc.fileName}</p>
                                        <p className="text-sm text-gray-500">Patient: <span className="font-mono">{doc.patient.slice(0,8)}...</span></p>
                                        <p className={`text-xs font-medium ${doc.isExpired ? 'text-red-500' : 'text-green-600'}`}>
                                            {doc.isExpired ? "Access Expired" : formatRemaining(doc.remaining)}
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => setViewingDoc(doc)} 
                                    variant={doc.isExpired ? "secondary" : "outline"}
                                    disabled={doc.isExpired}
                                >
                                    {doc.isExpired ? "Expired" : "View Securely"}
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
