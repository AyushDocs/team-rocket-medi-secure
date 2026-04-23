"use client";

import dynamic from "next/dynamic"
const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false })
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/context/Web3Context";
import { format } from "date-fns";
import { 
    Activity,
    AlertTriangle, 
    ChevronRight,
    Clock, 
    History,
    Plus,
    RefreshCcw, 
    Search,
    ShieldCheck,
    UserPlus, 
    Users,
    Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
            
            {/* OPERATIONAL TELEMETRY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden relative group">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Deployment</CardTitle>
                            <div className="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-600 transition-colors">
                                <AlertTriangle className="h-5 w-5 text-rose-600 group-hover:text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4">
                        <div className="flex items-baseline gap-2">
                             <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.activeDoctors}</h3>
                             <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">On Duty</p>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">Active Emergency Node Count</p>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden relative group">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Staff Registry</CardTitle>
                            <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors">
                                <Users className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4">
                        <div className="flex items-baseline gap-2">
                             <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.totalDoctors}</h3>
                             <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Verified</p>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">Total Authorized Node Licenses</p>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden relative group">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Force Readiness</CardTitle>
                            <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 transition-colors">
                                <Clock className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4">
                        <div className="flex items-baseline gap-2">
                             <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.totalHours}</h3>
                             <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Hours</p>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">Cumulative Block-logged Emergency Service</p>
                    </CardContent>
                </Card>
            </div>

            {/* ANALYTICS SUITE */}
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

            {/* MANAGEMENT CONSOLE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* DOCTOR REGISTRY */}
                <Card className="lg:col-span-12 xl:col-span-5 rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-6 border-b border-slate-50">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-800">Node Registry</CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Medical Personnel</CardDescription>
                            </div>
                            <Button 
                                onClick={fetchData}
                                variant="ghost" 
                                size="icon" 
                                className="h-12 w-12 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                             <Input 
                                placeholder="0x Doctor Node Address" 
                                value={newDoctorAddr}
                                onChange={(e) => setNewDoctorAddr(e.target.value)}
                                className="bg-transparent border-none focus-visible:ring-0 font-mono text-xs font-bold"
                             />
                             <Button 
                                onClick={handleAddDoctor} 
                                disabled={adding}
                                className="h-12 px-6 rounded-[1.2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-200 transition-all active:scale-95"
                             >
                                {adding ? "Broadcasting..." : "Authorize"}
                             </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-50">
                                        <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol Address</TableHead>
                                        <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Verification</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doctors.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Registry Empty</TableCell>
                                        </TableRow>
                                    ) : (
                                        doctors.map((doc, i) => (
                                            <TableRow key={i} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                            {i + 1}
                                                        </div>
                                                        <span className="font-mono text-xs font-bold text-slate-600">{doc}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-10 py-6 text-right">
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-3 py-1 uppercase tracking-tighter">Verified Node</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* LOGS TERMINAL */}
                <Card className="lg:col-span-12 xl:col-span-7 rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-800">Security Logs</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Immutable Shift Telemetry</CardDescription>
                        </div>
                        <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center">
                            <History className="h-5 w-5 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[640px] overflow-y-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow className="hover:bg-transparent border-slate-50">
                                        <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Event Protocol</TableHead>
                                        <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Medical Personnel</TableHead>
                                        <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No Operational Logs Found</TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log, i) => (
                                            <TableRow key={i} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="px-10 py-6">
                                                    {log.type === 'IN' ? (
                                                        <div className="flex items-center gap-2 text-rose-600">
                                                            <div className="h-2 w-2 bg-rose-600 rounded-full animate-ping" />
                                                            <span className="font-black text-[10px] uppercase tracking-widest">Punch In</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <div className="h-2 w-2 bg-slate-300 rounded-full" />
                                                            <span className="font-black text-[10px] uppercase tracking-widest">Punch Out</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-10 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            D{i + 1}
                                                        </div>
                                                        <span className="font-mono text-[10px] font-bold text-slate-500">{log.doctor.slice(0, 16)}...</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-10 py-6 text-right">
                                                    <p className="text-xs font-black text-slate-800 tracking-tight">{format(log.date, 'MMM dd, HH:mm')}</p>
                                                    {log.duration && (
                                                        <Badge variant="ghost" className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 p-0">
                                                            Session: {(log.duration/60).toFixed(0)}m
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
