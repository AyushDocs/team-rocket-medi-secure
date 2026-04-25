"use client"

import { motion } from "framer-motion"
import { Calendar, Activity, Shield } from "lucide-react"
import SanjBalance from "../SanjBalance"

export default function PatientProfileHeader({ patientInfo, account, ethPrice }) {
    return (
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden card-premium bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 md:p-12"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -mr-48 -mt-48 blur-3xl animate-glow"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="h-24 w-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl ring-4 ring-white/10"
                >
                    {patientInfo?.name?.charAt(0) || "P"}
                </motion.div>
                
                <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight">{patientInfo?.name || "Patient"}</h2>
                            <p className="text-blue-300 font-mono text-sm tracking-widest uppercase opacity-70">Sanjeevni Wallet: {account?.slice(0,6)}...{account?.slice(-4)}</p>
                        </div>
                            <div className="flex flex-col items-end gap-3">
                                <SanjBalance />
                                {ethPrice && (
                                    <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border-white/10 bg-white/5">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                                        <span className="text-xs font-black tracking-widest text-blue-100 italic">ETH / USD: ${Number(ethPrice).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-4">
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl"><Calendar size={18} className="text-blue-400" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-tighter text-blue-200 opacity-60">Patient Age</p>
                                <p className="text-lg font-black">{patientInfo?.age} Years</p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-xl"><Activity size={18} className="text-red-400" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-tighter text-red-200 opacity-60">Blood Type</p>
                                <p className="text-lg font-black">{patientInfo?.bloodGroup}</p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl"><Shield size={18} className="text-emerald-400" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-tighter text-emerald-200 opacity-60">Security Level</p>
                                <p className="text-lg font-black tracking-tighter">MAXIMUM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
