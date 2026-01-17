"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ethers } from "ethers"
import { Lock, ShieldAlert } from "lucide-react"
import { useState } from "react"
import { useWeb3 } from "../context/Web3Context"

export default function SafeDocumentViewer({ ipfsHash, patientAddress, onClose }) {
  const { account } = useWeb3()
  const [agreed, setAgreed] = useState(false)
  const [fileUrl, setFileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAgree = async () => {
    try {
      setLoading(true)
      setError("")

      if (!window.ethereum) throw new Error("No crypto wallet found");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 1. Sign the request
      const signature = await signer.signMessage(ipfsHash);

      // 2. Fetch from backend
      const response = await fetch(`http://localhost:5000/files/${ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${patientAddress}`);

      if (!response.ok) {
           const err = await response.json();
           throw new Error(err.error || "Failed to fetch document");
      }

      // 3. Create Blob URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
      setAgreed(true)

    } catch (err) {
      console.error("Secure view error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-red-200 shadow-md w-full max-w-4xl mx-auto my-4">
      <CardHeader className="bg-red-50 border-b border-red-100 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-red-800">
            <Lock className="h-4 w-4" />
            <CardTitle className="text-base font-semibold">Protected Medical Record</CardTitle>
        </div>
        {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                Close
            </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!agreed ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                <ShieldAlert className="h-16 w-16 text-amber-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confidential Information</h3>
                <p className="text-gray-600 max-w-md mb-6">
                    This document contains sensitive Personal Health Information (PHI). 
                    Access is logged and audited. By proceeding, you confirm you have legitimate authorization to view this record.
                </p>
                <div className="bg-white p-4 items-center rounded border mb-6 text-sm text-left w-full max-w-md">
                    <p><strong>Patient:</strong> {patientAddress}</p>
                    <p><strong>Document ID:</strong> {ipfsHash}</p>
                </div>
                
                {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

                <Button onClick={handleAgree} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white w-64">
                    {loading ? "Verifying Access..." : "Sign & View Record"}
                </Button>
            </div>
        ) : (
            <div className="relative bg-black min-h-[500px] flex items-center justify-center group overflow-hidden">
                {/* Security Overlay / Watermark */}
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-wrap content-center justify-center opacity-10 select-none">
                     {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="text-white text-xl font-bold m-8 transform -rotate-45">
                            CONFIDENTIAL DO NOT SHARE
                        </div>
                     ))}
                </div>

                {/* Content Viewer */}
                <div className="w-full h-[600px] relative z-10 bg-white">
                    <iframe 
                        src={fileUrl} 
                        className="w-full h-full border-0"
                        title="Medical Record"
                        sandbox="allow-scripts allow-same-origin" 
                        onContextMenu={(e) => e.preventDefault()} 
                    />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 text-center z-30">
                    Viewing Session Active • Access Logged
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
