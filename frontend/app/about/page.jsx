"use client"

import { Shield, Target, Users, Globe, Lock, Cpu } from "lucide-react"
import { motion } from "framer-motion"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-outfit overflow-hidden pt-32 pb-20 px-6">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-24 relative z-10">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">THE VISION.</h1>
                    <p className="text-xl text-gray-500 font-medium leading-relaxed">
                        Redefining healthcare through decentralization, ensuring that patients truly own their medical identity.
                    </p>
                </motion.div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {[
                        { 
                            icon: Target, 
                            title: "The Mission", 
                            desc: "To eliminate data silos in healthcare and return data sovereignty to the patient. We believe medical records should be portable, private, and profitable for the owner." 
                        },
                        { 
                            icon: Cpu, 
                            title: "The Tech", 
                            desc: "Built on Ethereum and IPFS, MediSecure uses Zero-Knowledge Proofs to allow verification without disclosure. High-end encryption meets decentralized storage." 
                        },
                        { 
                            icon: Lock, 
                            title: "Privacy First", 
                            desc: "Your records are never stored on a central server. They exist only in your encrypted vault, accessible only with your unique cryptographic keys." 
                        },
                        { 
                            icon: Globe, 
                            title: "Global Interop", 
                            desc: "Whether you're in a local clinic or a hospital across the globe, your records move with you instantly, authenticated by the blockchain." 
                        }
                    ].map((section, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/[0.08] transition-all"
                        >
                            <section.icon className="h-10 w-10 text-blue-400 mb-6" />
                            <h3 className="text-2xl font-black text-white mb-3 italic">{section.title}</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">{section.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Team/Philosophy */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="p-12 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-[3rem] border border-white/10 text-center"
                >
                    <h2 className="text-3xl font-black text-white italic mb-6">A DECENTRALIZED FUTURE.</h2>
                    <p className="text-gray-400 font-medium max-w-2xl mx-auto italic">
                        "MediSecure isn't just a platform; it's a protocol for human dignity in the digital age. Your health history is the most personal data you own—it should be yours to protect."
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
