"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    AlertTriangle, 
    ChevronRight, 
    Clock, 
    CornerDownRight, 
    FileSearch, 
    Lock, 
    Plus, 
    Search, 
    ShieldAlert, 
    ShieldCheck, 
    Siren, 
    User, 
    Users, 
    Zap 
} from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientsDoctor() {
  const { doctorContract, patientContract, emergencyState, knownHospitals, toggleEmergencyMode } = useWeb3()
  
  const [patientsList, setPatientsList] = useState([])
  const [patientDocs, setPatientDocs] = useState([])
  
  const [selectedPatientAddr, setSelectedPatientAddr] = useState("")
  const [manualPatientInput, setManualPatientInput] = useState("")
  const [selectedDocHash, setSelectedDocHash] = useState("")
  const [duration, setDuration] = useState("3600") 
  const [reason, setReason] = useState("") 
  
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const emergencyMode = emergencyState?.active;

  // Load Patients
  useEffect(() => {
    const fetchPatients = async () => {
      if (!doctorContract || !patientContract) return;
      try {
        setInitLoading(true)
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
            } catch(e) { return null; }
        }));
        setPatientsList(details.filter(p => p !== null));
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setInitLoading(false)
      }
    };
    fetchPatients();
  }, [doctorContract, patientContract]);

  const fetchRecordsForAddress = async (addr) => {
      if (!addr || !patientContract) return;
      setLoading(true)
      try {
          let pid;
          const patient = patientsList.find(p => p.wallet.toLowerCase() === addr.toLowerCase());
          
          if (patient) {
              pid = patient.id;
          } else {
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
              hash: r.ipfsHash,
              name: r.fileName,
              date: r.recordDate || "Unknown Date",
              hospital: r.hospital || "General Node"
          }));
          setPatientDocs(docs);
          toast.success(`Records Synchronized`);
      } catch (err) {
          toast.error("Records Locked or Unavailable");
          setPatientDocs([]);
      } finally {
        setLoading(false)
      }
  };

  const handlePatientSelect = (addr) => {
      setSelectedPatientAddr(addr);
      setSelectedDocHash("");
      fetchRecordsForAddress(addr);
  };

  const requestAccess = async () => {
    if (!selectedPatientAddr || !selectedDocHash || !reason.trim()) {
        toast.error("Missing Security Parameters");
        return;
    }
    
    setLoading(true);
    try {
        if (!emergencyMode) {
            const doc = patientDocs.find(d => d.hash === selectedDocHash);
            const tx = await doctorContract.requestAccess(selectedPatientAddr, selectedDocHash, doc.name, duration, reason);
            toast.promise(tx.wait(), {
                loading: 'Initializing Consent Handshake...',
                success: 'Access Requested!',
                error: 'Handshake Rejected'
            });
            await tx.wait();
        } else {
            const targetHosp = emergencyState.hospital;
            if (!targetHosp) throw new Error("No Duty Station Initialized");

            const doc = patientDocs.find(d => d.hash === selectedDocHash);
            const tx = await doctorContract.emergencyBreakGlass(selectedPatientAddr, selectedDocHash, doc.name, reason, targetHosp);
            toast.promise(tx.wait(), {
                loading: 'BYPASSING SECURITY...',
                success: 'AUTONOMOUS ACCESS GRANTED',
                error: 'Emergency Bypass Reverted'
            });
            await tx.wait();
        }
        setReason("");
    } catch (err) {
        toast.error(err.reason || err.message);
    } finally {
        setLoading(false);
    }
  }

  if (initLoading) {
      return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Skeleton className="lg:col-span-4 h-[600px] rounded-[2.5rem]" />
              <Skeleton className="lg:col-span-8 h-[600px] rounded-[2.5rem]" />
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-outfit">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Roster Management</h1>
                <p className="text-slate-500 font-medium">Manage patient connections and secure record synchronization.</p>
            </div>
            <Button 
                onClick={toggleEmergencyMode}
                variant={emergencyMode ? "destructive" : "outline"}
                className={`h-14 px-8 rounded-2xl font-black transition-all active:scale-95 shadow-xl ${
                    emergencyMode ? 'animate-pulse shadow-red-200' : 'bg-white border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                }`}
            >
                {emergencyMode ? (
                    <span className="flex items-center gap-2"><Lock className="h-5 w-5" /> DISABLE OVERRIDE</span>
                ) : (
                    <span className="flex items-center gap-2"><Siren className="h-5 w-5" /> EMERGENCY OVERRIDE</span>
                )}
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: PATIENT ROSTER */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center justify-between">
                            Roster
                            <Badge className="bg-slate-100 text-slate-500 border-none font-black">{patientsList.length}</Badge>
                        </CardTitle>
                        <div className="relative mt-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search Roster..."
                                className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 px-6 space-y-3 pb-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {patientsList.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handlePatientSelect(p.wallet)}
                                className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all border-2 text-left ${
                                    selectedPatientAddr.toLowerCase() === p.wallet.toLowerCase()
                                    ? 'bg-indigo-50 border-indigo-100 shadow-lg shadow-indigo-100/50'
                                    : 'bg-white border-transparent hover:border-slate-100'
                                }`}
                            >
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black transition-colors ${
                                    selectedPatientAddr.toLowerCase() === p.wallet.toLowerCase()
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                }`}>
                                    {p.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black text-sm truncate ${selectedPatientAddr.toLowerCase() === p.wallet.toLowerCase() ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {p.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">@{p.username}</p>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform ${
                                    selectedPatientAddr.toLowerCase() === p.wallet.toLowerCase() ? 'translate-x-1 text-indigo-400' : 'text-slate-200'
                                }`} />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* MANUAL AD-HOC ENTRY */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden group">
                    <CardHeader className="p-8">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Sync Unlisted Node</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="0x Wallet Address"
                                value={manualPatientInput}
                                onChange={(e) => setManualPatientInput(e.target.value)}
                                className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border-none text-[10px] font-mono focus:ring-2 focus:ring-slate-100 outline-none"
                             />
                             <Button 
                                onClick={() => handlePatientSelect(manualPatientInput)}
                                size="icon" 
                                className="h-12 w-12 rounded-xl bg-slate-900 shadow-lg"
                             >
                                <Zap className="h-4 w-4" />
                             </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: ACCESS CONTROL CONSOLE */}
            <div className="lg:col-span-8 space-y-8">
                
                {emergencyMode && (
                    <div className="bg-neutral-950 rounded-[2.5rem] p-10 border border-red-900/50 shadow-2xl shadow-red-500/10 relative overflow-hidden group transition-all">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-red-600 rounded-2xl animate-pulse">
                                    <ShieldAlert className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Protocol: Break-Glass</h2>
                                    <p className="text-red-400 font-bold text-sm">Elevated node authority active for station: <span className="text-white font-mono">{emergencyState.hospital || "UNAUTHORIZED"}</span></p>
                                </div>
                            </div>
                            <p className="text-neutral-400 text-sm max-w-2xl font-medium leading-relaxed">
                                You are about to initiate an <span className="text-white font-black underline decoration-red-500">autonomous records seizure</span>. This bypasses patient consent 
                                and triggers a high-priority audit event on the blockchain. Ensure medical necessity is documented below.
                            </p>
                        </div>
                        <CornerDownRight className="absolute bottom-6 right-6 h-12 w-12 text-red-900/20" />
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]" />
                    </div>
                )}

                <Card className={`rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white min-h-[500px] transition-all duration-500 ${emergencyMode ? 'ring-2 ring-red-500/20' : ''}`}>
                    <CardHeader className="p-10 pb-0">
                        <CardTitle className="text-2xl font-black flex items-center justify-between">
                            Secured Handshake
                            {selectedPatientAddr && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                    Target Locked
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="text-lg font-medium">Select a resource to authorize for current clinical session.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                        
                        {!selectedPatientAddr ? (
                            <div className="py-20 text-center space-y-6 border-4 border-dashed border-slate-50 rounded-[3rem]">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <User className="h-10 w-10 text-slate-200" />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Awaiting Target Selection</p>
                                    <p className="text-slate-300 text-sm mt-2">Select a patient from the roster to begin synchronization.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Resource Repository</label>
                                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />) :
                                             patientDocs.length === 0 ? <p className="text-xs font-bold text-slate-300 italic p-4 bg-slate-50 rounded-2xl">No synchronized records found.</p> :
                                             patientDocs.map((d) => (
                                                <button
                                                    key={d.hash}
                                                    onClick={() => setSelectedDocHash(d.hash)}
                                                    className={`group p-4 rounded-2xl border-2 text-left transition-all ${
                                                        selectedDocHash === d.hash 
                                                        ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-50' 
                                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`font-black text-sm ${selectedDocHash === d.hash ? 'text-emerald-900' : 'text-slate-700'}`}>{d.name}</p>
                                                        {selectedDocHash === d.hash && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-60">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{d.date}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {!emergencyMode && (
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Session Duration</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { l: '1h', v: '3600' },
                                                    { l: '24h', v: '86400' },
                                                    { l: '7d', v: '604800' }
                                                ].map(t => (
                                                    <button 
                                                        key={t.v}
                                                        onClick={() => setDuration(t.v)}
                                                        className={`h-11 rounded-xl text-[10px] font-black transition-all ${
                                                            duration === t.v ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {t.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${emergencyMode ? 'text-red-600' : 'text-indigo-500'}`}>Clinical Justification</label>
                                        <textarea 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder={emergencyMode ? "STATE EMERGENCY REASON FOR SEIZURE..." : "Specify reason for data request..."}
                                            className={`w-full min-h-[160px] p-5 rounded-[2rem] bg-slate-50 border-none outline-none text-sm font-medium focus:ring-4 transition-all ${
                                                emergencyMode ? 'focus:ring-red-100 placeholder:text-red-200 text-red-900' : 'focus:ring-indigo-50 text-slate-700'
                                            }`}
                                        />
                                    </div>

                                    <Button 
                                        onClick={requestAccess}
                                        disabled={loading || !selectedDocHash || !reason}
                                        className={`w-full h-16 rounded-2xl font-black text-base shadow-2xl transition-all active:scale-95 ${
                                            emergencyMode 
                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' 
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                        }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2"><div className="animate-spin h-5 w-5 border-4 border-white/20 border-t-white rounded-full" /> SECURING NODE...</span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {emergencyMode ? <Zap className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                                {emergencyMode ? "INITIALIZE SEIZURE" : "AUTHORIZE HANDSHAKE"}
                                            </span>
                                        )}
                                    </Button>
                                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        Immutable Proof Generated Upon Confirmation
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}
