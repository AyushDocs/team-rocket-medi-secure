"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileCheck, Activity } from "lucide-react"

export default function KPIGrid({ requests, policies }) {
    const stats = [
        { label: "TOTAL CUSTOMERS", val: requests.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+12%" },
        { label: "ZK-ELIGIBLE", val: requests.filter(r => r.isVerified).length, icon: FileCheck, color: "text-emerald-600", bg: "bg-emerald-50", trend: "verified" },
        { label: "ACTIVE PLANS", val: policies.length, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50", trend: "stable" }
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            {stats.map((s, i) => (
                <motion.div key={i} variants={itemVariants}>
                    <Card className="bg-white border-slate-100 hover:border-blue-100 transition-all group overflow-hidden relative rounded-[2rem] shadow-sm">
                        <div className={`absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 ${s.color}`}>
                            <s.icon size={120} />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</CardTitle>
                            <div className={`p-3 rounded-2xl ${s.bg} border border-slate-100`}>
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <p className="text-4xl font-black text-slate-900">{s.val}</p>
                                <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[9px] uppercase tracking-widest">{s.trend}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    )
}
