"use client"

import { FileText, Stethoscope, Activity } from "lucide-react"
import StatsCard from "./StatsCard"
import HeartRateMonitor from "@/components/HeartRateMonitor"
import { motion } from "framer-motion"

export default function StatsGrid({ stats, recordsList, doctorsList }) {
    // 1. Get real categories from record names (if available) or hospitals
    const categories = [...new Set(recordsList?.map(r => {
        const name = r.fileName?.toLowerCase() || "";
        if (name.includes("lab") || name.includes("test") || name.includes("blood")) return "Laboratory";
        if (name.includes("scan") || name.includes("xray") || name.includes("mri") || name.includes("image")) return "Radiology";
        if (name.includes("med") || name.includes("pres") || name.includes("drug")) return "Prescriptions";
        return r.hospital?.split(' ')[0] || "General";
    }) || [])].slice(0, 3);

    // Fallback if no records yet
    const displayCategories = categories.length > 0 ? categories : ["Vault Empty", "No Data", "Pending"];

    // 2. Generate real visit trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
    }).reverse();

    const visitTrend = last7Days.map(date => {
        return recordsList?.filter(r => {
            try {
                return new Date(r.date).toLocaleDateString() === date;
            } catch (e) { return false; }
        }).length || 0;
    });

    // Normalize for the bar chart height
    const maxVisits = Math.max(...visitTrend, 1);
    const normalizedTrend = visitTrend.map(v => (v / maxVisits) * 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard 
                title="Medical Records" 
                value={stats.totalRecords} 
                icon={<FileText className="text-blue-500 group-hover:text-white"/>} 
                subtitle="Encrypted on IPFS"
                delay={0.2}
            >
                <div className="flex flex-wrap gap-2 mt-2">
                    {displayCategories.map((tag, i) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors">
                            {tag}
                        </span>
                    ))}
                </div>
            </StatsCard>

            <StatsCard 
                title="Care Circle" 
                value={stats.connectedDoctors} 
                icon={<Stethoscope className="text-emerald-500 group-hover:text-white"/>} 
                subtitle="Verified Professionals"
                delay={0.3}
            >
                <div className="flex -space-x-3 mt-4">
                    {doctorsList?.slice(0, 4).map((doc, i) => (
                        <div key={i} title={doc.name} className="w-10 h-10 rounded-2xl bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-black text-slate-400 group-hover:border-emerald-500 transition-colors overflow-hidden">
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.wallet}`} 
                                alt={doc.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                    {(!doctorsList || doctorsList.length === 0) && [1, 2].map(i => (
                         <div key={i} className="w-10 h-10 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-300">
                            ?
                         </div>
                    ))}
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                        +{stats.connectedDoctors > 4 ? stats.connectedDoctors - 4 : 0}
                    </div>
                </div>
            </StatsCard>

            <StatsCard 
                title="Hospital Visits" 
                value={stats.hospitalsVisited} 
                icon={<Activity className="text-purple-500 group-hover:text-white"/>} 
                subtitle="Cross-Network History"
                delay={0.4}
            >
                <div className="mt-4 flex items-end gap-1 h-12">
                    {normalizedTrend.map((h, i) => (
                        <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(h, 10)}%` }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className="flex-grow bg-purple-100 rounded-md group-hover:bg-white/40 transition-colors"
                            title={`${visitTrend[i]} visits on ${last7Days[i]}`}
                        />
                    ))}
                </div>
            </StatsCard>

            <HeartRateMonitor patientId="patient1" />
        </div>
    )
}
