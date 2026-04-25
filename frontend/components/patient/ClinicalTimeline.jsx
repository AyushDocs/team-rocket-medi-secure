"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ClinicalTimeline({ recordsList }) {
    return (
        <Card className="lg:col-span-2 card-premium p-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-black">Clinical Timeline</CardTitle>
                    <p className="text-xs text-slate-400 font-medium mt-1">Recent medical certifications and records</p>
                </div>
                <Link href="/patient/dashboard/records">
                    <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">View All</Button>
                </Link>
            </CardHeader>
            <CardContent>
                {recordsList.length === 0 ? <p className="text-gray-500 py-10 text-center italic">No records found on-chain.</p> : (
                    <div className="space-y-4">
                        {recordsList.slice(0, 5).map((r, i) => (
                            <Link href="/patient/dashboard/records" key={i}>
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all group mb-4 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 tracking-tight">{r.fileName}</p>
                                            <p className="text-xs text-slate-400 font-bold">{r.date} • {r.hospital}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                            <ShieldCheck size={10} /> VERIFIED
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 border-slate-200 group-hover:bg-blue-600 group-hover:border-blue-600">
                                            <ArrowRight size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                                        </Button>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
