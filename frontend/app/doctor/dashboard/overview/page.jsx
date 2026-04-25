"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"

// Static Imports for core UI
import EmergencyConsole from "@/components/doctor/EmergencyConsole"
import KPIBar from "@/components/doctor/KPIBar"
import PatientRoster from "@/components/doctor/PatientRoster"
import EstablishLink from "@/components/doctor/EstablishLink"
import AccessAuditLogs from "@/components/doctor/AccessAuditLogs"

// Dynamic Imports for charts
const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false })
const AcquisitionChart = dynamic(() => import("@/components/AcquisitionChart"), { ssr: false })
const AccessStatsChart = dynamic(() => import("@/components/AccessStatsChart"), { ssr: false })

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
        
        <EmergencyConsole 
            isOnDuty={isOnDuty}
            dutyLoading={dutyLoading}
            selectedHospital={selectedHospital}
            setSelectedHospital={setSelectedHospital}
            knownHospitals={knownHospitals}
            customAddress={customAddress}
            setCustomAddress={setCustomAddress}
            toggleDuty={toggleDuty}
        />

        <KPIBar 
            patientsCount={patientsList.length}
            accessStats={accessStats}
            myTotalHours={myTotalHours}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ChartCard title="Roster Growth" badge="LATEST 7D" icon={<Sparkles className="h-5 w-5 text-indigo-500" />}>
                        <AcquisitionChart data={acquisitionData} />
                    </ChartCard>

                    <ChartCard title="Data Sovereignty" badge="ACCESS RATIO" icon={<FileText className="h-5 w-5 text-emerald-500" />}>
                        <AccessStatsChart data={accessStats} />
                        <div className="flex justify-center gap-6 mt-2">
                            <LegendItem color="emerald" label="Authorized" />
                            <LegendItem color="rose" label="Pending" />
                        </div>
                    </ChartCard>
                </div>

                {emergencyChartData.length > 0 && (
                    <ChartCard 
                        title="Station Performance Telemetry" 
                        description="Your historical emergency node activity in minutes."
                        icon={<Activity className="h-6 w-6" />}
                        iconBg="amber"
                        large
                    >
                        <AnalyticsChart data={emergencyChartData} />
                    </ChartCard>
                )}

                <PatientRoster 
                    patientsList={patientsList}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                />
            </div>

            <div className="lg:col-span-4 space-y-8">
                <EstablishLink 
                    patientIdToAdd={patientIdToAdd}
                    setPatientIdToAdd={setPatientIdToAdd}
                    handleAddPatient={handleAddPatient}
                    status={status}
                />
                <AccessAuditLogs recentLogs={recentLogs} />
            </div>
        </div>
    </div>
  )
}

// Helpers
function ChartCard({ title, badge, icon, iconBg, description, children, large }) {
    return (
        <Card className={`rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden ${large ? 'p-8' : ''}`}>
            <CardHeader className={large ? 'p-0 pb-8' : 'pb-2'}>
                 <div className="flex items-center justify-between">
                    <CardTitle className={`${large ? 'text-2xl' : 'text-xl'} font-black flex items-center gap-3`}>
                        {iconBg ? <div className={`p-3 bg-${iconBg}-50 rounded-2xl text-${iconBg}-600`}>{icon}</div> : icon}
                        {title}
                    </CardTitle>
                    {badge && <Badge variant="outline" className="text-[9px] font-bold">{badge}</Badge>}
                 </div>
                 {description && <CardDescription className="font-medium text-lg ml-14">{description}</CardDescription>}
            </CardHeader>
            <CardContent className={`${large ? 'p-0 h-[350px]' : 'h-[280px] p-4 relative'}`}>
                {children}
            </CardContent>
        </Card>
    )
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <div className={`w-2.5 h-2.5 bg-${color}-400 rounded-full`} /> {label}
        </div>
    )
}

