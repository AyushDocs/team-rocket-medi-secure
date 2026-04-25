"use client"
 
import { Mail, MessageSquare, Phone, Globe, Send, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { useState } from "react"
import toast from "react-hot-toast"
 
export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        topic: "",
        message: ""
    })
    const [loading, setLoading] = useState(false)
 
    const validateEmail = (email) => {
        return String(email)
          .toLowerCase()
          .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };
 
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.name || !formData.email || !formData.topic || !formData.message) {
            toast.error("Please fill in all fields.")
            return
        }
 
        if (!validateEmail(formData.email)) {
            toast.error("Please enter a valid email address.")
            return
        }
 
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.success("Message dispatched to the secure registry!")
        setFormData({ name: "", email: "", topic: "", message: "" })
        setLoading(false)
    }
 
    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-outfit overflow-hidden pt-32 pb-20 px-6">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/5 rounded-full blur-[120px]"></div>
            </div>
 
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 relative z-10">
                {/* Left Side: Info */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-12"
                >
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900">CONNECT.<br /><span className="text-blue-600 underline decoration-blue-500/30">SUPPORT.</span></h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md">
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
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm group-hover:border-blue-200 transition-all">
                                    <item.icon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-lg font-black text-slate-900 italic">{item.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
 
                    <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-6">
                        <ShieldCheck className="h-12 w-12 text-emerald-500" />
                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                            Your inquiries are processed through our privacy-first support engine. No medical data is ever requested or stored via this form.
                        </p>
                    </div>
                </motion.div>
 
                {/* Right Side: Form */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-slate-200/50"
                >
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Identity Name</label>
                                <Input 
                                    className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:ring-blue-500 placeholder:text-slate-300" 
                                    placeholder="John Doe" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Secure Email</label>
                                <Input 
                                    className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:ring-blue-500 placeholder:text-slate-300" 
                                    placeholder="john@example.com" 
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Topic</label>
                            <Input 
                                className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 focus:ring-blue-500 placeholder:text-slate-300" 
                                placeholder="Emergency Access Help" 
                                value={formData.topic}
                                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Encryption Message</label>
                            <Textarea 
                                className="bg-slate-50 border-slate-100 min-h-[150px] rounded-[1.5rem] text-slate-900 focus:ring-blue-500 placeholder:text-slate-300" 
                                placeholder="How can we help you today?" 
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                            />
                        </div>
                        <Button 
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl italic shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3"
                        >
                            {loading ? "DISPATCHING..." : "DISPATCH MESSAGE"} <Send className="h-6 w-6" />
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
