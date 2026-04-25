"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Activity, Info, ChevronRight, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react"
import { useWeb3 } from "@/context/Web3Context"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

export default function WellnessRewardsCard() {
    const { wellnessContract, patientDetailsContract, account, isConnected, tokenBalance, refreshBalances, triggerRefresh } = useWeb3()
    const [streak, setStreak] = useState({ count: 0, lastTimestamp: 0 })
    const [vitals, setVitals] = useState(null)
    const [loading, setLoading] = useState(false)
    const [claiming, setClaiming] = useState(false)
    const [isEligible, setIsEligible] = useState(false)
    const [cooldownRemaining, setCooldownRemaining] = useState(0)

    useEffect(() => {
        if (wellnessContract && account) {
            fetchWellnessData()
        }
    }, [wellnessContract, account])

    const fetchWellnessData = async () => {
        setLoading(true)
        try {
            const streakInfo = await wellnessContract.patientStreaks(account)
            
            const count = streakInfo.count !== undefined ? streakInfo.count : streakInfo[0];
            const lastTimestamp = streakInfo.lastProofTimestamp !== undefined ? streakInfo.lastProofTimestamp : streakInfo[1];

            setStreak({
                count: Number(count || 0),
                lastTimestamp: Number(lastTimestamp || 0)
            })

            const v = await patientDetailsContract.getVitals(account)
            
            const bp = v.bloodPressure !== undefined ? v.bloodPressure : v[0];
            const hr = v.heartRate !== undefined ? v.heartRate : v[3];
            const temp = v.temperature !== undefined ? v.temperature : v[4];

            setVitals({
                sbp: bp,
                heartRate: hr ? Number(hr.toString().split(' ')[0]) : 0,
                temperature: temp
            })

            const minInterval = Number(await wellnessContract.minimumInterval())
            const now = Math.floor(Date.now() / 1000)
            const nextEligible = Number(streakInfo.lastProofTimestamp) + minInterval
            
            if (now < nextEligible) {
                setCooldownRemaining(Math.ceil((nextEligible - now) / (24 * 3600)))
                setIsEligible(false)
            } else {
                setCooldownRemaining(0)
                setIsEligible(true)
            }
        } catch (e) {
            console.error("Failed to fetch wellness data:", e)
        } finally {
            setLoading(false)
        }
    }

    const isHealthy = vitals && parseInt(vitals.sbp || "0") < 140 && vitals.heartRate < 100

    const claimReward = async () => {
        if (!isEligible || !isHealthy) {
            if (!isHealthy) toast.error("Vitals do not meet healthy criteria for rebate.")
            return
        }
        setClaiming(true)
        
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
            const response = await fetch(`${baseUrl}/api/v1/patient/wellness/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientAddress: account })
            })

            const responseJson = await response.json()
            if (!response.ok) throw new Error(responseJson.error || "Claim failed")
            
            const data = responseJson.data || responseJson

            toast.success("Wellness Rebate Claimed! 50 $SANJ awarded.")
            await fetchWellnessData()
            if (refreshBalances) await refreshBalances()
            if (triggerRefresh) triggerRefresh()
        } catch (e) {
            console.error(e)
            toast.error(e.message)
        } finally {
            setClaiming(false)
        }
    }

    if (!isConnected) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="overflow-hidden border-none shadow-2xl shadow-emerald-100/50 rounded-[2rem] bg-white/80 backdrop-blur-md">
                <CardHeader className="bg-gradient-to-br from-emerald-600 to-teal-700 pb-8 pt-8 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={120} />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="text-amber-300 animate-pulse" size={24} />
                                Wellness Incentives
                            </CardTitle>
                            <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest">Powered by Proof-of-Health</p>
                        </div>
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/20 backdrop-blur-lg px-4 py-2 rounded-2xl border border-white/30 text-center"
                        >
                            <span className="block text-[10px] uppercase font-black tracking-tighter text-emerald-200">Current Balance</span>
                            <span className="text-2xl font-black">{Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 1 })} SANJ</span>
                        </motion.div>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-8 space-y-6 relative">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                            <span>Milestone Progress</span>
                            <span className="text-emerald-600">{(streak.count % 5 === 0 && streak.count > 0) ? 5 : (streak.count % 5)} of 5 checks</span>
                        </div>
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((streak.count % 5 === 0 && streak.count > 0) ? 5 : (streak.count % 5)) * 20}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Streak</span>
                            <span className="text-lg font-black text-slate-700">{streak.count} Check-ins</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestone Reward</span>
                            <span className="text-lg font-black text-emerald-600">500 $SANJ</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-colors">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                <Activity size={12} className="text-emerald-500" /> Vitals Status
                            </div>
                            <div className="text-lg font-black text-slate-700">
                                {vitals ? vitals.sbp : "--"} <span className="text-[10px] text-slate-400 font-medium tracking-normal">mmHg</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-colors">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                <ShieldCheck size={12} className="text-emerald-500" /> Pending Reward
                            </div>
                            <div className="text-lg font-black text-emerald-600">
                                50 <span className="text-[10px] font-bold tracking-widest">$SANJ</span>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {isEligible ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                <div className={`p-4 rounded-2xl flex gap-3 items-center ${isHealthy ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        {isHealthy ? (
                                            <CheckCircle2 className="text-emerald-600" size={20} />
                                        ) : (
                                            <AlertCircle className="text-rose-600" size={20} />
                                        )}
                                    </div>
                                    <p className={`text-xs font-bold leading-tight ${isHealthy ? 'text-emerald-800' : 'text-rose-800'}`}>
                                        {isHealthy 
                                            ? "Status: Optimal. Your cryptographic health proof is ready to be minted."
                                            : "Status: Suboptimal. Maintain healthy vitals to unlock your SANJ rebate."}
                                    </p>
                                </div>
                                <Button 
                                    className={`w-full h-16 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 text-lg ${
                                        isHealthy 
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                                            : 'bg-slate-300 cursor-not-allowed shadow-none'
                                    }`}
                                    disabled={claiming || !isHealthy}
                                    onClick={claimReward}
                                >
                                    {claiming ? (
                                        <span className="flex items-center gap-2 animate-pulse">
                                            Generating ZK-Proof...
                                        </span>
                                    ) : isHealthy ? (
                                        <span className="flex items-center gap-2">
                                            Claim 50 $SANJ Rebate <ChevronRight size={20} />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Criteria Not Met <ShieldCheck size={20} />
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-center">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <AlertCircle className="text-amber-600" size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-amber-800">Cooldown Active</p>
                                        <p className="text-xs text-amber-700 font-medium">Next rebate window opens in {cooldownRemaining} days.</p>
                                    </div>
                                </div>
                                <Button disabled className="w-full bg-slate-100 text-slate-400 font-black py-8 rounded-2xl border-none">
                                    Unlock in {cooldownRemaining} Days
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="flex items-center justify-center gap-2 py-2">
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 italic">
                            Privacy by Design • ZK-SNARKs
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
