"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"

export default function AccessAuditLogs({ recentLogs }) {
    return (
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
    )
}
