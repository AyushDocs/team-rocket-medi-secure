"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertTriangle, Users, Clock } from "lucide-react"

export default function OperationalTelemetry({ stats }) {
    const kpis = [
        { 
            label: 'Active Deployment', 
            val: stats.activeDoctors, 
            sub: 'On Duty', 
            icon: AlertTriangle, 
            color: 'rose', 
            desc: 'Active Emergency Node Count' 
        },
        { 
            label: 'Staff Registry', 
            val: stats.totalDoctors, 
            sub: 'Verified', 
            icon: Users, 
            color: 'indigo', 
            desc: 'Total Authorized Node Licenses' 
        },
        { 
            label: 'Force Readiness', 
            val: stats.totalHours, 
            sub: 'Hours', 
            icon: Clock, 
            color: 'emerald', 
            desc: 'Cumulative Block-logged Emergency Service' 
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kpis.map((kpi, i) => (
                <Card key={i} className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden relative group">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</CardTitle>
                            <div className={`p-2 bg-${kpi.color}-50 rounded-xl group-hover:bg-${kpi.color}-600 transition-colors`}>
                                <kpi.icon className={`h-5 w-5 text-${kpi.color}-600 group-hover:text-white`} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4">
                        <div className="flex items-baseline gap-2">
                             <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{kpi.val}</h3>
                             <p className={`text-xs font-bold text-${kpi.color}-500 uppercase tracking-widest`}>{kpi.sub}</p>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">{kpi.desc}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
