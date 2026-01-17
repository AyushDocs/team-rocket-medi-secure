"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function AccessRequestsPatient() {
  const { doctorContract, account } = useWeb3()
  const [accessRequests, setAccessRequests] = useState([])
  const [activeAccess, setActiveAccess] = useState([])
  const [historyLogs, setHistoryLogs] = useState([])
  const [modifiedDurations, setModifiedDurations] = useState({}) 

  useEffect(() => {
    if(!doctorContract || !account) return;

    // 1. Fetch Pending Requests
    const fetchRequests = async () => {
      try {
        const filter = doctorContract.filters.AccessRequested(account);
        const events = await doctorContract.queryFilter(filter);
        // We need to filter out requests that have already been granted?
        // Simpler: Just show all requested events that don't have a corresponding Grant event?
        // Or rely on the "Active" list logic. 
        // For now, let's just show raw requests as "Pending" and if they are in "Active", maybe hide them?
        // Let's stick to the previous simple logic: Events = Requests. 
        // Real implementation would check if 'hasAccess' is false on-chain, but that requires iterating.
        // We'll keep the existing logic but maybe filter locally if we find them in active list.
        
        const pastRequests = events.map(event => ({
          doctor: event.args[1], 
          ipfsHash: event.args[2], 
          fileName: event.args[3] || "Unnamed Document",
          duration: event.args[4] ? event.args[4].toString() : "300"
        }));
        setAccessRequests(pastRequests);
      } catch (error) { console.error(error); }
    };

    // 2. Fetch History & Active State
    const fetchHistory = async () => {
        try {
            const grantFilter = doctorContract.filters.AccessGranted(account);
            const revokeFilter = doctorContract.filters.AccessRevoked(account);
            
            const [grants, revokes] = await Promise.all([
                doctorContract.queryFilter(grantFilter),
                doctorContract.queryFilter(revokeFilter)
            ]);
            
            // Explicitly map args by index to avoid 'undefined' issues
            const allEvents = [
                ...grants.map(e => ({ 
                    type: 'GRANTED', 
                    doctor: e.args[1], // Index 1 is doctor in AccessGranted(patient, doctor, ...)
                    ipfsHash: e.args[2],
                    timestamp: e.args[3], 
                    duration: e.args[4],
                    blockNumber: e.blockNumber 
                })),
                ...revokes.map(e => ({ 
                    type: 'REVOKED', 
                    doctor: e.args[1], // Index 1 is doctor in AccessRevoked(patient, doctor, ...)
                    ipfsHash: e.args[2],
                    timestamp: e.args[3], 
                    blockNumber: e.blockNumber 
                }))
            ].sort((a,b) => b.blockNumber - a.blockNumber); // Newest first

            setHistoryLogs(allEvents);

            // Determine Active Access
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
                        // It is active
                        activeList.push({
                            doctor: e.doctor,
                            ipfsHash: e.ipfsHash,
                            grantTime,
                            duration,
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

    // Listeners
    const handleRequested = (p, d, h, f, dur) => {
        if(p.toLowerCase() === account.toLowerCase()) 
            setAccessRequests(prev => [...prev, { doctor: d, ipfsHash: h, fileName: f, duration: dur.toString() }]);
    }
    // We should also listen for Grant/Revoke to update UI in real-time
    const handleStateChange = () => { fetchHistory(); };

    doctorContract.on("AccessRequested", handleRequested);
    doctorContract.on("AccessGranted", handleStateChange);
    doctorContract.on("AccessRevoked", handleStateChange);

    return () => {
        doctorContract.off("AccessRequested", handleRequested);
        doctorContract.off("AccessGranted", handleStateChange);
        doctorContract.off("AccessRevoked", handleStateChange);
    };
  }, [account, doctorContract]);

  const handleAccessResponse = async (doctor, ipfsHash, grant) => {
    if(!doctorContract) return;
    try {
      if (grant) {
        const key = `${doctor}-${ipfsHash}`;
        const req = accessRequests.find(r => r.doctor === doctor && r.ipfsHash === ipfsHash);
        const finalDuration = modifiedDurations[key] || req?.duration || "300";
        const tx = await doctorContract.grantAccess(doctor, ipfsHash, finalDuration);
        await tx.wait();
      }
      // Remove from pending list locally
      setAccessRequests(prev => prev.filter(r => r.doctor !== doctor || r.ipfsHash !== ipfsHash));
    } catch (error) { console.error(error); }
  };

  const handleRevoke = async (doctor, ipfsHash) => {
      try {
          const tx = await doctorContract.revokeAccess(doctor, ipfsHash);
          await tx.wait();
          // Event listener will refresh history/active list
      } catch(e) { console.error(e); }
  }

  const formatDuration = (sec) => {
      const s = Number(sec); // Explicit conversion for BigInt consideration
      if(s < 60) return `${s}s`;
      if(s < 3600) return `${Math.floor(s/60)}m`;
      if(s < 86400) return `${(s/3600).toFixed(1)}h`;
      return `${(s/86400).toFixed(1)}d`;
  }

  return (
    <div className="space-y-6">
    {/* Active Access Section */}
    <Card className="border-green-100 bg-green-50/30">
        <CardHeader><CardTitle className="text-green-800">Active Permissions</CardTitle></CardHeader>
        <CardContent>
            {activeAccess.length === 0 ? <p className="text-gray-500 text-sm">No active access grants.</p> : (
                <ul className="space-y-3">
                    {activeAccess.map((item, i) => (
                        <li key={i} className="flex justify-between items-center p-3 bg-white border border-green-200 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-800">Doctor: {item.doctor.slice(0,8)}...</p>
                                <p className="text-xs text-green-600">Expires in: {formatDuration(item.remaining)}</p>
                                <p className="text-xs text-gray-400">Doc: {item.ipfsHash.slice(0,10)}...</p>
                            </div>
                            <Button onClick={() => handleRevoke(item.doctor, item.ipfsHash)} variant="destructive" size="sm">
                                Revoke
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </CardContent>
    </Card>

    {/* Pending Requests */}
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {accessRequests.length === 0 ? (
          <p className="text-gray-500">No pending access requests.</p>
        ) : (
          <ul className="space-y-4">
            {accessRequests.map((request, index) => {
               const key = `${request.doctor}-${request.ipfsHash}`;
               const currentDuration = modifiedDurations[key] || request.duration;
               
               return (
              <li key={index} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{request.fileName}</h3>
                    <p className="text-sm text-gray-600">Requested by: <span className="font-mono bg-gray-100 px-1 rounded">{request.doctor.slice(0,8)}...</span></p>
                    <div className="mt-2 flex items-center gap-2">
                         <span className="text-xs font-medium text-gray-500">Access Duration:</span>
                         <select 
                            className="text-sm border rounded bg-gray-50 p-1"
                            value={currentDuration}
                            onChange={(e) => setModifiedDurations({...modifiedDurations, [key]: e.target.value})}
                         >
                            <option value="300">5 Mins</option>
                            <option value="900">15 Mins</option>
                            <option value="3600">1 Hour</option>
                            <option value="86400">24 Hours</option>
                            <option value="604800">7 Days</option>
                         </select>
                         <span className="text-xs text-blue-600">({formatDuration(currentDuration)})</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Grant
                  </Button>
                  <Button
                    onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, false)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    Reject
                  </Button>
                </div>
              </li>
            )})}
          </ul>
        )}
      </CardContent>
    </Card>
    
    {/* Audit Log */}
    <Card className="border-gray-200 bg-gray-50">
        <CardHeader><CardTitle className="text-gray-600 text-base">Audit Log</CardTitle></CardHeader>
        <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
                {historyLogs.map((log, i) => (
                    <div key={i} className="text-xs flex gap-2 items-center text-gray-600">
                        <span className={`font-bold px-1.5 py-0.5 rounded ${log.type === 'GRANTED' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {log.type}
                        </span>
                        <span>{new Date(Number(log.timestamp) * 1000).toLocaleString()}</span>
                        <span>- Doc: {log.doctor.slice(0,6)}...</span>
                        {log.type === 'GRANTED' && <span>For {formatDuration(log.duration || log[4])}</span>}
                    </div>
                ))}
                {historyLogs.length === 0 && <p className="text-gray-400 text-xs">No history found.</p>}
            </div>
        </CardContent>
    </Card>
    </div>
  )
}
