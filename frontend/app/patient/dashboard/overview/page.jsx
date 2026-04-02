"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Calendar, FileText, Stethoscope, User, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useWeb3 } from "../../../../context/Web3Context"
import EmergencyMagicLink from "@/components/EmergencyMagicLink"
import RoleGuard from "@/components/RoleGuard"
export default function OverviewPatient() {
  const { patientContract, doctorContract, account } = useWeb3()
  
  const [patientInfo, setPatientInfo] = useState(null)
  const [stats, setStats] = useState({
      totalRecords: 0,
      connectedDoctors: 0,
      hospitalsVisited: 0
  })
  const [doctorsList, setDoctorsList] = useState([])
  const [recordsList, setRecordsList] = useState([])
  const [graphData, setGraphData] = useState([])
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!patientContract || !doctorContract || !account) return;
      
      try {
        setLoading(true)
        
        // 1. Get Patient ID & Details
        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") return;

        const details = await patientContract.getPatientDetails(patientId)
        setPatientInfo({
          name: details.name,
          username: details.username,
          age: Number(details.age),
          bloodGroup: details.bloodGroup,
          email: details.email,
          wallet: details.walletAddress
        })

        // 2. Get Records
        const records = await patientContract.getMedicalRecords(patientId)
        const formattedRecords = records.map((r, i) => ({
            id: i,
            fileName: r.fileName || r[1],
            ipfsHash: r.ipfsHash || r[0],
            date: r.recordDate || r[2] || "Unknown",
            hospital: r.hospital || r[3] || "Unknown"
        })).reverse(); // Newest first
        setRecordsList(formattedRecords);

        // 3. Find Connected Doctors (via Events)
        // Event: PatientAdded(uint256 indexed doctorId, uint256 indexed patientId, address doctorWallet)
        // We filter by patientId
        const filter = doctorContract.filters.PatientAdded(null, patientId); 
        const events = await doctorContract.queryFilter(filter);
        
        // Extract unique doctors
        const uniqueDocs = new Map();
        for (const e of events) {
            const docWallet = e.args[2];
            if (!uniqueDocs.has(docWallet)) {
                 // Fetch doctor details if possible? 
                 // Doctor contract has doctors mapping but usually by ID. 
                 // We can display wallet for now or try to get ID from wallet.
                 // We'll just list the Wallet or generic name if we can't easily resolve name without ID.
                 // Actually, we can get doctorId from wallet.
                 try {
                    const dId = await doctorContract.walletToDoctorId(docWallet);
                    const dDetails = await doctorContract.doctors(dId);
                    uniqueDocs.set(docWallet, {
                        name: dDetails.name,
                        specialization: dDetails.specialization,
                        hospital: dDetails.email, // email field used for hospital in seed info
                        wallet: docWallet
                    });
                 } catch(err) {
                    uniqueDocs.set(docWallet, { name: "Unknown Doctor", wallet: docWallet });
                 }
            }
        }
        const docsArray = Array.from(uniqueDocs.values());
        setDoctorsList(docsArray);

        // 4. Calculate Stats & Graph Data
        const uniqueHospitals = new Set(formattedRecords.map(r => r.hospital)).size;
        setStats({
            totalRecords: formattedRecords.length,
            connectedDoctors: docsArray.length,
            hospitalsVisited: uniqueHospitals
        });

        // Graph: Records per Hospital
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
      } finally {
        setLoading(false)
      }
      
    }

    fetchData()
  }, [patientContract, doctorContract, account])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if(loading && !patientInfo) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Profile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="flex items-center gap-6 p-6">
                  <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {patientInfo?.name?.charAt(0) || "P"}
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold text-gray-800">{patientInfo?.name || "Patient"}</h2>
                      <p className="text-gray-500 font-mono text-sm">@{patientInfo?.username}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Age: {patientInfo?.age}</span>
                          <span className="flex items-center gap-1"><Activity className="w-4 h-4"/> Blood: {patientInfo?.bloodGroup}</span>
                          <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Family History: N/A</span>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <EmergencyMagicLink />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Medical Records</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                      <FileText className="text-blue-500"/> {stats.totalRecords}
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Connected Doctors</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                       <Stethoscope className="text-green-500"/> {stats.connectedDoctors}
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Hospitals Visited</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                       <Activity className="text-purple-500"/> {stats.hospitalsVisited}
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Recent Records List */}
          <Card>
              <CardHeader><CardTitle>Recent Documents</CardTitle></CardHeader>
              <CardContent>
                  {recordsList.length === 0 ? <p className="text-gray-500">No records found.</p> : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {recordsList.slice(0, 5).map((r, i) => (
                              <div key={i} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                                  <div>
                                      <p className="font-semibold text-gray-800">{r.fileName}</p>
                                      <p className="text-xs text-gray-500">{r.date} • {r.hospital}</p>
                                  </div>
                                  <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                      Secured
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>

           {/* Doctors List */}
           <Card>
              <CardHeader><CardTitle>My Doctors</CardTitle></CardHeader>
              <CardContent>
                  {doctorsList.length === 0 ? <p className="text-gray-500">No doctors associated.</p> : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {doctorsList.map((doc, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                      <User className="h-5 w-5"/>
                                  </div>
                                  <div>
                                      <p className="font-semibold text-gray-800">{doc.name}</p>
                                      <p className="text-xs text-gray-500">{doc.specialization} • {doc.hospital}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>

      {/* Graph Section */}
      <Card>
          <CardHeader><CardTitle>Record Distribution by Hospital</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {graphData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>
      
    </div>
  )
}
