"use client"

import { ethers } from "ethers"
import { Download, Loader2, QrCode, ShieldAlert, Zap, Share2, RefreshCcw } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { useState } from "react"
import { toast } from "sonner"
import { useWeb3 } from "../context/Web3Context"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { motion, AnimatePresence } from "framer-motion"

export default function EmergencyMagicLink() {
  const { patientContract, account } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [magicLink, setMagicLink] = useState("")
  const [secret, setSecret] = useState("")

  const generateLink = async () => {
    if (!patientContract || !account) {
      toast.error("Handshake Required: Connect Wallet")
      return
    }

    try {
      setLoading(true)
      const randomBytes = ethers.randomBytes(16)
      const randomSecret = ethers.hexlify(randomBytes)
      setSecret(randomSecret)
      const hashedSecret = ethers.keccak256(randomBytes)

      const patientId = await patientContract.walletToPatientId(account)
      if (patientId.toString() === "0") {
        toast.error("Critical: Identity not found in Patient Registry")
        return
      }

      const tx = await patientContract.setEmergencyAccessHash(hashedSecret)
      toast.info("Transmitting to MediSecure Registry...")
      await tx.wait()

      const baseUrl = window.location.origin
      const link = `${baseUrl}/emergency-view?p=${patientId.toString()}&s=${randomSecret}`
      setMagicLink(link)
      
      toast.success("Emergency Vault Link Minted.")
    } catch (err) {
      console.error(err)
      toast.error("Registry Sync Failed")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(magicLink)
    toast.success("Safe-Link Copied.")
  }

  const downloadQR = () => {
    const canvas = document.getElementById("emergency-qr")
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png")
        .replace("image/png", "image/octet-stream")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = "sanjeevni-emergency-vault.png"
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <Card className="card-premium border-none bg-gradient-to-br from-red-600 to-rose-700 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <ShieldAlert size={140} />
            </div>
            
            <CardHeader className="relative z-10 pt-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
                        <Zap className="text-amber-300 animate-pulse" size={24} />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Emergency Magic Link</CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100 opacity-80">One-Tap Life Saving Protocol</p>
                    </div>
                </div>
                <CardDescription className="text-red-100 font-medium text-xs mt-4 leading-relaxed opacity-90">
                    Generate an encrypted QR for your physical identity. Emergency responders can access your clinical blueprint for 60 minutes without MFA.
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10 pb-8">
                <AnimatePresence mode="wait">
                    {!magicLink ? (
                        <motion.div
                            key="btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Button 
                                onClick={generateLink} 
                                disabled={loading}
                                className="w-full bg-white text-red-600 font-black py-8 rounded-[2rem] shadow-2xl shadow-red-900/20 hover:bg-red-50 hover:scale-[1.02] transition-all text-lg active:scale-95"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" /> Authorizing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <QrCode size={20} /> Generate Vault QR
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="qr"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-3xl text-slate-900"
                        >
                            <div className="p-4 bg-slate-50 rounded-[2rem] border-4 border-slate-100">
                                <QRCodeCanvas 
                                    id="emergency-qr"
                                    value={magicLink} 
                                    size={180}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                            
                            <div className="w-full space-y-3">
                                <div className="flex gap-2">
                                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl py-6" onClick={downloadQR}>
                                        <Download size={16} className="mr-2" /> Save QR
                                    </Button>
                                    <Button variant="outline" className="flex-1 border-2 border-slate-100 text-slate-800 font-black rounded-2xl py-6" onClick={copyLink}>
                                        <Share2 size={16} className="mr-2" /> Copy Link
                                    </Button>
                                </div>
                                <Button variant="ghost" className="w-full text-slate-400 font-black hover:bg-slate-50 rounded-xl" onClick={() => setMagicLink("")}>
                                    <RefreshCcw size={14} className="mr-2" /> Regenerate Protocol
                                </Button>
                            </div>
                            
                            <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Encrypted Payload URI</p>
                                <p className="text-[10px] font-mono text-slate-500 break-all leading-tight">
                                    {magicLink}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="flex items-center justify-center gap-2">
                    <div className="h-[1px] flex-1 bg-white/20"></div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Keccak-256 Secured</span>
                    <div className="h-[1px] flex-1 bg-white/20"></div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
  )
}
