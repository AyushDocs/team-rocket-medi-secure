"use client"

import { Button } from "@/components/ui/button"
import { Shield, ArrowRight, Zap, Lock, Database, Users, Activity, ChevronRight, Globe, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function LandingPage() {
    const router = useRouter()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    }

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-outfit overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-indigo-600/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl"
                    >
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Next-Gen Decentralized Health</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter italic text-white leading-[0.9]"
                    >
                        YOUR DATA.<br />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">YOUR CONTROL.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed"
                    >
                        MediSecure is the first blockchain-native platform for secure medical records, instant doctor access, and ethical data monetization powered by Zero-Knowledge proofs.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10"
                    >
                        <Button 
                            onClick={() => router.push('/login')}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] px-12 h-20 font-black text-xl italic shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                        >
                            GET STARTED NOW <ArrowRight className="h-6 w-6" />
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => router.push('/about')}
                            className="bg-transparent border-white/10 hover:bg-white/5 text-white rounded-[2rem] px-12 h-20 font-black text-xl italic transition-all"
                        >
                            LEARN MORE
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { 
                                icon: Shield, 
                                title: "ZK-Privacy", 
                                desc: "Verify eligibility without exposing private records using Zero-Knowledge proofs.",
                                color: "text-blue-400",
                                bg: "bg-blue-500/10"
                            },
                            { 
                                icon: Globe, 
                                title: "Global Access", 
                                desc: "Access your medical history from any node, anywhere in the world, instantly.",
                                color: "text-purple-400",
                                bg: "bg-purple-500/10"
                            },
                            { 
                                icon: Sparkles, 
                                title: "Data Economy", 
                                desc: "Monetize your anonymized records ethically with full consent and on-chain payouts.",
                                color: "text-amber-400",
                                bg: "bg-amber-500/10"
                            }
                        ].map((f, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-10 bg-white/5 border border-white/5 rounded-[3rem] hover:bg-white/[0.08] hover:border-white/10 transition-all"
                            >
                                <div className={`w-20 h-20 rounded-[1.5rem] ${f.bg} flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform`}>
                                    <f.icon className={`h-10 w-10 ${f.color}`} />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4 italic">{f.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Ecosystem Section */}
            <section className="py-32 px-6 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                    <div className="flex-1 space-y-10">
                        <div className="space-y-4">
                            <Badge className="bg-blue-600/10 text-blue-400 border-none px-4 py-1 font-black text-[10px] tracking-widest uppercase rounded-full">The Ecosystem</Badge>
                            <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white">BUILT FOR EVERYONE.</h2>
                            <p className="text-gray-500 text-lg font-medium leading-relaxed">Whether you are a patient, a healthcare provider, or a researcher, MediSecure provides a specialized portal for your needs.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: "Patients", desc: "Own your records and earn from data." },
                                { title: "Doctors", desc: "Access history and provide better care." },
                                { title: "Hospitals", desc: "Manage protocols and verifications." },
                                { title: "Insurance", desc: "Handle claims via privacy-preserving proofs." }
                            ].map((role, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group">
                                    <div>
                                        <h4 className="text-xl font-black text-white italic">{role.title}</h4>
                                        <p className="text-gray-500 text-sm font-medium">{role.desc}</p>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-blue-400 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <div className="w-full aspect-square rounded-[4rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center p-12 overflow-hidden shadow-3xl shadow-blue-500/10">
                            <div className="relative z-10 grid grid-cols-2 gap-8">
                                <Shield className="h-32 w-32 text-blue-500/40 animate-pulse" />
                                <Lock className="h-32 w-32 text-purple-500/40" />
                                <Database className="h-32 w-32 text-indigo-500/40" />
                                <Activity className="h-32 w-32 text-emerald-500/40 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 px-6">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[4rem] p-16 text-center relative overflow-hidden shadow-3xl shadow-blue-600/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
                    
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">READY TO JOIN THE REVOLUTION?</h2>
                        <p className="text-blue-100 text-xl font-medium max-w-2xl mx-auto">Start your journey toward secure, decentralized healthcare today. Connect your identity to explore the ecosystem.</p>
                        <Button 
                            onClick={() => router.push('/login')}
                            className="bg-white text-black hover:bg-gray-200 rounded-[2rem] px-16 h-20 font-black text-2xl italic transition-all shadow-2xl active:scale-95 flex items-center gap-4 mx-auto"
                        >
                            ENTER PORTAL <ChevronRight className="h-8 w-8" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-20 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center space-x-3 group">
                        <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white italic">MediSecure</span>
                    </div>
                    <div className="flex items-center space-x-12">
                        <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Privacy Protocol</Link>
                        <Link href="/contact" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Emergency Node</Link>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">© 2026 MediSecure Foundation</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function Badge({ children, className }) {
    return (
        <span className={`inline-flex items-center ${className}`}>
            {children}
        </span>
    )
}

function Link({ children, href, className }) {
    return (
        <a href={href} className={className}>
            {children}
        </a>
    )
}