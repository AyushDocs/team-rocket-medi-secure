"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function OverviewPatient() {
  const { patientContract, account } = useWeb3()
  const [patientInfo, setPatientInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientContract || !account) return;
      try {
        setLoading(true)
        setError(null)

        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") {
          throw new Error("Patient not registered.")
        }

        const patientDetails = await patientContract.getPatientDetails(patientId)
        
        setPatientInfo({
          name: patientDetails.name,
          age: Number(patientDetails.age),
          bloodType: patientDetails.bloodGroup,
          email: patientDetails.email,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [account, patientContract])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Name: {patientInfo?.name}</p>
        <p>Age: {patientInfo?.age}</p>
        <p>Blood Type: {patientInfo?.bloodType}</p>
        <p>Email: {patientInfo?.email}</p>
      </CardContent>
    </Card>
  )
}
