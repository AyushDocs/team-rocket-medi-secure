"use client";

import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/context/Web3Context";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Static Imports
import OperationalTelemetry from "@/components/hospital/OperationalTelemetry"
import NodeRegistry from "@/components/hospital/NodeRegistry"
import SecurityLogs from "@/components/hospital/SecurityLogs"

// Dynamic Imports
const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false })

export default function HospitalDashboard() {
    const { hospitalContract, account, loading: web3Loading } = useWeb3();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeDoctors: 0,
        totalDoctors: 0,
        totalHours: 0
    });
    const [doctors, setDoctors] = useState([]);
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [newDoctorAddr, setNewDoctorAddr] = useState("");
    const [adding, setAdding] = useState(false);

    const fetchData = async () => {
        if (!hospitalContract || !account) return;
        setLoading(true);
        try {
            const activeCount = await hospitalContract.hospitalActiveDoctorCount(account);
            const doctorList = await hospitalContract.getHospitalDoctors({ from: account });
            
            const filterOut = hospitalContract.filters.LogPunchOut(null, account);
            const eventsOut = await hospitalContract.queryFilter(filterOut);
            
            const filterIn = hospitalContract.filters.LogPunchIn(null, account);
            const eventsIn = await hospitalContract.queryFilter(filterIn);

            const allLogs = [
                ...eventsIn.map(e => ({
                    type: 'IN',
                    doctor: e.args[0],
                    timestamp: Number(e.args[2]),
                    hash: e.transactionHash,
                    date: new Date(Number(e.args[2]) * 1000)
                })),
                ...eventsOut.map(e => ({
                    type: 'OUT',
                    doctor: e.args[0],
                    timestamp: Number(e.args[2]),
                    duration: Number(e.args[3]),
                    hash: e.transactionHash,
                    date: new Date(Number(e.args[2]) * 1000)
                }))
            ].sort((a, b) => b.timestamp - a.timestamp);

            setLogs(allLogs.slice(0, 20));

            const dayMap = {};
            let totalSeconds = 0;

            eventsOut.forEach(e => {
                const ts = Number(e.args[2]);
                const duration = Number(e.args[3]);
                totalSeconds += duration;
                const d = new Date(ts * 1000).toISOString().split('T')[0];
                if (!dayMap[d]) dayMap[d] = 0;
                dayMap[d] += (duration / 60);
            });

            const chart = Object.keys(dayMap).map(d => ({
                date: d,
                minutes: Math.round(dayMap[d])
            })).sort((a,b) => a.date.localeCompare(b.date));

            setChartData(chart);
            setStats({
                activeDoctors: Number(activeCount),
                totalDoctors: doctorList.length,
                totalHours: (totalSeconds / 3600).toFixed(1)
            });
            setDoctors(doctorList);

        } catch (err) {
            console.error(err);
            toast.error("Telemetry Synchronization Failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [hospitalContract, account]);

    const handleAddDoctor = async () => {
        if (!hospitalContract) return;
        if (!newDoctorAddr || !newDoctorAddr.startsWith("0x") || newDoctorAddr.length !== 42) {
             toast.error("Invalid Node Address");
             return;
        }
        setAdding(true);
        try {
            const tx = await hospitalContract.addDoctor(newDoctorAddr);
            toast.promise(tx.wait(), {
                loading: 'Broadcasting Registry Event...',
                success: 'Doctor node successfully verified.',
                error: 'Registry Update Reverted'
            });
            await tx.wait();
            setNewDoctorAddr("");
            fetchData();
        } catch (err) {
            toast.error(err.reason || "Registry Error");
        } finally {
            setAdding(false);
        }
    };

    if (web3Loading || loading) {
        return (
            <div className="space-y-10 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-[2.5rem]" />)}
                </div>
                <Skeleton className="h-[400px] rounded-[2.5rem]" />
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-outfit">
            <OperationalTelemetry stats={stats} />

            <OperationalVelocity chartData={chartData} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <NodeRegistry 
                    doctors={doctors}
                    newDoctorAddr={newDoctorAddr}
                    setNewDoctorAddr={setNewDoctorAddr}
                    handleAddDoctor={handleAddDoctor}
                    adding={adding}
                    fetchData={fetchData}
                />
                <SecurityLogs logs={logs} />
            </div>
        </div>
    );
}

// Helpers
function OperationalVelocity({ chartData }) {
    return (
        <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-100 border border-slate-50 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Operational Velocity</h2>
                    <p className="text-sm font-medium text-slate-400">Response activity duration integrated over 24h cycles.</p>
                </div>
                <Badge variant="outline" className="h-10 px-6 rounded-xl border-slate-100 bg-slate-50 text-slate-500 font-black tracking-widest text-[10px]">REAL-TIME SYNC</Badge>
            </div>
            <div className="h-[400px] w-full relative z-10">
                <AnalyticsChart data={chartData} title="" />
            </div>
            <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-50/50 rounded-full blur-[100px] -mr-20 -mt-20" />
        </div>
    )
}

