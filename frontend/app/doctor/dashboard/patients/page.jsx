"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientsDoctor() {
  const { doctorContract } = useWeb3()
  const [patientWallet, setPatientWallet] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [requestMessage, setRequestMessage] = useState("")

  const requestAccess = async () => {
    if (!patientWallet || !documentId) return
    try {
      const tx = await doctorContract.requestAccess(patientWallet, documentId)
      await tx.wait()
      setRequestMessage("Access request sent successfully ✅")
    } catch (error) {
      console.error("Access request failed:", error)
      setRequestMessage("Failed to send access request ❌")
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Request Patient Data Access</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <input
          type="text"
          placeholder="Patient Wallet Address"
          value={patientWallet}
          onChange={(e) => setPatientWallet(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Document ID"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <Button onClick={requestAccess} className="w-full bg-[#703FA1] hover:bg-[#5a2f81]">
          Request Access
        </Button>
        {requestMessage && <div className="text-sm text-gray-600">{requestMessage}</div>}
      </CardContent>
    </Card>
  )
}
