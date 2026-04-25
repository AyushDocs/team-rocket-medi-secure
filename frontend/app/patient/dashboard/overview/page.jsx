"use client"

import { ShieldAlert } from "lucide-react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useWeb3 } from "../../../../context/Web3Context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

// Static Imports for non-heavy UI
import EmergencyMagicLink from "@/components/EmergencyMagicLink"
import WellnessRewardsCard from "@/components/WellnessRewardsCard"
import PatientProfileHeader from "@/components/patient/PatientProfileHeader"
import StatsGrid from "@/components/patient/StatsGrid"
import ClinicalTimeline from "@/components/patient/ClinicalTimeline"
import CareTeam from "@/components/patient/CareTeam"
import SanjActivityCard from "@/components/patient/SanjActivityCard"

// Dynamic Imports for heavy components (Charts, etc.)
const HealthNetworkDistribution = dynamic(() => import("@/components/patient/HealthNetworkDistribution"), {
  loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-[2rem] animate-pulse">Loading Analytics...</div>
})
const VitalsVariationGraph = dynamic(() => import("@/components/patient/VitalsVariationGraph"), {
  ssr: false
})

export default function OverviewPatient() {
  const { patientContract, doctorContract, medianizerContract, account, refreshKey, triggerRefresh } = useWeb3()
  
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
  const [vitalsHistory, setVitalsHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const SOCKET_URL = "http://localhost:5000"

  useEffect(() => {
    const fetchData = async () => {
      if (!patientContract || !doctorContract || !account) {
          return;
      }

      setLoading(true)
      try {
        console.log("OverviewPatient: Fetching data for", account);
        
        if (medianizerContract) {
            try {
                const { ethers } = await import("ethers");
                const price = await medianizerContract.getMedianPrice()
                setEthPrice(ethers.formatUnits(price, 8))
            } catch (e) { console.error("Price fetch failed", e) }
        }

        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") {
          console.warn("OverviewPatient: Patient not registered on-chain");
          setLoading(false)
          return
        }

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

        const uniqueHospitals = new Set(formattedRecords.map(r => r.hospital)).size;
        
        const filter = doctorContract.filters.PatientAdded(null, patientId); 
        const events = await doctorContract.queryFilter(filter);
        const doctorAddresses = [...new Set(events.map(e => e.args[2]))];
        
        const doctorsData = await Promise.all(
          doctorAddresses.map(async (addr) => {
            try {
              const dId = await doctorContract.walletToDoctorId(addr);
              const details = await doctorContract.doctors(dId);
              return {
                id: dId.toString(),
                name: details.name,
                specialization: details.specialization,
                wallet: addr
              };
            } catch (e) {
              return null;
            }
          })
        );
        const activeDoctors = doctorsData.filter(d => d !== null);
        setDoctorsList(activeDoctors);

        setStats({
            totalRecords: formattedRecords.length,
            connectedDoctors: activeDoctors.length,
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
  }, [patientContract, doctorContract, account, medianizerContract, refreshKey])

  useEffect(() => {
    if (!account) return

    const initSocket = async () => {
      const { io } = await import("socket.io-client")
      const socket = io(SOCKET_URL)

      socket.on("connect", () => {
        console.log("Overview connected to Socket.io for vitals")
        socket.emit("subscribe_vitals", { patientId: account.toLowerCase() })
      })

      socket.on("vitals_update", (data) => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          heartRate: data.heartRate || data.hr || 72,
          spO2: data.spO2 || data.spo2 || 98,
          temperature: data.temperature || data.temp || 36.6,
          bloodPressure: data.bloodPressure || data.bp || "--/--"
        }
        setVitalsHistory(prev => {
          const updated = [...prev, newEntry].slice(-30)
          return updated
        })
      })

      return socket
    }

    let socketInstance
    initSocket().then(s => {
      socketInstance = s
    })

    return () => {
      if (socketInstance) socketInstance.disconnect()
    }
  }, [account])

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-12"
    >
      {error ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] text-center max-w-lg shadow-xl shadow-red-50">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-800 mb-2">Security Handshake Failed</h2>
            <p className="text-red-600 font-medium text-sm mb-6">{error}</p>
            <Button 
                onClick={() => {
                  setError(null);
                  triggerRefresh();
                }} 
                className="bg-red-600 hover:bg-red-700 rounded-2xl px-8 py-6 font-black"
            >
              Retry Protocol Connection
            </Button>
          </div>
        </div>
      ) : (loading && !patientInfo) ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Medical Vault...</p>
        </div>
      ) : (
        <>
          <PatientProfileHeader patientInfo={patientInfo} account={account} ethPrice={ethPrice} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <EmergencyMagicLink />
              <WellnessRewardsCard />
          </div>

          <StatsGrid stats={stats} recordsList={recordsList} doctorsList={doctorsList} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <ClinicalTimeline recordsList={recordsList} />
              <CareTeam doctorsList={doctorsList} />
              <SanjActivityCard />
          </div>

          <HealthNetworkDistribution graphData={graphData} />
          <VitalsVariationGraph vitalsHistory={vitalsHistory} />
        </>
      )}
    </motion.div>
  )
}
