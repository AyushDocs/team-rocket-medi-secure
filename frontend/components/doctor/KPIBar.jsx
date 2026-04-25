"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, ShieldCheck, Clock, Siren } from "lucide-react"

export default function KPIBar({ patientsCount, accessStats, myTotalHours }) {
    const kpis = [
        { label: 'Active Roster', val: patientsCount, icon: Users, color: 'indigo' },
        { label: 'Verified Access', val: accessStats[0]?.value || 0, icon: ShieldCheck, color: 'emerald' },
        { label: 'Shift Analytics', val: `${myTotalHours}h`, icon: Clock, color: 'amber' },
        { label: 'Pending Audits', val: accessStats[1]?.value || 0, icon: Siren, color: 'rose' }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <Card key={i} className="rounded-3xl border-none shadow-xl shadow-slate-100/50 bg-white group hover:translate-y-[-4px] transition-all">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className={`p-4 rounded-2xl transition-colors duration-500 bg-${kpi.color}-50 group-hover:bg-${kpi.color}-500`}>
                            <kpi.icon className={`h-6 w-6 transition-colors text-${kpi.color}-600 group-hover:text-white`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
                            <p className="text-2xl font-black text-slate-800">{kpi.val}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
