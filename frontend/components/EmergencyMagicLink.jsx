"use client"

import { ethers } from "ethers"
import { Download, Loader2, QrCode, ShieldAlert } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { useState } from "react"
import { toast } from "sonner"
import { useWeb3 } from "../context/Web3Context"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

export default function EmergencyMagicLink() {
  const { patientContract, account } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [magicLink, setMagicLink] = useState("")
  const [secret, setSecret] = useState("")

  const generateLink = async () => {
    if (!patientContract || !account) {
      toast.error("Please connect your wallet first")
      return
    }

    try {
      setLoading(true)
      
      // 1. Generate a random secret
      const randomBytes = ethers.randomBytes(16)
      const randomSecret = ethers.hexlify(randomBytes) // 32 hex chars (0x...)
      setSecret(randomSecret)

      // 2. Hash the secret (hash the bytes, not the hex string)
      const hashedSecret = ethers.keccak256(randomBytes)

      // 3. Get Patient ID
      const patientId = await patientContract.walletToPatientId(account)
      if (patientId.toString() === "0") {
        toast.error("You are not registered as a patient")
        return
      }

      // 4. Update contract
      const tx = await patientContract.setEmergencyAccessHash(hashedSecret)
      toast.info("Updating emergency access on blockchain...")
      await tx.wait()

      // 5. Create final link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/emergency-view?p=${patientId.toString()}&s=${randomSecret}`
      setMagicLink(link)
      
      toast.success("Emergency Magic Link generated successfully!")
    } catch (err) {
      console.error("Generate Magic Link Error:", err)
      toast.error(err.message || "Failed to generate magic link")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(magicLink)
    toast.success("Link copied to clipboard!")
  }

  const downloadQR = () => {
    const canvas = document.getElementById("emergency-qr")
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png")
        .replace("image/png", "image/octet-stream")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = "emergency-qr.png"
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  return (
    <Card className="border-red-100 bg-red-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-600 w-5 h-5" />
            <CardTitle>Emergency "Magic Link" QR</CardTitle>
        </div>
        <CardDescription>
          Generate a QR code for your wallet/physical card. First responders can scan this to see your vitals for 1 hour without needing your login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!magicLink ? (
          <Button 
            onClick={generateLink} 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><QrCode className="mr-2 h-4 w-4" /> Generate Emergency QR</>}
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
            <QRCodeCanvas 
              id="emergency-qr"
              value={magicLink} 
              size={200}
              level={"H"}
              includeMargin={true}
              imageSettings={{
                src: "/logo.png", // If you have a logo
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
            <div className="text-center space-y-2 w-full">
                <p className="text-sm font-medium text-gray-700">Scan to access medical info</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={downloadQR}>
                        <Download className="w-4 h-4 mr-2" /> Download QR
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyLink}>
                        Copy Link
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setMagicLink("")}>
                        Reset
                    </Button>
                </div>
            </div>
            <div className="w-full p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800 break-all font-mono">
                {magicLink}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
