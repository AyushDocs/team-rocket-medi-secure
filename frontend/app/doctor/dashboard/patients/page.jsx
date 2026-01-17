"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientsDoctor() {
  const { doctorContract, patientContract } = useWeb3()
  const [patientsList, setPatientsList] = useState([])
  const [selectedPatientAddr, setSelectedPatientAddr] = useState("")
  
  const [patientDocs, setPatientDocs] = useState([])
  const [selectedDocHash, setSelectedDocHash] = useState("")
  const [duration, setDuration] = useState("300") 
  const [reason, setReason] = useState("") // New state
  
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  // Load Patients on Mount
  useEffect(() => {
    const fetchPatients = async () => {
      if (!doctorContract || !patientContract) return;
      try {
        const pIds = await doctorContract.getDoctorPatients();
        const details = await Promise.all(Array.from(pIds).map(async (id) => {
            try {
                const d = await patientContract.getPatientDetails(id);
                return {
                    id: id.toString(),
                    name: d.name,
                    username: d.username,
                    wallet: d.walletAddress
                };
            } catch(e) { console.error(e); return null; }
        }));
        setPatientsList(details.filter(p => p !== null));
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };
    fetchPatients();
  }, [doctorContract, patientContract]);

  // Load Documents when Patient Selected
  const handlePatientChange = async (e) => {
      const addr = e.target.value;
      setSelectedPatientAddr(addr);
      setSelectedDocHash("");
      setPatientDocs([]);
      
      if (!addr) return;

      try {
          // Need patient ID to get records
          // We can find it from our local list
          const patient = patientsList.find(p => p.wallet === addr);
          if (!patient) return;

          const records = await patientContract.getMedicalRecords(patient.id);
          // records is struct array: ipfsHash, fileName, recordDate, hospital
          // Map it
          const docs = records.map((r) => ({
              hash: r.ipfsHash || r[0],
              name: r.fileName || r[1],
              date: r.recordDate || r[2] || "Unknown Date",
              hospital: r.hospital || r[3] || "Unknown Location"
          }));
          setPatientDocs(docs);
      } catch (err) {
          console.error("Error fetching records:", err);
      }
  };

  const requestAccess = async () => {
    if (!selectedPatientAddr || !selectedDocHash || !reason.trim()) {
        setStatus("Please complete all fields (Patient, Document, Reason).");
        return;
    }
    
    setLoading(true);
    setStatus("Sending Request...");
    
    try {
      const doc = patientDocs.find(d => d.hash === selectedDocHash);
      if(!doc) throw new Error("Document not found in list");

      const tx = await doctorContract.requestAccess(selectedPatientAddr, selectedDocHash, doc.name, duration, reason);
      await tx.wait();
      setStatus("Access request sent successfully ✅");
    } catch (error) {
      console.error("Access request failed:", error);
      setStatus("Failed to send access request ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Request Patient Data Access</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        
        {/* Patient Select */}
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Select Patient</label>
            <select 
                className="w-full p-2 border rounded bg-white"
                value={selectedPatientAddr}
                onChange={handlePatientChange}
            >
                <option value="">-- Choose Patient --</option>
                {patientsList.map(p => (
                    <option key={p.id} value={p.wallet}>
                        {p.name} (@{p.username})
                    </option>
                ))}
            </select>
        </div>

        {/* Document Select */}
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Select Document</label>
            <select 
                className="w-full p-2 border rounded bg-white"
                value={selectedDocHash}
                onChange={(e) => setSelectedDocHash(e.target.value)}
                disabled={!selectedPatientAddr || patientDocs.length === 0}
            >
                <option value="">-- Choose Document --</option>
                {patientDocs.map((d, i) => (
                    <option key={i} value={d.hash}>
                        {d.name} ({d.date} at {d.hospital})
                    </option>
                ))}
            </select>
        </div>

        {/* Reason Input */}
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Reason for Access</label>
            <input 
                type="text"
                placeholder="e.g. Annual Checkup, Emergency, Second Opinion"
                className="w-full p-2 border rounded"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
        </div>

        {/* Duration Select */}
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Access Duration</label>
            <select 
                className="w-full p-2 border rounded bg-white"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
            >
                <option value="300">5 Minutes</option>
                <option value="900">15 Minutes</option>
                <option value="3600">1 Hour</option>
                <option value="86400">24 Hours</option>
                <option value="604800">7 Days</option>
            </select>
        </div>

        <Button 
            onClick={requestAccess} 
            className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
            disabled={loading || !selectedPatientAddr || !selectedDocHash || !reason}
        >
          {loading ? "Processing..." : "Request Access"}
        </Button>
        {status && <div className="text-sm text-center font-medium text-gray-700">{status}</div>}
      </CardContent>
    </Card>
  )
}
