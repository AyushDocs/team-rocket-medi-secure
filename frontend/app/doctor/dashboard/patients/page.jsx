"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Siren } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientsDoctor() {
  const { doctorContract, patientContract, emergencyState, knownHospitals } = useWeb3()
  const [patientsList, setPatientsList] = useState([])
  const [selectedPatientAddr, setSelectedPatientAddr] = useState("")
  const [manualPatientInput, setManualPatientInput] = useState("")
  const [selectedAuthHospital, setSelectedAuthHospital] = useState(knownHospitals?.[0]?.address || "")
  const [customAuthHospital, setCustomAuthHospital] = useState("")
  
  const [patientDocs, setPatientDocs] = useState([])
  const [selectedDocHash, setSelectedDocHash] = useState("")
  const [duration, setDuration] = useState("300") 
  const [reason, setReason] = useState("") 
  
  const [loading, setLoading] = useState(false)
  const emergencyMode = emergencyState?.active;

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
  // Sync selected hospital from Global Emergency State
  useEffect(() => {
    if (emergencyState && emergencyState.active && emergencyState.hospital) {
          const addr = emergencyState.hospital;
          if (knownHospitals?.find(h => h.address.toLowerCase() === addr.toLowerCase())) {
               setSelectedAuthHospital(addr);
          } else {
               setSelectedAuthHospital("custom");
               setCustomAuthHospital(addr);
          }
      }
  }, [emergencyState?.active, emergencyState?.hospital, knownHospitals]);



  // Set initial hospital once list loads if not already set
  useEffect(() => {
      if (!selectedAuthHospital && knownHospitals?.[0]?.address) {
          setSelectedAuthHospital(knownHospitals[0].address);
      }
  }, [knownHospitals, selectedAuthHospital]);

  // Fetch Helper
  const fetchRecordsForAddress = async (addr) => {
      if (!addr || !patientContract) return;
      try {
          let pid;
          const patient = patientsList.find(p => p.wallet.toLowerCase() === addr.toLowerCase());
          
          if (patient) {
              pid = patient.id;
          } else {
              // Resolve ID from chain
              if (!patientContract) return;
              const id = await patientContract.walletToPatientId(addr);
              if (id.toString() === "0") {
                  toast.error("Patient not registered");
                  setPatientDocs([]);
                  return;
              }
              pid = id;
          }

          const records = await patientContract.getMedicalRecords(pid);
          const docs = records.map((r) => ({
              hash: r.ipfsHash || r[0],
              name: r.fileName || r[1],
              date: r.recordDate || r[2] || "Unknown Date",
              hospital: r.hospital || r[3] || "Unknown Location"
          }));
          setPatientDocs(docs);
          toast.success(`Loaded ${docs.length} records`);
      } catch (err) {
          console.error("Error fetching records:", err);
          toast.error("Failed to fetch records");
          setPatientDocs([]);
      }
  };

  const handlePatientChange = async (e) => {
      const val = e.target.value;
      if (val === "manual") {
          setSelectedPatientAddr("manual");
          setPatientDocs([]);
      } else {
          setSelectedPatientAddr(val);
          setSelectedDocHash("");
          fetchRecordsForAddress(val);
      }
  };

  const handleManualBlur = (e) => {
      const val = e.target.value;
      if (val && val.startsWith("0x") && val.length === 42) {
           fetchRecordsForAddress(val);
      }
  };

  const requestAccess = async () => {
    if (!selectedPatientAddr || !selectedDocHash || !reason.trim()) {
        toast.error("Please complete all fields.");
        return;
    }
    
    setLoading(true);
    
    // Normal Access Request
    if (!emergencyMode) {
        const promise = new Promise(async (resolve, reject) => {
             try {
                const doc = patientDocs.find(d => d.hash === selectedDocHash);
                const tx = await doctorContract.requestAccess(selectedPatientAddr, selectedDocHash, doc.name, duration, reason);
                await tx.wait();
                resolve();
             } catch(e) { reject(e); } finally { setLoading(false); }
        });

        toast.promise(promise, {
             loading: 'Sending Access Request...',
             success: 'Request Sent to Patient!',
             error: (e) => `Error: ${e.message}`
        });
    } 
    // EMERGENCY BREAK GLASS
    else {
        const promise = new Promise(async (resolve, reject) => {
             try {
                const targetHosp = selectedAuthHospital === "custom" ? customAuthHospital : selectedAuthHospital;
                if (!targetHosp || targetHosp.length < 40) throw new Error("Invalid Authorizing Hospital Address");

                // Resolve Patient Addr
                const pAddr = selectedPatientAddr === "manual" ? manualPatientInput : selectedPatientAddr;
                if (!pAddr || pAddr.length < 40) throw new Error("Invalid Patient Address");

                const doc = patientDocs.find(d => d.hash === selectedDocHash);
                const tx = await doctorContract.emergencyBreakGlass(pAddr, selectedDocHash, doc.name, reason, targetHosp);
                await tx.wait();
                resolve();
             } catch(e) { reject(e); } finally { setLoading(false); }
        });

        toast.promise(promise, {
             loading: 'ACTIVATING EMERGENCY PROTOCOL...',
             success: 'ACCESS FORCEFULLY GRANTED. AUDIT LOGGED.',
             error: (e) => `Emergency Failed: ${e.message}`
        });
    }
  }

  return (
    <Card className={emergencyMode ? "border-red-500 shadow-red-100 shadow-lg transition-all" : "transition-all"}>
      <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
                {emergencyMode ? <Siren className="text-red-600 animate-pulse" /> : null}
                {emergencyMode ? "EMERGENCY ACCESS PROTOCOL" : "Request Patient Data Access"}
            </CardTitle>
            <Button 
                variant={emergencyMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => setEmergencyMode(!emergencyMode)}
                className={emergencyMode ? "animate-pulse font-bold" : ""}
            >
                {emergencyMode ? "Disable Emergency Mode" : "⚠ Emergency Override"}
            </Button>
          </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {emergencyMode && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 space-y-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                        <strong className="block font-bold">WARNING: YOU ARE BREAKING GLASS.</strong>
                        <p>This action will unintentionally grant access and trigger an immediate audit alert on the blockchain. Use ONLY for life-threatening situations.</p>
                    </div>
                </div>
                
                {/* Hospital Selection for Duty Verification */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-red-800 uppercase">Authorizing Duty Station</label>
                    <select 
                        className="w-full p-2 border border-red-300 rounded bg-red-100 text-red-900 font-medium"
                        value={selectedAuthHospital}
                        onChange={(e) => setSelectedAuthHospital(e.target.value)}
                    >
                         {[...(knownHospitals || [])].sort((a,b) => {
                             const aActive = emergencyState?.active && a.address.toLowerCase() === emergencyState.hospital.toLowerCase();
                             const bActive = emergencyState?.active && b.address.toLowerCase() === emergencyState.hospital.toLowerCase();
                             if (aActive) return -1;
                             if (bActive) return 1;
                             return 0;
                         }).map(h => (
                             <option key={h.address} value={h.address}>
                                {emergencyState?.active && h.address.toLowerCase() === emergencyState.hospital.toLowerCase() ? "🚨 BREAKGLASS ACTIVE: " : ""}{h.name}
                             </option>
                         ))}
                         <option value="custom">Other (Enter via Custom)...</option>
                    </select>
                    {selectedAuthHospital === "custom" && (
                        <input 
                            type="text"
                            className="w-full p-2 border border-red-300 rounded bg-white text-red-900 font-mono mt-2"
                            placeholder="0x... (Hospital Address)"
                            value={customAuthHospital}
                            onChange={(e) => setCustomAuthHospital(e.target.value)}
                        />
                    )}
                </div>
            </div>
        )}

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
                <option value="manual">➕ Enter Wallet Address Manually...</option>
            </select>
            {selectedPatientAddr === "manual" && (
                <div className="flex gap-2 mt-2">
                    <input 
                        type="text" 
                        className="w-full p-2 border rounded font-mono text-sm"
                        placeholder="Patient Wallet Address (0x...)"
                        value={manualPatientInput}
                        onChange={(e) => setManualPatientInput(e.target.value)}
                        onBlur={handleManualBlur}
                    />
                    <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => fetchRecordsForAddress(manualPatientInput)}
                        disabled={!manualPatientInput}
                    >
                        Load
                    </Button>
                </div>
            )}
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
            <label className="text-sm font-medium text-gray-700">Reason for Access {emergencyMode && <span className="text-red-500">*MANDATORY*</span>}</label>
            <input 
                type="text"
                placeholder={emergencyMode ? "STATE EMERGENCY REASON (Recorded Immutably)" : "e.g. Annual Checkup"}
                className={`w-full p-2 border rounded ${emergencyMode ? "border-red-300 bg-red-50 placeholder-red-300" : ""}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
        </div>

        {/* Duration Select (Hidden for Emergency -> Fixed 24h) */}
        {!emergencyMode && (
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
        )}

        <Button 
            onClick={requestAccess} 
            className={`w-full ${emergencyMode ? "bg-red-600 hover:bg-red-700 text-white font-bold py-3" : "bg-[#703FA1] hover:bg-[#5a2f81]"}`}
            disabled={loading || !selectedPatientAddr || !selectedDocHash || !reason}
        >
          {loading ? "Processing..." : (emergencyMode ? "🚨 CONFIRM EMERGENCY ACCESS 🚨" : "Request Access")}
        </Button>
      </CardContent>
    </Card>
  )
}
