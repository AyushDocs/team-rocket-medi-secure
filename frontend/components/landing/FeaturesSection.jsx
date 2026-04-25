"use client"

import { motion } from "framer-motion"
import { Shield, Globe, Sparkles } from "lucide-react"

const features = [
    { 
        icon: Shield, 
        title: "ZK-Privacy", 
        desc: "Verify eligibility without exposing private records using Zero-Knowledge proofs.",
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    { 
        icon: Globe, 
        title: "Global Access", 
        desc: "Access your medical history from any node, anywhere in the world, instantly.",
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    },
    { 
        icon: Sparkles, 
        title: "Data Economy", 
        desc: "Monetize your anonymized records ethically with full consent and on-chain payouts.",
        color: "text-amber-600",
        bg: "bg-amber-50"
    }
]

export default function FeaturesSection() {
    return (
        <section className="py-32 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {features.map((f, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-10 bg-white border border-slate-100 rounded-[3rem] hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/50"
                        >
                            <div className={`w-20 h-20 rounded-[1.5rem] ${f.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                <f.icon className={`h-10 w-10 ${f.color}`} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 italic">{f.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
