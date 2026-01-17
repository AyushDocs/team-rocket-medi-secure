"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ethers } from "ethers"
import { AlertTriangle, EyeOff, Lock, ShieldAlert } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useWeb3 } from "../context/Web3Context"

export default function SafeDocumentViewer({ ipfsHash, patientAddress, onClose }) {
  const { account } = useWeb3()
  const [agreed, setAgreed] = useState(false)
  const [fileUrl, setFileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isBlurred, setIsBlurred] = useState(false)
  
  // Spotlight / Anti-Phone-Camera Mode
  const [spotlightMode, setSpotlightMode] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // --- Security: Anti-Screenshot & Focus Monitoring ---
  useEffect(() => {
    if (!agreed) return;

    const handleKeyDown = (e) => {
      // Attempt to detect screenshot keys (Best Effort)
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey) || (e.ctrlKey && e.shiftKey && e.key === "s")) {
         setIsBlurred(true);
         alert("Screenshots are disabled for protected medical records.");
         e.preventDefault();
      }
    };

    const handleBlur = () => {
        setIsBlurred(true); // Blur when window loses focus (e.g. snipping tool overlay)
    }

    const handleFocus = () => {
        setIsBlurred(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    // Also disable right click context menu globally when viewer is open
    const handleContextMenu = (e) => e.preventDefault();
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("contextmenu", handleContextMenu);
    }
  }, [agreed]);

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

  const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      })
  }

  return (
    <Card className="border-red-200 shadow-md w-full max-w-4xl mx-auto my-4 select-none">
      <CardHeader className="bg-red-50 border-b border-red-100 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-red-800">
            <Lock className="h-4 w-4" />
            <CardTitle className="text-base font-semibold">Protected Medical Record</CardTitle>
        </div>
        <div className="flex items-center gap-4">
             {agreed && (
               <div className="flex items-center space-x-2">
                 <Switch id="spotlight" checked={spotlightMode} onCheckedChange={setSpotlightMode} />
                 <Label htmlFor="spotlight" className="text-xs text-gray-600 flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> Privacy Spotlight
                 </Label>
               </div>
             )}
            {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    Close
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
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
            <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className="relative bg-black min-h-[500px] flex items-center justify-center group overflow-hidden cursor-crosshair"
            >
                {/* Blur Overlay when focus is lost */}
                {isBlurred && (
                    <div className="absolute inset-0 z-50 backdrop-blur-3xl bg-black/50 flex flex-col items-center justify-center text-white">
                        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
                        <h3 className="text-xl font-bold">Security Protection Active</h3>
                        <p className="mt-2 text-gray-300">Content hidden to prevent unauthorized capture.</p>
                        <p className="text-sm text-gray-400">Click here to resume viewing.</p>
                    </div>
                )}
            
                {/* Spotlight Overlay (Anti-Phone-Camera) */}
                {spotlightMode && !isBlurred && (
                     <div 
                        className="absolute inset-0 z-40 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.95) 100%)`
                        }}
                     />
                )}

                {/* Security Overlay / Watermark */}
                <div className={`absolute inset-0 pointer-events-none z-20 flex flex-wrap content-center justify-center opacity-15 select-none ${isBlurred ? 'hidden' : ''}`}>
                     {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="text-white/20 text-xl font-bold m-12 transform -rotate-45 whitespace-nowrap">
                            DONOTSHARE • {account?.slice(0,6)}...
                        </div>
                     ))}
                </div>

                {/* Content Viewer */}
                <div className={`w-full h-[600px] relative z-10 bg-white transition-all duration-200 ${isBlurred ? 'blur-xl opacity-10' : ''}`}>
                    <iframe 
                        src={fileUrl} 
                        className="w-full h-full border-0"
                        title="Medical Record"
                        sandbox="allow-scripts allow-same-origin" 
                    />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 text-center z-30">
                    Viewing Session Active • Access Logged • {spotlightMode ? "Spotlight Active" : "Anti-Capture Enabled"}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
