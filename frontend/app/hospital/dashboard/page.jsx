"use client";
import AnalyticsChart from "@/components/AnalyticsChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWeb3 } from "@/context/Web3Context";
import { format } from "date-fns";
import { AlertTriangle, Clock, RefreshCcw, UserPlus, Users } from "lucide-react";
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
            // 1. Counts
            const activeCount = await hospitalContract.hospitalActiveDoctorCount(account);
            const doctorList = await hospitalContract.getHospitalDoctors({ from: account });
            
            // 2. Logs & Chart Data
            // Get PunchOut events (Completed shifts)
            const filterOut = hospitalContract.filters.LogPunchOut(null, account);
            const eventsOut = await hospitalContract.queryFilter(filterOut);
            
            // Get PunchIn events (Active shifts?) - Just for log table
            const filterIn = hospitalContract.filters.LogPunchIn(null, account);
            const eventsIn = await hospitalContract.queryFilter(filterIn);

            // Merge and Sort Logs
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
            ].sort((a, b) => b.timestamp - a.timestamp); // Descending

            setLogs(allLogs.slice(0, 20)); // Last 20 logs

            // Process Chart: Group Duration by Day
            const dayMap = {}; // "YYYY-MM-DD" -> minutes
            let totalSeconds = 0;

            eventsOut.forEach(e => {
                const ts = Number(e.args[2]);
                const duration = Number(e.args[3]);
                totalSeconds += duration;
                const d = new Date(ts * 1000).toISOString().split('T')[0];
                if (!dayMap[d]) dayMap[d] = 0;
                dayMap[d] += (duration / 60); // minutes
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
            toast.error("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 10s?
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [hospitalContract, account]);

    const handleAddDoctor = async () => {
        if (!hospitalContract) return;
        if (!newDoctorAddr || !newDoctorAddr.startsWith("0x")) {
             toast.error("Invalid address");
             return;
        }
        setAdding(true);
        try {
            const tx = await hospitalContract.addDoctor(newDoctorAddr);
            await tx.wait();
            toast.success("Doctor added!");
            setNewDoctorAddr("");
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Add failed: " + (err.reason || "Unknown error"));
        } finally {
            setAdding(false);
        }
    };

    if (web3Loading) return <div className="p-10 text-center">Loading Web3...</div>;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Emergency Staff</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeDoctors}</div>
                        <p className="text-xs text-gray-500">Doctors currently punched in</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified Doctors</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                        <p className="text-xs text-gray-500">Total registered staff</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Emergency Hours</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalHours} hrs</div>
                        <p className="text-xs text-gray-500">Cumulative time logged</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
                <AnalyticsChart data={chartData} title="Emergency Response Activity (Minutes)" />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctor Management */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Staff Management</CardTitle>
                        <Button variant="ghost" size="sm" onClick={fetchData}>
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <Input 
                                placeholder="Doctor Wallet Address (0x...)" 
                                value={newDoctorAddr}
                                onChange={(e) => setNewDoctorAddr(e.target.value)}
                                className="font-mono text-sm"
                            />
                            <Button onClick={handleAddDoctor} disabled={adding} className="bg-emerald-600 hover:bg-emerald-700">
                                <UserPlus className="h-4 w-4 mr-2" />
                                {adding ? "Adding..." : "Add"}
                            </Button>
                        </div>
                        <div className="rounded-md border h-[300px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doctors.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-gray-500">No doctors added.</TableCell>
                                        </TableRow>
                                    ) : (
                                        doctors.map((doc, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-mono text-xs">{doc}</TableCell>
                                                <TableCell><span className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded">Verified</span></TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Logs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emergency Duty Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border h-[350px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-gray-500">No logs found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    {log.type === 'IN' ? (
                                                        <span className="text-red-600 font-bold text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> PUNCH IN</span>
                                                    ) : (
                                                        <span className="text-gray-600 font-bold text-xs">PUNCH OUT</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs truncate max-w-[100px]">{log.doctor}</TableCell>
                                                <TableCell className="text-xs text-gray-500">
                                                    {format(log.date, 'MMM dd, HH:mm')}
                                                    {log.duration && <span className="block text-gray-400">({(log.duration/60).toFixed(0)}m)</span>}
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
