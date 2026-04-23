"use client"

import dynamic from "next/dynamic"
const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false })
const AcquisitionChart = dynamic(() => import("@/components/AcquisitionChart"), { ssr: false })
const AccessStatsChart = dynamic(() => import("@/components/AccessStatsChart"), { ssr: false })
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ethers } from "ethers"
import { 
    Activity, 
    Check, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    FileText, 
    LayoutDashboard, 
    Plus, 
    Radio, 
    ShieldCheck, 
    Siren, 
    Sparkles, 
    Stethoscope, 
    UserPlus, 
    Users, 
    X 
} from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"

export default function OverviewDoctor() {
  const { doctorContract, patientContract, hospitalContract, account, emergencyState, setEmergencyState, knownHospitals, addHospital } = useWeb3()
  
  // Emergency State
  const [selectedHospital, setSelectedHospital] = useState(knownHospitals?.[0]?.address || "")
  const [customAddress, setCustomAddress] = useState("")
  const isOnDuty = emergencyState?.active;
  const [dutyLoading, setDutyLoading] = useState(false)
  const [emergencyChartData, setEmergencyChartData] = useState([])
  const [myTotalHours, setMyTotalHours] = useState(0)

  const [patientIdToAdd, setPatientIdToAdd] = useState("")
  const [status, setStatus] = useState("")
  
  const [patientsList, setPatientsList] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [acquisitionData, setAcquisitionData] = useState([])
  const [accessStats, setAccessStats] = useState([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    if (!doctorContract || !patientContract) return;
    try {
      setLoading(true)
      // 1. Fetch Patients
      const patientIds = await doctorContract.getDoctorPatients()
      const patientDetails = await Promise.all(Array.from(patientIds).map(async (id) => {
          try {
             const details = await patientContract.getPatientDetails(id)
             return {
                 id: id.toString(),
                 name: details.name,
                 username: details.username,
                 email: details.email,
                 wallet: details.walletAddress
             }
          } catch(e) { return null }
      }))
      const validPatients = patientDetails.filter(p => p !== null)
      setPatientsList(validPatients)

      // 2. Access Logs
      const accessList = await doctorContract.getAccessList()
      const findUsername = (addr) => {
          const p = validPatients.find(p => p.wallet.toLowerCase() === addr.toLowerCase())
          return p ? p.username : (addr.slice(0,6) + '...')
      }

      const accessLogs = accessList.map(item => ({
          patientAddr: item.patient,
          patientName: findUsername(item.patient),
          fileName: item.fileName || "Document",
          hasAccess: item.hasAccess,
          hash: item.ipfsHash
      })).reverse().slice(0, 8)
      setRecentLogs(accessLogs)

      const granted = accessList.filter(a => a.hasAccess).length
      const denied = accessList.length - granted
      setAccessStats([
          { name: 'Granted', value: granted },
          { name: 'Pending/Denied', value: denied }
      ])
      
      const currentCount = patientIds.length
      setAcquisitionData([
          { name: 'Mon', patients: Math.max(0, currentCount - 5) },
          { name: 'Tue', patients: Math.max(0, currentCount - 3) },
          { name: 'Wed', patients: Math.max(0, currentCount - 2) },
          { name: 'Thu', patients: Math.max(0, currentCount - 1) },
          { name: 'Fri', patients: currentCount },
      ])

      // 3. Emergency Data
      if (hospitalContract) {
          const filterOut = hospitalContract.filters.LogPunchOut(account, null)
          const eventsOut = await hospitalContract.queryFilter(filterOut)
          
          let totalSec = 0
          const dayMap = {}
          eventsOut.forEach(e => {
              const duration = Number(e.args[3])
              totalSec += duration
              const d = new Date(Number(e.args[2]) * 1000).toISOString().split('T')[0]
              if (!dayMap[d]) dayMap[d] = 0
              dayMap[d] += (duration / 60)
          })
          
          setEmergencyChartData(Object.keys(dayMap).map(d => ({
              date: d,
              minutes: Math.round(dayMap[d])
          })).sort((a,b) => a.date.localeCompare(b.date)))
          setMyTotalHours((totalSec/3600).toFixed(1))
      }
    } catch (err) {
      console.error("Dashboard error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (emergencyState?.active && emergencyState.hospital) {
        const target = emergencyState.hospital
        if (knownHospitals?.find(h => h.address.toLowerCase() === target.toLowerCase())) {
            setSelectedHospital(target)
        } else {
            setSelectedHospital("custom")
            setCustomAddress(target)
        }
    }
  }, [emergencyState?.active, emergencyState?.hospital, knownHospitals])

  useEffect(() => {
    if (!selectedHospital && knownHospitals?.[0]?.address) {
        setSelectedHospital(knownHospitals[0].address)
    }
  }, [knownHospitals, selectedHospital])

  const toggleDuty = async () => {
      if (!hospitalContract) return
      const target = selectedHospital === "custom" ? customAddress : selectedHospital
      if (!ethers.isAddress(target)) {
          toast.error("Invalid Station Address")
          return
      }

      setDutyLoading(true)
      try {
          if (isOnDuty) {
              const tx = await hospitalContract.punchOut(target)
              toast.promise(tx.wait(), {
                  loading: 'Ending Shield Protocol...',
                  success: 'Punched Out Successfully',
                  error: 'Error ending shift'
              })
              await tx.wait()
              setEmergencyState({ active: false, hospital: "" })
          } else {
              const tx = await hospitalContract.punchIn(target)
              toast.promise(tx.wait(), {
                  loading: 'Initializing Emergency Access...',
                  success: 'On Duty: High-Priority Access Enabled',
                  error: 'Permission Denied by Station'
              })
              await tx.wait()
              setEmergencyState({ active: true, hospital: target })
              if (selectedHospital === "custom") addHospital(target)
          }
          loadDashboardData()
      } catch (err) {
          toast.error(err.reason || "Duty transition failed")
      } finally {
          setDutyLoading(false)
      }
  }

  useEffect(() => {
    if (doctorContract && patientContract && account) loadDashboardData()
  }, [doctorContract, patientContract, account])

  const handleAddPatient = async (e) => {
    e.preventDefault()
    if (!patientIdToAdd.trim()) return

    setStatus("Linking Identity...")
    try {
      let finalId = patientIdToAdd.trim()
      const isAddress = ethers.isAddress(finalId)
      
      if (!isAddress) {
          const idFromUsername = await patientContract.getPatientIdByUsername(finalId)
          if (idFromUsername && idFromUsername.toString() !== "0") {
              finalId = idFromUsername.toString()
          } else {
             setStatus("ID not found ❌")
             return
          }
      } else {
          const idFromChain = await patientContract.walletToPatientId(finalId)
          if (!idFromChain || idFromChain.toString() === "0") {
             setStatus("Unregistered ❌")
             return
          }
          finalId = idFromChain.toString()
      }

      const tx = await doctorContract.addPatient(finalId)
      toast.promise(tx.wait(), {
          loading: 'Authorizing Medical Connection...',
          success: 'Relationship Established!',
          error: 'Connection Reverted'
      })
      await tx.wait()
      setStatus("")
      setPatientIdToAdd("")
      loadDashboardData()
    } catch (err) {
      setStatus("Error ❌")
      toast.error(err.reason || "Failed to link patient")
    }
  }
  
  const totalPages = Math.ceil(patientsList.length / itemsPerPage)
  const currentPatients = patientsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Skeleton className="h-44 w-full rounded-[2.5rem]" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-96 rounded-[2.5rem]" />
                <Skeleton className="h-96 rounded-[2.5rem]" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-outfit pb-10">
        
        {/* EMERGENCY CONSOLE */}
        <div className={`relative overflow-hidden rounded-[2.5rem] transition-all duration-500 shadow-2xl ${
            isOnDuty 
            ? 'bg-neutral-950 text-white shadow-red-200/20' 
            : 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-100'
        }`}>
            <div className="relative z-10 p-10 md:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge className={`${isOnDuty ? 'bg-red-500 animate-pulse' : 'bg-white/20'} text-white border-none px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase`}>
                                {isOnDuty ? "Critical Access Protocol Active" : "Standby Mode"}
                            </Badge>
                            {isOnDuty && (
                                <div className="flex items-center gap-2 text-red-500 font-black text-xs animate-pulse">
                                    <Radio className="h-4 w-4" /> LIVE NODE
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            {isOnDuty ? "Emergency Duty Active" : "Clinical Command Console"}
                        </h1>
                        <p className={`max-w-xl text-lg font-medium ${isOnDuty ? 'text-neutral-400' : 'text-indigo-100'}`}>
                            {isOnDuty 
                                ? "You have elevated permissions for the selected station. All 'Break Glass' actions are historically immutable."
                                : "Initialize your duty status to access emergency records and real-time station telemetry."}
                        </p>
                    </div>

                    <div className={`p-8 rounded-[2rem] border backdrop-blur-3xl min-w-[340px] shadow-inner ${
                        isOnDuty ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'
                    }`}>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-1">Hospital Station</label>
                                <Select value={selectedHospital} onValueChange={setSelectedHospital} disabled={isOnDuty || dutyLoading}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-400">
                                        <SelectValue placeholder="Select Station" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {(knownHospitals || []).map(h => (
                                            <SelectItem key={h.address} value={h.address} className="font-bold">{h.name}</SelectItem>
                                        ))}
                                        <SelectItem value="custom" className="text-indigo-600 font-bold italic">Private Network Address...</SelectItem>
                                    </SelectContent>
                                </Select>
                                {selectedHospital === "custom" && !isOnDuty && (
                                    <input 
                                        type="text"
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-mono placeholder:opacity-30 focus:outline-none focus:border-white/40 transition-all mt-2"
                                        placeholder="0x Station Hash"
                                        value={customAddress}
                                        onChange={(e) => setCustomAddress(e.target.value)} 
                                    />
                                )}
                            </div>
                            <Button 
                                onClick={toggleDuty} 
                                disabled={dutyLoading}
                                className={`w-full h-14 rounded-2xl font-black text-base transition-all active:scale-95 shadow-xl ${
                                    isOnDuty 
                                    ? 'bg-neutral-100 text-neutral-950 hover:bg-white' 
                                    : 'bg-indigo-400 text-white hover:bg-indigo-300 shadow-indigo-500/20'
                                }`}
                            >
                                {dutyLoading ? (
                                    <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" /> Synchronizing...</span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {isOnDuty ? <X className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                        {isOnDuty ? "PUNCH OUT STATION" : "INITIALIZE DUTY"}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background Decorations */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] -mr-64 -mt-64 transition-colors duration-1000 ${isOnDuty ? 'bg-red-900/40' : 'bg-indigo-400/20'}`} />
            <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[80px] -ml-32 -mb-32 transition-colors duration-1000 ${isOnDuty ? 'bg-neutral-800' : 'bg-violet-400/20'}`} />
        </div>

        {/* TOP KPI BAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { label: 'Active Roster', val: patientsList.length, icon: Users, color: 'indigo' },
                { label: 'Verified Access', val: accessStats[0]?.value || 0, icon: ShieldCheck, color: 'emerald' },
                { label: 'Shift Analytics', val: `${myTotalHours}h`, icon: Clock, color: 'amber' },
                { label: 'Pending Audits', val: accessStats[1]?.value || 0, icon: Siren, color: 'rose' }
            ].map((kpi, i) => (
                <Card key={i} className="rounded-3xl border-none shadow-xl shadow-slate-100/50 bg-white group hover:translate-y-[-4px] transition-all">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-${kpi.color}-50 group-hover:bg-${kpi.color}-500 transition-colors duration-500`}>
                            <kpi.icon className={`h-6 w-6 text-${kpi.color}-600 group-hover:text-white transition-colors`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
                            <p className="text-2xl font-black text-slate-800">{kpi.val}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: Charts & Analytics */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Acquisition & Access Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                        <CardHeader className="pb-2">
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-indigo-500" /> Roster Growth
                                </CardTitle>
                                <Badge variant="outline" className="text-[9px] font-bold">LATEST 7D</Badge>
                             </div>
                        </CardHeader>
                        <CardContent className="h-[280px] p-4">
                            <AcquisitionChart data={acquisitionData} />
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                        <CardHeader className="pb-2">
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-emerald-500" /> Data Sovereignty
                                </CardTitle>
                                <Badge variant="outline" className="text-[9px] font-bold">ACCESS RATIO</Badge>
                             </div>
                        </CardHeader>
                        <CardContent className="h-[280px] p-4 relative">
                            <AccessStatsChart data={accessStats} />
                            <div className="flex justify-center gap-6 mt-2">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /> Authorized
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="w-2.5 h-2.5 bg-rose-400 rounded-full" /> Pending
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Emergency History Chart */}
                {emergencyChartData.length > 0 && (
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-2xl font-black flex items-center gap-3">
                                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                    <Activity className="h-6 w-6" />
                                </div>
                                Station Performance Telemetry
                            </CardTitle>
                            <CardDescription className="font-medium text-lg ml-14">Your historical emergency node activity in minutes.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 h-[350px]">
                            <AnalyticsChart data={emergencyChartData} />
                        </CardContent>
                    </Card>
                )}

                {/* Patient Roster List */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white">
                    <CardHeader className="p-8">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-black flex items-center gap-3">
                                <Stethoscope className="h-6 w-6 text-indigo-600" />
                                Patient Roster
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <span className="text-xs font-black text-slate-400 px-2 uppercase tracking-widest">PG {currentPage} / {totalPages || 1}</span>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-0">
                        {patientsList.length === 0 ? (
                            <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                <Users className="h-10 w-10 text-slate-200 mx-auto" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No linked patients in your network.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentPatients.map((p) => (
                                    <div key={p.id} className="group flex justify-between items-center p-5 bg-slate-50/50 hover:bg-indigo-50/50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 font-black group-hover:text-indigo-600 transition-colors">
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-lg leading-tight">{p.name}</p>
                                                <p className="text-xs font-mono text-slate-400 mt-0.5">{p.wallet.slice(0, 10)}...{p.wallet.slice(-6)}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-indigo-100 text-indigo-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">
                                            @{p.username}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: Quick Actions & Terminal */}
            <div className="lg:col-span-4 space-y-8">
                
                {/* Global Command: Add Patient */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-indigo-100 bg-white overflow-hidden group">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between mb-2">
                             <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-500">
                                <UserPlus className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                             </div>
                             <LayoutDashboard className="h-5 w-5 text-indigo-100" />
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-800">Establish Link</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Link a new patient ID to your medical node.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <form onSubmit={handleAddPatient} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Patient Identity Token</label>
                                <input
                                    type="text"
                                    value={patientIdToAdd}
                                    onChange={(e) => setPatientIdToAdd(e.target.value)}
                                    placeholder="Username or Wallet Address"
                                    className="w-full h-14 px-6 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 focus:bg-white focus:border-indigo-400 transition-all font-bold text-slate-700 outline-none shadow-inner"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 transition-all active:scale-95">
                                 {status ? (
                                     <span className="flex items-center gap-2"><div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent" /> {status}</span>
                                 ) : "Authorize Medical Connection"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* System Logs: Access Activity */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white max-h-[700px] flex flex-col">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Activity className="h-5 w-5 text-rose-500" />
                            Live Access Audit
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-0 flex-1 overflow-y-auto custom-scrollbar">
                        {recentLogs.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Recent Access pings</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentLogs.map((log, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-slate-100 hover:border-indigo-400 transition-colors py-1 group">
                                        <div className={`absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${log.hasAccess ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400'}`} />
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-black text-slate-700 truncate w-32">{log.fileName}</p>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.hasAccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {log.hasAccess ? 'Authorized' : 'Restricted'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold">BY @{log.patientName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="ghost" className="w-full mt-6 text-xs font-black text-slate-400 hover:text-indigo-600 hover:bg-transparent uppercase tracking-[0.2em]">
                             View Complete Audit Trail
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}
