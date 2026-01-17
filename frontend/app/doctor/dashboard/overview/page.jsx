"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function OverviewDoctor() {
  const { doctorContract, patientContract, account } = useWeb3()
  const [patientIdToAdd, setPatientIdToAdd] = useState("")
  const [status, setStatus] = useState("")
  const [patients, setPatients] = useState([])

  const fetchPatients = async () => {
    if (!doctorContract) return;
    try {
      const result = await doctorContract.getDoctorPatients()
      setPatients(Array.from(result)) 
    } catch (err) {
      console.error("Failed to fetch patients:", err)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [doctorContract, account])

  const handleAddPatient = async (e) => {
    e.preventDefault()
    if (!patientIdToAdd.trim()) return

    setStatus("Adding patient...")
    try {
      let finalId = patientIdToAdd.trim();

      // Check if input is a valid Ethereum address
      if (ethers.isAddress(finalId)) {
          if (!patientContract) {
             setStatus("Patient contract not loaded ❌")
             return;
          }
          const idFromChain = await patientContract.walletToPatientId(finalId)
          if (!idFromChain || idFromChain.toString() === "0") {
             setStatus("This address is not registered as a patient ❌")
             return;
          }
          finalId = idFromChain.toString();
          console.log(`Resolved Address ${patientIdToAdd} to Patient ID: ${finalId}`);
      }

      const tx = await doctorContract.addPatient(finalId)
      await tx.wait()
      setStatus(`Patient Added Successfully (ID: ${finalId}) ✅`)
      setPatientIdToAdd("")
      fetchPatients()
    } catch (err) {
      console.error("Add patient failed:", err)
      setStatus(err.reason || "Failed to add patient ❌")
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Welcome</CardTitle></CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">Manage your patients and request access to their records.</p>
        <form onSubmit={handleAddPatient} className="flex items-center gap-3">
          <input
            type="text"
            value={patientIdToAdd}
            onChange={(e) => setPatientIdToAdd(e.target.value)}
            placeholder="Enter patient ID"
            className="border p-2 rounded flex-1"
          />
          <Button type="submit">Add Patient</Button>
        </form>
        {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
      </CardContent>
    </Card>
  )
}
