"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ethers } from "ethers"
import { Activity, Check, ChevronLeft, ChevronRight, UserPlus, X } from "lucide-react"
import { useState, useEffect } from "react"
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useWeb3 } from "../../../../context/Web3Context"

export default function OverviewDoctor() {
  const { doctorContract, patientContract, account } = useWeb3()
  const [patientIdToAdd, setPatientIdToAdd] = useState("")
  const [status, setStatus] = useState("")
  
  const [patientsList, setPatientsList] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [acquisitionData, setAcquisitionData] = useState([])
  const [accessStats, setAccessStats] = useState([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // ... imports

  // ... inside component
  
  const loadDashboardData = async () => {
    if (!doctorContract || !patientContract) {
        console.warn("Contracts not loaded yet. Skipping dashboard data load.", { doctorContract: !!doctorContract, patientContract: !!patientContract });
        return;
    }
    console.log(doctorContract)
    console.log(patientContract)
    console.log('inside load dashboard data')
    try {
      // 1. Fetch Patients (with details)
      const patientIds = await doctorContract.getDoctorPatients()
      const patientDetails = await Promise.all(Array.from(patientIds).map(async (id) => {
          try {
             const details = await patientContract.getPatientDetails(id)
             return {
                 id: id.toString(),
                 name: details.name,
                 username: details.username, // Added username
                 email: details.email,
                 wallet: details.walletAddress
             }
          } catch(e) { console.error("Error fetching patient details:", e); return null }
      }))
      const validPatients = patientDetails.filter(p => p !== null);
      setPatientsList(validPatients)

      // 2. Fetch Access Logs & Stats
      const accessList = await doctorContract.getAccessList();
      console.log(accessList)
      
      // Helper to find username by address
      const findUsername = (addr) => {
          const p = validPatients.find(p => p.wallet.toLowerCase() === addr.toLowerCase());
          return p ? p.username : (addr.slice(0,6) + '...');
      }

      const accessLogs = accessList.map(item => ({
          patientAddr: item.patient,
          patientName: findUsername(item.patient),
          fileName: item.fileName || "Document",
          hasAccess: item.hasAccess,
          hash: item.ipfsHash
      })).reverse().slice(0, 10); // Last 10
      setRecentLogs(accessLogs);

      // Access Stats for Pie Chart
      const granted = accessList.filter(a => a.hasAccess).length;
      const denied = accessList.length - granted;
      setAccessStats([
          { name: 'Granted', value: granted },
          { name: 'Pending/Denied', value: denied }
      ]);
      
      // ... (Acquisition Data logic remains same)
      const currentCount = patientIds.length;
      const mockHistory = [
          { name: 'Mon', patients: Math.max(0, currentCount - 5) },
          { name: 'Tue', patients: Math.max(0, currentCount - 3) },
          { name: 'Wed', patients: Math.max(0, currentCount - 2) },
          { name: 'Thu', patients: Math.max(0, currentCount - 1) },
          { name: 'Fri', patients: currentCount }, // Today
      ];
      setAcquisitionData(mockHistory);

    } catch (err) {
      console.error("Dashboard data load failed:", err)
    }
  }

  useEffect(() => {
    if (doctorContract && patientContract && account) {
        loadDashboardData()
    }
  }, [doctorContract, patientContract, account])

  const handleAddPatient = async (e) => {
    e.preventDefault()
    if (!patientIdToAdd.trim()) return

    setStatus("Adding patient...")
    try {
      let finalId = patientIdToAdd.trim();
      let inputIsUsername = false;

      const isAddress = ethers.isAddress(finalId);
      const isNumber = /^\d+$/.test(finalId);

      if (!isAddress && !patientContract) {
          setStatus("Patient contract error ❌"); return;
      }

      if (!isAddress) {
          const idFromUsername = await patientContract.getPatientIdByUsername(finalId);
          if (idFromUsername && idFromUsername.toString() !== "0") {
              finalId = idFromUsername.toString();
              inputIsUsername = true;
          } else if (isNumber) {
              // It's a number, assume ID.
              // We could verify if ID exists but Doctor contract will revert if invalid? 
              // Better to verify.
              const details = await patientContract.getPatientDetails(finalId).catch((e) => {
                  console.error(e);
                  return null;
              });
              if (!details || details.patientId.toString() === "0") {
                  setStatus("Invalid Patient ID or Username ❌");
                  return;
              }
          } else {
             setStatus("Patient not found (Invalid Username) ❌");
             return;
          }
      } else {
          // It's an address
          const idFromChain = await patientContract.walletToPatientId(finalId)
          if (!idFromChain || idFromChain.toString() === "0") {
             setStatus("Address not registered ❌")
             return;
          }
          finalId = idFromChain.toString();
      }

      const tx = await doctorContract.addPatient(finalId)
      await tx.wait()
      setStatus(`Patient Added Successfully ✅`)
      setPatientIdToAdd("")
      loadDashboardData()
    } catch (err) {
      console.error("Add patient failed:", err)
      setStatus(err.reason || "Failed to add patient ❌")
    }
  }
  
  // Pagination Logic
  const totalPages = Math.ceil(patientsList.length / itemsPerPage);
  const currentPatients = patientsList.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
        {/* Top Section: Welcome & Add Patient */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="md:col-span-2">
                 <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/> Dashboard Overview</CardTitle></CardHeader>
                 <CardContent>
                     <p className="text-gray-600">Welcome back, Doctor. You have <span className="font-bold text-blue-600">{patientsList.length}</span> active patients and <span className="font-bold text-green-600">{accessStats[0]?.value || 0}</span> authorized documents.</p>
                 </CardContent>
             </Card>
             <Card>
                 <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5"/> Add Patient</CardTitle></CardHeader>
                 <CardContent>
                    <form onSubmit={handleAddPatient} className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={patientIdToAdd}
                        onChange={(e) => setPatientIdToAdd(e.target.value)}
                        placeholder="Username for Patient"
                        className="border p-2 rounded text-sm"
                      />
                      <Button type="submit" size="sm">Add Patient</Button>
                      {status && <p className="text-xs text-gray-500 truncate">{status}</p>}
                    </form>
                 </CardContent>
             </Card>
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Acquisition */}
            <Card>
                <CardHeader><CardTitle>Patient Acquisition Rate</CardTitle></CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={acquisitionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="patients" stroke="#8884d8" name="Total Patients" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Document Access Stats */}
            <Card>
                <CardHeader><CardTitle>Document Access Status</CardTitle></CardHeader>
                <CardContent className="h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={accessStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {accessStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4ade80' : '#f87171'} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="flex justify-center gap-4 text-sm">
                         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-full"></div> Granted</div>
                         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded-full"></div> Pending</div>
                     </div>
                </CardContent>
            </Card>
        </div>

        {/* Bottom Section: Patients vs Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Current Patients List (Paginated) */}
            <Card>
                <CardHeader><CardTitle>My Patients</CardTitle></CardHeader>
                <CardContent>
                    {patientsList.length === 0 ? (
                        <p className="text-gray-500 text-sm">No patients added yet.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                {currentPatients.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 text-sm">
                                        <div>
                                            <p className="font-semibold">{p.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-mono text-gray-600 bg-gray-100 px-1 rounded">@{p.username || "unknown"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center pt-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Access Logs */}
            <Card>
                <CardHeader><CardTitle>Recent Access Logs</CardTitle></CardHeader>
                <CardContent>
                    {recentLogs.length === 0 ? (
                        <p className="text-gray-500 text-sm">No recent activity.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {recentLogs.map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-2 border-b last:border-0 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${log.hasAccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {log.hasAccess ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{log.fileName}</p>
                                            <p className="text-xs text-gray-500 truncate w-32">Patient: @{log.patientName}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {/* Since timestamp isn't stored in struct, assume recent */}
                                        {log.hasAccess ? 'Authorized' : 'Pending'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
