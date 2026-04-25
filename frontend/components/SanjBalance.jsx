"use client"
import { useWeb3 } from "@/context/Web3Context"
import { motion, AnimatePresence } from "framer-motion"
import { Coins, Gift, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function SanjBalance() {
    const { tokenBalance, claimableRewards, refreshBalances, isConnected } = useWeb3()
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        if (isConnected) {
            refreshBalances()
            const interval = setInterval(refreshBalances, 30000) // Refresh every 30s
            return () => clearInterval(interval)
        }
    }, [isConnected])

    if (!isConnected) return null

    const hasRewards = parseFloat(claimableRewards) > 0

    return (
        <Link href="/token">
            <motion.div 
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="relative flex items-center gap-3 bg-white/50 hover:bg-white backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 group"
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Coins size={18} className="text-indigo-600" />
                        </div>
                        <AnimatePresence>
                            {hasRewards && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SANJ Wallet</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-800 tracking-tight">
                                {Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-black text-indigo-500 tracking-tighter">SANJ</span>
                        </div>
                    </div>
                </div>

                <motion.div 
                    animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0 }}
                    className="flex items-center gap-2 pl-2 border-l border-slate-100"
                >
                    <ArrowRight size={14} className="text-indigo-400" />
                </motion.div>

                {/* Claimable Notification Tooltip */}
                <AnimatePresence>
                    {isHovered && hasRewards && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-emerald-600 text-white p-3 rounded-2xl shadow-2xl z-50 pointer-events-none"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Gift size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Bonus Available</span>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed opacity-90">
                                You have {claimableRewards} claimable SANJ rewards. Click to claim.
                            </p>
                            <div className="absolute top-0 left-6 -mt-1 w-2 h-2 bg-emerald-600 rotate-45" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    )
}
