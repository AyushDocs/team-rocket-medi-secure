"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight, Gift, Coins, ChevronRight, ExternalLink, Clock } from "lucide-react"
import { useWeb3 } from "@/context/Web3Context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SanjActivityCard() {
    const { getSanjHistory, account, wellnessContract, isConnected } = useWeb3()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [wellnessAddress, setWellnessAddress] = useState(null)

    useEffect(() => {
        const fetchHistory = async () => {
            if (!isConnected || !account || !getSanjHistory) return
            setLoading(true)
            try {
                const data = await getSanjHistory()
                setHistory(data.slice(0, 5)) // Show last 5
                
                if (wellnessContract) {
                    const addr = await wellnessContract.getAddress()
                    setWellnessAddress(addr.toLowerCase())
                }
            } catch (e) {
                console.error("Failed to fetch SANJ history", e)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
        const interval = setInterval(fetchHistory, 15000) // Refresh every 15s
        return () => clearInterval(interval)
    }, [isConnected, account, getSanjHistory, wellnessContract])

    if (!isConnected) return null

    const getTransactionType = (tx) => {
        if (tx.from.toLowerCase() === wellnessAddress) return "reward"
        return tx.type
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="overflow-hidden border-none shadow-2xl shadow-indigo-100/50 rounded-[2rem] bg-white/80 backdrop-blur-md h-full">
                <CardHeader className="pb-4 pt-8 px-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-800">
                                <Coins className="text-indigo-600" size={20} />
                                Token Activity
                            </CardTitle>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Recent SANJ Transactions</p>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50" asChild>
                            <a href="/token">View Hub <ChevronRight size={12} /></a>
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-8">
                    <div className="space-y-3">
                        {loading && history.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-50">
                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Ledger...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                    <Clock className="text-slate-300" size={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-400">No recent activity detected.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {history.map((tx, idx) => {
                                    const type = getTransactionType(tx)
                                    return (
                                        <motion.div
                                            key={tx.hash}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer"
                                            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, '_blank')}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${
                                                    type === 'reward' ? 'bg-emerald-100 text-emerald-600' :
                                                    type === 'receive' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-rose-100 text-rose-600'
                                                }`}>
                                                    {type === 'reward' ? <Gift size={18} /> :
                                                     type === 'receive' ? <ArrowDownLeft size={18} /> :
                                                     <ArrowUpRight size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 tracking-tight">
                                                        {type === 'reward' ? 'Wellness Reward' :
                                                         type === 'receive' ? 'Received SANJ' :
                                                         'Sent SANJ'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {type === 'receive' || type === 'reward' ? `From: ${tx.from.slice(0,6)}...` : `To: ${tx.to.slice(0,6)}...`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${
                                                    type === 'send' ? 'text-rose-600' : 'text-emerald-600'
                                                }`}>
                                                    {type === 'send' ? '-' : '+'}{Number(tx.value).toLocaleString()}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 justify-end">
                                                    <ExternalLink size={8} /> Etherscan
                                                </p>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
