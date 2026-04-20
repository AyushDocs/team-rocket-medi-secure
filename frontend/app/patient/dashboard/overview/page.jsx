"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Calendar, FileText, Stethoscope, User, Users, Lock, Shield, ShieldCheck, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useWeb3 } from "../../../../context/Web3Context"
import EmergencyMagicLink from "@/components/EmergencyMagicLink"
import RoleGuard from "@/components/RoleGuard"
import WellnessRewardsCard from "@/components/WellnessRewardsCard"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import HeartRateMonitor from "@/components/HeartRateMonitor"

export default function OverviewPatient() {
  const { patientContract, doctorContract, medianizerContract, account } = useWeb3()
  
  const [patientInfo, setPatientInfo] = useState(null)
  const [ethPrice, setEthPrice] = useState(null)
  const [stats, setStats] = useState({
      totalRecords: 0,
      connectedDoctors: 0,
      hospitalsVisited: 0
  })
  const [doctorsList, setDoctorsList] = useState([])
  const [recordsList, setRecordsList] = useState([])
  const [graphData, setGraphData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  useEffect(() => {
    const fetchData = async () => {
      // If we don't have core dependencies, we can't fetch. 
      // We keep loading=true so the user sees the splash screen while Web3 initializes.
      if (!patientContract || !doctorContract || !account) return;
      // Don't fetch until we have the core requirements
      if (!patientContract || !doctorContract || !account) {
          console.log("OverviewPatient: Waiting for contracts/account...", { patientContract: !!patientContract, doctorContract: !!doctorContract, account });
          return;
      }

      setLoading(true)
      try {
        console.log("OverviewPatient: Fetching data for", account);
        
        // Fetch Live Price from Medianizer (Optional, don't block)
        if (medianizerContract) {
            try {
                const price = await medianizerContract.getMedianPrice()
                setEthPrice(ethers.formatUnits(price, 8))
            } catch (e) { console.error("Price fetch failed", e) }
        }

        // 1. Patient ID
        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") {
          console.warn("OverviewPatient: Patient not registered on-chain");
          setLoading(false)
          return
        }

        // 2. Parallel Requests for better performance
        const [details, records] = await Promise.all([
            patientContract.getPatientDetails(patientId),
            patientContract.getMedicalRecords(patientId)
        ]);

        setPatientInfo({
          name: details.name,
          username: details.username,
          age: Number(details.age),
          bloodGroup: details.bloodGroup,
          email: details.email,
          wallet: details.walletAddress
        })

        const formattedRecords = records.map((r, i) => ({
            id: i,
            fileName: r.fileName || r[1],
            ipfsHash: r.ipfsHash || r[0],
            date: r.recordDate || r[2] || "Unknown",
            hospital: r.hospital || r[3] || "Unknown"
        })).reverse();
        setRecordsList(formattedRecords);

        // Stats and Graphs logic...
        const uniqueHospitals = new Set(formattedRecords.map(r => r.hospital)).size;
        
        // Fetch connected doctors via events
        const filter = doctorContract.filters.PatientAdded(null, patientId); 
        const events = await doctorContract.queryFilter(filter);
        const uniqueDocsCount = new Set(events.map(e => e.args[2])).size;

        setStats({
            totalRecords: formattedRecords.length,
            connectedDoctors: uniqueDocsCount,
            hospitalsVisited: uniqueHospitals
        });

        const hospitalCount = {};
        formattedRecords.forEach(r => {
            const h = r.hospital || "Unknown";
            hospitalCount[h] = (hospitalCount[h] || 0) + 1;
        });
        const gData = Object.keys(hospitalCount).map(h => ({
            name: h,
            count: hospitalCount[h]
        }));
        setGraphData(gData);

      } catch (err) {
        console.error("Dashboard Load Error:", err)
        setError(err.message || "An unexpected error occurred while loading your data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patientContract, doctorContract, account, medianizerContract])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] text-center max-w-lg">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Data Retrieval Failed</h2>
          <p className="text-red-600 font-medium text-sm mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if(loading && !patientInfo) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>


  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-12"
    >
      {/* Top Banner / Profile */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden card-premium bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 md:p-12"
      >
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -mr-48 -mt-48 blur-3xl animate-glow"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="h-24 w-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl ring-4 ring-white/10"
              >
                  {patientInfo?.name?.charAt(0) || "P"}
              </motion.div>
              
              <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{patientInfo?.name || "Patient"}</h2>
                          <p className="text-blue-300 font-mono text-sm tracking-widest uppercase opacity-70">Sanjeevni Wallet: {account?.slice(0,6)}...{account?.slice(-4)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                          {ethPrice && (
                              <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border-white/10 bg-white/5">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                                  <span className="text-xs font-black tracking-widest text-blue-100 italic">ETH / USD: ${Number(ethPrice).toLocaleString()}</span>
                              </div>
                          )}
                          <div className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                              MediSecure Protocol Hardened
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-xl"><Calendar size={18} className="text-blue-400" /></div>
                          <div>
                              <p className="text-[10px] uppercase font-black tracking-tighter text-blue-200 opacity-60">Patient Age</p>
                              <p className="text-lg font-black">{patientInfo?.age} Years</p>
                          </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                          <div className="p-2 bg-red-500/20 rounded-xl"><Activity size={18} className="text-red-400" /></div>
                          <div>
                              <p className="text-[10px] uppercase font-black tracking-tighter text-red-200 opacity-60">Blood Type</p>
                              <p className="text-lg font-black">{patientInfo?.bloodGroup}</p>
                          </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl"><Shield size={18} className="text-emerald-400" /></div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-tighter text-emerald-200 opacity-60">Security Level</p>
                            <p className="text-lg font-black tracking-tighter">MAXIMUM</p>
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EmergencyMagicLink />
          <WellnessRewardsCard />
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard 
            title="Medical Records" 
            value={stats.totalRecords} 
            icon={<FileText className="text-blue-500"/>} 
            subtitle="Encrypted on IPFS"
            delay={0.2}
          />
          <StatsCard 
            title="Care Circle" 
            value={stats.connectedDoctors} 
            icon={<Stethoscope className="text-emerald-500"/>} 
            subtitle="Verified Professionals"
            delay={0.3}
          />
          <StatsCard 
            title="Hospital Visits" 
            value={stats.hospitalsVisited} 
            icon={<Activity className="text-purple-500"/>} 
            subtitle="Cross-Network History"
            delay={0.4}
          />
          {/* New Safety Protocol Widget */}
          <HeartRateMonitor patientId="patient1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Records List */}
          <Card className="lg:col-span-2 card-premium p-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black">Clinical Timeline</CardTitle>
                   <p className="text-xs text-slate-400 font-medium mt-1">Recent medical certifications and records</p>
                </div>
                <Button variant="ghost" className="text-blue-600 font-bold">View All</Button>
              </CardHeader>
              <CardContent>
                  {recordsList.length === 0 ? <p className="text-gray-500 py-10 text-center italic">No records found on-chain.</p> : (
                      <div className="space-y-4">
                          {recordsList.slice(0, 5).map((r, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all group"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                          <FileText size={20} />
                                      </div>
                                      <div>
                                          <p className="font-black text-slate-800 tracking-tight">{r.fileName}</p>
                                          <p className="text-xs text-slate-400 font-bold">{r.date} • {r.hospital}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                          <ShieldCheck size={10} /> VERIFIED
                                      </div>
                                      <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 border-slate-200">
                                         <ArrowRight size={14} className="text-slate-400" />
                                      </Button>
                                  </div>
                              </motion.div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>

           {/* Care Circle - Doctors */}
           <Card className="card-premium p-4">
              <CardHeader>
                  <CardTitle className="text-xl font-black">Care Team</CardTitle>
                  <p className="text-xs text-slate-400 font-bold">Professionals with active consent</p>
              </CardHeader>
              <CardContent>
                  {doctorsList.length === 0 ? <p className="text-gray-500 py-10 text-center italic">No care providers linked.</p> : (
                      <div className="space-y-4">
                          {doctorsList.map((doc, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all bg-gradient-to-br from-white to-slate-50/50">
                                  <div className="h-14 w-14 bg-emerald-100 rounded-[1.2rem] flex items-center justify-center text-emerald-700 shadow-inner">
                                      <User className="h-7 w-7"/>
                                  </div>
                                  <div className="flex-1">
                                      <p className="font-black text-slate-800 tracking-tight leading-tight">{doc.name}</p>
                                      <p className="text-xs text-slate-400 font-bold mt-0.5">{doc.specialization}</p>
                                      <Badge variant="outline" className="mt-2 text-[8px] h-4 font-black border-emerald-100 text-emerald-600 uppercase bg-emerald-50">Authorized</Badge>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>

      {/* Distribution Analytics */}
      <Card className="card-premium p-8">
          <CardHeader className="px-0">
              <CardTitle className="text-2xl font-black">Health Network Distribution</CardTitle>
              <p className="text-slate-400 font-medium">Volume of cross-hospital record syncing</p>
          </CardHeader>
          <CardContent className="h-[350px] px-0">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData} radius={[10, 10, 0, 0]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                      <Tooltip 
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="count" fill="#3b82f6" barSize={40}>
                        {graphData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>
    </motion.div>
  )
}

function StatsCard({ title, value, icon, subtitle, delay }) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay }}
            className="card-premium bg-white p-6 relative overflow-hidden flex flex-col justify-between border border-slate-100"
        >
            <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-600 transition-colors">
                    {icon}
                </div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="mt-6">
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{value}</h3>
                <p className="text-sm font-black text-slate-900 mt-1">{title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
        </motion.div>
    )
}
