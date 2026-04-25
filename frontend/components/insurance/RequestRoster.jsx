"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Zap, CheckCircle2, ScrollText, Clock, Search, ArrowUpRight } from "lucide-react"

export default function RequestRoster({ requests, handleFinalize, loading }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className="bg-white border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-900">Incoming Requests</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-1">Real-time stream of quote applications from the network.</CardDescription>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                        <Search className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400">Filter Requests</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {requests.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="bg-slate-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <Users className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Synchronizing with registry...</p>
                            <p className="text-slate-500 text-xs mt-2 font-medium">No incoming quote requests detected on chain.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {requests.map((req) => (
                                    <motion.div 
                                        key={req.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-6 group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-blue-600 border border-slate-100 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                                #{req.id}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="font-black text-slate-900 font-mono tracking-tight text-lg">{req.patient.substring(0,8)}...{req.patient.substring(34)}</p>
                                                    {req.isVerified && (
                                                        <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                                                            <Zap className="h-2 w-2 mr-1 fill-emerald-600" /> ZK-Eligible
                                                        </Badge>
                                                    )}
                                                    {req.isFinalized && (
                                                        <Badge className="bg-blue-100 text-blue-600 border-blue-200 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                                                            Active Vault
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                    <span className="flex items-center gap-1.5"><ScrollText className="h-3 w-3" /> Plan ID: {req.policyId}</span>
                                                    <span className="text-slate-200">•</span>
                                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Received recently</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Calculated Premium</p>
                                                <div className="flex items-baseline justify-end gap-1.5">
                                                    <p className="text-3xl font-black text-blue-600 tracking-tighter">{req.finalPremium}</p>
                                                    <p className="text-xs font-black text-slate-400 uppercase">ETH</p>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => handleFinalize(req.id)}
                                                disabled={!req.isVerified || req.isFinalized || loading}
                                                className={`font-black h-14 px-8 rounded-2xl transition-all active:scale-95 text-xs tracking-widest uppercase ${
                                                    req.isFinalized 
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                                    : req.isVerified 
                                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100" 
                                                    : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                                                }`}
                                            >
                                                {req.isFinalized ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Authorized</> : "Finalize Order"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                    <Button variant="ghost" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600">
                        View Full On-Chain History <ArrowUpRight className="h-3 w-3 ml-2" />
                    </Button>
                </div>
            </Card>
        </motion.div>
    )
}
