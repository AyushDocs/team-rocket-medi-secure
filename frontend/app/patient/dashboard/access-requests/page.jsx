"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, ShieldAlert, Clock, History, Check, X, Zap, ArrowRight, User, Lock } from "lucide-react"

export default function AccessRequestsPatient() {
  const { doctorContract, account, signGrantConsent } = useWeb3()
  const [accessRequests, setAccessRequests] = useState([])
  const [activeAccess, setActiveAccess] = useState([])
  const [historyLogs, setHistoryLogs] = useState([])
  const [modifiedDurations, setModifiedDurations] = useState({}) 
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if(!doctorContract || !account) return;

    const fetchRequests = async () => {
      try {
        const filter = doctorContract.filters.AccessRequested(account);
        const events = await doctorContract.queryFilter(filter);
        
        const pastRequests = events.map(event => ({
          doctor: String(event.args[1]), 
          ipfsHash: String(event.args[2]), 
          fileName: event.args[3] || "Unnamed Document",
          duration: event.args[4] ? event.args[4].toString() : "300",
          reason: event.args[5] || "No Reason Provided"
        }));
        setAccessRequests(pastRequests);
      } catch (error) { console.error(error); }
    };

    const fetchHistory = async () => {
        try {
            const grantFilter = doctorContract.filters.AccessGranted(account);
            const revokeFilter = doctorContract.filters.AccessRevoked(account);
            const requestFilter = doctorContract.filters.AccessRequested(account);
            
            const [grants, revokes, requests] = await Promise.all([
                doctorContract.queryFilter(grantFilter),
                doctorContract.queryFilter(revokeFilter),
                doctorContract.queryFilter(requestFilter)
            ]);
            
            const requestMap = new Map();
            requests.forEach(e => {
                const key = `${String(e.args[1])}-${String(e.args[2])}`;
                if(e.args[5]) requestMap.set(key, String(e.args[5]));
            });

            const allEvents = [
                ...grants.map(e => {
                   const key = `${String(e.args[1])}-${String(e.args[2])}`;
                   return { 
                    type: 'GRANTED', 
                    doctor: String(e.args[1]), 
                    ipfsHash: String(e.args[2]),
                    timestamp: Number(e.args[3]), 
                    duration: Number(e.args[4]),
                    reason: requestMap.get(key) || "Unknown Reason",
                    blockNumber: e.blockNumber 
                }}),
                ...revokes.map(e => ({ 
                    type: 'REVOKED', 
                    doctor: String(e.args[1]), 
                    ipfsHash: String(e.args[2]),
                    timestamp: Number(e.args[3]), 
                    blockNumber: e.blockNumber 
                }))
            ].sort((a,b) => b.blockNumber - a.blockNumber); 

            setHistoryLogs(allEvents);

            const now = Math.floor(Date.now() / 1000);
            const uniquePairs = new Set();
            const activeList = [];

            for (const e of allEvents) {
                const key = `${e.doctor}-${e.ipfsHash}`;
                if (uniquePairs.has(key)) continue;
                uniquePairs.add(key);

                if (e.type === 'GRANTED') {
                    const grantTime = Number(e.timestamp);
                    const duration = Number(e.duration);
                    if (grantTime + duration > now) {
                        activeList.push({
                            doctor: e.doctor,
                            ipfsHash: e.ipfsHash,
                            grantTime,
                            duration,
                            reason: e.reason,
                            remaining: (grantTime + duration) - now
                        });
                    }
                }
            }
            setActiveAccess(activeList);
        } catch(e) { console.error("History error:", e); }
    }

    fetchRequests();
    fetchHistory();

    const handleStateChange = () => { fetchHistory(); fetchRequests(); };

    doctorContract.on("AccessRequested", handleStateChange);
    doctorContract.on("AccessGranted", handleStateChange);
    doctorContract.on("AccessRevoked", handleStateChange);

    return () => {
        doctorContract.off("AccessRequested", handleStateChange);
        doctorContract.off("AccessGranted", handleStateChange);
        doctorContract.off("AccessRevoked", handleStateChange);
    };
  }, [account, doctorContract]);

  const handleAccessResponse = async (doctor, ipfsHash, grant) => {
    if(!doctorContract) return;
    setLoading(true);
    try {
      if (grant) {
        const key = `${doctor}-${ipfsHash}`;
        const req = accessRequests.find(r => r.doctor === doctor && r.ipfsHash === ipfsHash);
        const finalDuration = modifiedDurations[key] || req?.duration || "300";
        
        const tx = await doctorContract.grantAccess(doctor, ipfsHash, finalDuration);
        toast.loading("Transaction in flight...");
        await tx.wait();
        toast.success("Active Session Established.");
      }
      setAccessRequests(prev => prev.filter(r => r.doctor !== doctor || r.ipfsHash !== ipfsHash));
    } catch (error) { 
        console.error(error); 
        toast.error("Handshake failed");
    } finally {
        setLoading(false);
    }
  };

  const handlePermanentConsentGasless = async (doctor) => {
    setLoading(true);
    try {
        const signature = await signGrantConsent(doctor, "Permanent Medical Access");
        
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
        const response = await fetch(`${baseUrl}/api/v1/patient/consent/gasless`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctorAddress: doctor,
                patientAddress: account,
                signature,
                metadataURI: "ipfs://permanent-consent-sbt"
            })
        });

        const responseJson = await response.json();
        if (!response.ok) throw new Error(responseJson.error || "Relay failed");

        const data = responseJson.data || responseJson;

        toast.success("Soulbound Consent Minted (Gasless)!");
        setAccessRequests(prev => prev.filter(r => r.doctor !== doctor));
    } catch (e) {
        console.error(e);
        toast.error(e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRevoke = async (doctor, ipfsHash) => {
      try {
          const tx = await doctorContract.revokeAccess(doctor, ipfsHash);
          await tx.wait();
          toast.success("Permission Revoked.");
      } catch(e) { console.error(e); }
  }

  const formatDuration = (sec) => {
      const s = Number(sec);
      if(s < 60) return `${s}s`;
      if(s < 3600) return `${Math.floor(s/60)}m`;
      if(s < 86400) return `${(s/3600).toFixed(1)}h`;
      return `${(s/86400).toFixed(1)}d`;
  }

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 pb-20"
    >
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Trust Circle</h2>
                <p className="text-slate-500 font-medium">Manage who can view your medical blueprint.</p>
            </div>
            <div className="flex gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">
                   {activeAccess.length} Active Sessions
                </Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Pending Requests Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        <ShieldAlert size={14} className="text-amber-500" /> Inbound Requests
                    </div>
                    
                    <div className="space-y-4">
                        {accessRequests.length === 0 ? (
                            <div className="card-premium bg-slate-50 p-12 text-center border-slate-100 border-dashed border-2">
                                <p className="text-slate-400 font-bold">Safe & Clean. No pending requests found.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {accessRequests.map((request, index) => {
                                    const key = `${request.doctor}-${request.ipfsHash}`;
                                    const currentDuration = modifiedDurations[key] || request.duration;
                                    
                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 20, opacity: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className="card-premium bg-white border-none shadow-xl shadow-slate-200 group overflow-hidden">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                                                <CardContent className="p-8">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                                                    <User size={28} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{request.fileName}</h3>
                                                                    <p className="text-xs font-mono text-slate-400">DOC: {request.doctor.slice(0,12)}...</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl italic">
                                                                <p className="text-sm font-bold text-slate-700">"{request.reason}"</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                                                    <Clock size={14} className="text-slate-400" />
                                                                    <select 
                                                                        className="bg-transparent text-sm font-black text-slate-700 focus:outline-none"
                                                                        value={currentDuration}
                                                                        onChange={(e) => setModifiedDurations({...modifiedDurations, [key]: e.target.value})}
                                                                    >
                                                                        <option value="300">5 Mins</option>
                                                                        <option value="3600">1 Hour</option>
                                                                        <option value="86400">24 Hours</option>
                                                                        <option value="604800">7 Days</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-3 w-full md:w-auto">
                                                            <Button
                                                                onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, true)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-2 px-8"
                                                                disabled={loading}
                                                            >
                                                                <Check size={18} /> Grant Session
                                                            </Button>
                                                            <Button
                                                                onClick={() => handlePermanentConsentGasless(request.doctor)}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 px-8"
                                                                disabled={loading}
                                                            >
                                                                <Zap size={18} /> Forever (Gasless)
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, false)}
                                                                variant="ghost"
                                                                className="text-red-500 font-black hover:bg-red-50 rounded-2xl"
                                                                disabled={loading}
                                                            >
                                                                <X size={18} className="mr-2" /> Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </section>

                {/* Active Permissions Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        <Clock size={14} className="text-emerald-500" /> Active Sessions
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeAccess.map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] flex flex-col justify-between gap-4 group hover:bg-emerald-50 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                                        <Shield className="text-emerald-600" size={20} />
                                    </div>
                                    <Badge className="bg-white text-emerald-600 border-emerald-100 font-black uppercase text-[9px] tracking-widest">
                                        {formatDuration(item.remaining)} Left
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-800 uppercase tracking-widest opacity-60">Authorized Doctor</p>
                                    <p className="text-lg font-black text-slate-800 tracking-tight">{item.doctor.slice(0,10)}...</p>
                                    <p className="text-[10px] font-mono text-slate-400 truncate mt-1">{item.ipfsHash}</p>
                                </div>
                                <Button 
                                    onClick={() => handleRevoke(item.doctor, item.ipfsHash)} 
                                    variant="outline" 
                                    className="w-full border-none bg-white font-black text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-sm"
                                >
                                    Instant Revoke
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="space-y-8">
                {/* Audit History Sidebar */}
                <Card className="card-premium border-none shadow-2xl shadow-slate-100 bg-white sticky top-28">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <History size={20} className="text-indigo-600" />
                            Audit Trail
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {historyLogs.map((log, i) => (
                                <div key={i} className="relative pl-6 pb-6 last:pb-0 group">
                                    <div className="absolute left-0 top-0 h-full w-[2px] bg-slate-100"></div>
                                    <div className={`absolute left-[-4px] top-1.5 h-2.5 w-2.5 rounded-full ${log.type === 'GRANTED' ? 'bg-emerald-500' : 'bg-red-500'} ring-4 ring-white`}></div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${log.type === 'GRANTED' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {log.type}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {new Date(Number(log.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-black text-slate-700">Dr. {log.doctor.slice(0,8)}...</p>
                                        <p className="text-[10px] text-slate-400 font-medium italic">"{log.reason}"</p>
                                        <div className="pt-2">
                                           <div className="h-[1px] w-full bg-slate-50"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {historyLogs.length === 0 && (
                                <p className="text-slate-300 text-sm font-black text-center py-20 italic">No events logged yet.</p>
                            )}
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                <Lock size={12} className="text-indigo-600" /> Compliance Note
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                All access events are cryptographically hashed and indexed in the MediSecure Audit Registry. This log is immutable.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </motion.div>
  )
}
