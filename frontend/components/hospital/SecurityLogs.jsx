"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"
import { format } from "date-fns"

export default function SecurityLogs({ logs }) {
    return (
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
    )
}
