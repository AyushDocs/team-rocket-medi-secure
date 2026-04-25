"use client"

import { motion } from "framer-motion"

export default function StatsCard({ title, value, icon, subtitle, delay, children }) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay }}
            className="card-premium bg-white p-6 relative overflow-hidden flex flex-col min-h-[220px] justify-between border border-slate-100 group hover:shadow-2xl hover:shadow-blue-50/50 transition-all duration-500"
        >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors duration-500 opacity-50"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500">
                    {icon}
                </div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50"></div>
            </div>

            <div className="mt-4 flex-grow relative z-10">
                {children}
            </div>

            <div className="mt-4 relative z-10">
                <div className="flex items-baseline gap-1">
                    <h3 className="text-5xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors duration-500">{value}</h3>
                </div>
                <p className="text-sm font-black text-slate-900 mt-1 uppercase tracking-tight">{title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">{subtitle}</p>
            </div>
        </motion.div>
    )
}
