"use client"

import { useEffect, useState } from "react"
import io from "socket.io-client"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Heart, Zap, Thermometer, Droplets } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts"

const SOCKET_URL = "http://localhost:5000"

export default function HeartRateMonitor({ patientId = "patient1" }) {
    const [vitals, setVitals] = useState({
        heartRate: 72,
        spO2: 98,
        temperature: 36.6,
        status: "Connecting..."
    })
    const [history, setHistory] = useState(Array(20).fill({ value: 72 }))
    const [isPulsing, setIsPulsing] = useState(false)

    useEffect(() => {
        const socket = io(SOCKET_URL)

        socket.on("connect", () => {
            console.log("Monitor connected to Socket.io")
            setVitals(v => ({ ...v, status: "Live" }))
            socket.emit("subscribe_vitals", { patientId })
        })

        socket.on("vitals_update", (data) => {
            console.log("New vitals received:", data)
            const hr = data.heartRate || data.hr || data.bpm || 72;
            setVitals({
                heartRate: hr,
                spO2: data.spO2 || data.spo2 || 98,
                temperature: data.temperature || data.temp || 36.6,
                status: "Live"
            })
            setIsPulsing(true)
            setTimeout(() => setIsPulsing(false), 500)

            setHistory(prev => {
                const newHistory = [...prev.slice(1), { value: hr }]
                return newHistory
            })
        })

        socket.on("disconnect", () => {
            setVitals(v => ({ ...v, status: "Offline" }))
        })

        return () => socket.disconnect()
    }, [patientId])



    return (
        <Card className="overflow-hidden card-premium bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white lg:col-span-1 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${vitals.status === "Live" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${vitals.status === "Live" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}></div>
                    {vitals.status}
                </div>
            </div>

            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-500/10 rounded-2xl">
                        <Activity className="text-red-400 h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Real-time Vitals</h3>
                        <p className="text-xs text-slate-500 font-bold">IoT Wearable Active</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Heart Rate</p>
                        <div className="flex items-baseline gap-2">
                            <motion.span 
                                key={vitals.heartRate}
                                initial={{ scale: 1.2, color: "#f87171" }}
                                animate={{ scale: 1, color: "#ffffff" }}
                                className="text-5xl font-black tracking-tighter"
                            >
                                {vitals.heartRate}
                            </motion.span>
                            <span className="text-slate-500 font-bold text-sm">BPM</span>
                        </div>
                        <motion.div 
                            animate={isPulsing ? { scale: [1, 1.2, 1] } : {}}
                            className="inline-block"
                        >
                            <Heart className={`h-5 w-5 ${isPulsing ? "text-red-500 fill-red-500" : "text-red-400"}`} />
                        </motion.div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400">SpO2</span>
                            </div>
                            <span className="font-black text-blue-100">{vitals.spO2}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-amber-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400">Temp</span>
                            </div>
                            <span className="font-black text-amber-100">{vitals.temperature}°C</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#f87171" 
                                strokeWidth={3} 
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                
                <p className="text-center text-[10px] text-slate-600 font-bold mt-4 tracking-widest uppercase italic">
                    Live Stream from Sanjeevni Bridge
                </p>
            </CardContent>
        </Card>
    )
}
