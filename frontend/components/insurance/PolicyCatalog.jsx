"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollText, Shield, Edit2, ChevronRight, PlusCircle } from "lucide-react"

export default function PolicyCatalog({ policies, onEdit, onOpenCreate }) {
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
            {policies.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <PlusCircle className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest">No Policies Deployed</p>
                    <Button 
                        variant="link" 
                        onClick={onOpenCreate}
                        className="text-blue-600 font-bold mt-2 hover:text-blue-700"
                    >
                        Start by minting your first strategy
                    </Button>
                </div>
            ) : (
                policies.map((p) => (
                    <motion.div key={p.id} variants={itemVariants}>
                        <Card className="bg-white border-slate-100 hover:border-blue-100 transition-all rounded-[2.5rem] p-4 relative group overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                <Shield size={100} className="text-blue-600" />
                            </div>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${p.isActive ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-lg shadow-blue-50' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        <ScrollText className="h-6 w-6" />
                                    </div>
                                    <Button 
                                        onClick={() => onEdit(p)} 
                                        variant="ghost" 
                                        className="h-10 w-10 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900">{p.name}</CardTitle>
                                <CardDescription className="text-slate-500 font-medium leading-relaxed mt-2 line-clamp-2">{p.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Systolic</p>
                                        <p className="text-lg font-black text-slate-900">{p.maxSystolic} <span className="text-[10px] text-slate-400">mmHg</span></p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Min Age</p>
                                        <p className="text-lg font-black text-slate-900">{p.minAge} <span className="text-[10px] text-slate-400">Yrs</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-blue-600 tracking-tighter">{p.basePremium}</p>
                                        <p className="text-xs font-black text-slate-400 uppercase">ETH / BASE</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{p.isActive ? "Network Active" : "Paused"}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" className="text-blue-600 font-black text-[10px] tracking-widest uppercase hover:bg-transparent">
                                    View Metrics <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))
            )}
        </motion.div>
    )
}
