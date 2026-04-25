"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HeroSection() {
    const router = useRouter()

    return (
        <section className="relative pt-40 pb-20 px-6">
            <div className="max-w-7xl mx-auto text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full"
                >
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Next-Gen Decentralized Health</span>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter italic text-slate-900 leading-[0.9]"
                >
                    YOUR DATA.<br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">YOUR CONTROL.</span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] px-12 h-20 font-black text-xl italic shadow-2xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                    >
                        GET STARTED NOW <ArrowRight className="h-6 w-6" />
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => router.push('/about')}
                        className="bg-white border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[2rem] px-12 h-20 font-black text-xl italic transition-all shadow-sm"
                    >
                        LEARN MORE
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}
