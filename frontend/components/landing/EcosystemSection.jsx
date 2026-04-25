"use client"

import { Shield, Lock, Database, Activity, ChevronRight } from "lucide-react"

function Badge({ children, className }) {
    return (
        <span className={`inline-flex items-center ${className}`}>
            {children}
        </span>
    )
}

const roles = [
    { title: "Patients", desc: "Own your records and earn from data." },
    { title: "Doctors", desc: "Access history and provide better care." },
    { title: "Hospitals", desc: "Manage protocols and verifications." },
    { title: "Insurance", desc: "Handle claims via privacy-preserving proofs." }
]

export default function EcosystemSection() {
    return (
        <section className="py-32 px-6 bg-slate-50/50">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                <div className="flex-1 space-y-10">
                    <div className="space-y-4">
                        <Badge className="bg-blue-100 text-blue-600 border-none px-4 py-1 font-black text-[10px] tracking-widest uppercase rounded-full">The Ecosystem</Badge>
                        <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter text-slate-900">BUILT FOR EVERYONE.</h2>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">Whether you are a patient, a healthcare provider, or a researcher, MediSecure provides a specialized portal for your needs.</p>
                    </div>

                    <div className="space-y-4">
                        {roles.map((role, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                <div>
                                    <h4 className="text-xl font-black text-slate-800 italic">{role.title}</h4>
                                    <p className="text-slate-500 text-sm font-medium">{role.desc}</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 relative">
                    <div className="w-full aspect-square rounded-[4rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center p-12 overflow-hidden shadow-2xl shadow-blue-200/50">
                        <div className="relative z-10 grid grid-cols-2 gap-8">
                            <Shield className="h-32 w-32 text-blue-500/20 animate-pulse" />
                            <Lock className="h-32 w-32 text-indigo-500/20" />
                            <Database className="h-32 w-32 text-slate-500/20" />
                            <Activity className="h-32 w-32 text-blue-400/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
