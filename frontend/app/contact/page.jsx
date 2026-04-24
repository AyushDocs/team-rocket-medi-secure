"use client"

import { Mail, MessageSquare, Phone, Globe, Send, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-outfit overflow-hidden pt-32 pb-20 px-6">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 relative z-10">
                {/* Left Side: Info */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-12"
                >
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">CONNECT.<br /><span className="text-blue-500 underline decoration-blue-500/30">SUPPORT.</span></h1>
                        <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-md">
                            Need assistance with your decentralized vault or emergency access? Our node operators are here to help.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {[
                            { icon: Mail, label: "Registry Support", val: "support@medisecure.io" },
                            { icon: MessageSquare, label: "Community Node", val: "discord.gg/medisecure" },
                            { icon: Globe, label: "Emergency Hotline", val: "+1 (888) ZK-HEALTH" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-6 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all">
                                    <item.icon className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-lg font-black text-white italic">{item.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center gap-6">
                        <ShieldCheck className="h-12 w-12 text-emerald-400" />
                        <p className="text-xs text-gray-500 font-medium italic leading-relaxed">
                            Your inquiries are processed through our privacy-first support engine. No medical data is ever requested or stored via this form.
                        </p>
                    </div>
                </motion.div>

                {/* Right Side: Form */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[3rem] p-10 md:p-14 shadow-3xl"
                >
                    <form className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Identity Name</label>
                                <Input className="bg-white/5 border-white/10 h-14 rounded-2xl text-white focus:ring-blue-500" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Secure Email</label>
                                <Input className="bg-white/5 border-white/10 h-14 rounded-2xl text-white focus:ring-blue-500" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Topic</label>
                            <Input className="bg-white/5 border-white/10 h-14 rounded-2xl text-white focus:ring-blue-500" placeholder="Emergency Access Help" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Encryption Message</label>
                            <Textarea className="bg-white/5 border-white/10 min-h-[150px] rounded-[1.5rem] text-white focus:ring-blue-500" placeholder="How can we help you today?" />
                        </div>
                        <Button className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl italic shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-3">
                            DISPATCH MESSAGE <Send className="h-6 w-6" />
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
