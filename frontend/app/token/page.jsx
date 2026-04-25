"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Coins, 
    ArrowUpRight, 
    Flame, 
    Gift, 
    Info, 
    Wallet, 
    BarChart3, 
    Timer,
    ChevronRight,
    ExternalLink,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToken, useVesting, useICO } from "@/hooks/lib/useToken";
import { useWeb3 } from "@/context/Web3Context";
import { Logo } from "@/components/Logo";

export default function TokenPage() {
    const { account, tokenContract, icoContract, vestingContract, isConnected } = useWeb3();
    const [tab, setTab] = useState("wallet");
    
    const { balance, totalSupply, transfer, burn, loading: tokenLoading, error: tokenError, refresh: refreshWallet } = useToken(tokenContract);
    const { claimable, claim, loading: vestingLoading, error: vestingError, refresh: refreshVesting } = useVesting(vestingContract);
    const { stats, buyTokens, loading: icoLoading, error: icoError, refresh: refreshICO } = useICO(icoContract);

    const [sendAmount, setSendAmount] = useState("");
    const [sendTo, setSendTo] = useState("");
    const [burnAmount, setBurnAmount] = useState("");
    const [buyAmount, setBuyAmount] = useState("");

    const handleTransfer = async () => {
        if (!sendTo || !sendAmount) return;
        const tx = await transfer(sendTo, sendAmount);
        if (tx) {
            setSendAmount("");
            setSendTo("");
        }
    };

    const handleBurn = async () => {
        if (!burnAmount) return;
        const tx = await burn(burnAmount);
        if (tx) setBurnAmount("");
    };

    const handleBuy = async () => {
        if (!buyAmount) return;
        const tx = await buyTokens(buyAmount);
        if (tx) setBuyAmount("");
    };

    const refreshAll = () => {
        refreshWallet();
        refreshVesting();
        refreshICO();
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-12 text-center text-white">
                        <Logo size={80} className="mx-auto mb-6 brightness-0 invert" />
                        <h2 className="text-2xl font-black mb-2">Connect Your Wallet</h2>
                        <p className="text-blue-100 opacity-80 text-sm leading-relaxed">
                            To manage your SANJ tokens, participate in the ICO, or claim rewards, please connect your secure medical node.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-900 pb-20">
            {/* Hero Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 rounded-2xl">
                            <Coins className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">SANJ Token <span className="text-indigo-600">Hub</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Native Utility Protocol</p>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshAll}
                        className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest gap-2"
                    >
                        <RefreshCw className={`h-3 w-3 ${(tokenLoading || icoLoading || vestingLoading) ? 'animate-spin' : ''}`} />
                        Sync Data
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: "Your Balance", value: balance, icon: Wallet, color: "bg-indigo-50", text: "text-indigo-600" },
                        { label: "Total Supply", value: totalSupply, icon: BarChart3, color: "bg-blue-50", text: "text-blue-600" },
                        { label: "Claimable", value: claimable, icon: Gift, color: "bg-emerald-50", text: "text-emerald-600" },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
                            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                                <stat.icon className={`h-6 w-6 ${stat.text}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{Number(stat.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
                                <span className={`text-xs font-black uppercase ${stat.text}`}>SANJ</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-10 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit mx-auto">
                    {[
                        { id: "wallet", label: "Wallet Management", icon: Wallet },
                        { id: "ico", label: "Token Launch (ICO)", icon: Timer },
                        { id: "vesting", label: "Vesting Schedule", icon: Gift },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] transition-all font-black text-xs uppercase tracking-widest ${
                                tab === t.id 
                                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {tab === "wallet" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="border-none shadow-xl rounded-[2.5rem] p-10 bg-white">
                                    <CardHeader className="p-0 mb-8">
                                        <CardTitle className="text-2xl font-black flex items-center gap-3">
                                            <ArrowUpRight className="text-indigo-600" />
                                            Transfer Tokens
                                        </CardTitle>
                                        <CardDescription>Send SANJ to other medical nodes or patients.</CardDescription>
                                    </CardHeader>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipient Address</label>
                                            <Input 
                                                placeholder="0x..." 
                                                value={sendTo} 
                                                onChange={(e) => setSendTo(e.target.value)}
                                                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold focus-visible:ring-indigo-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount to Send</label>
                                            <div className="relative">
                                                <Input 
                                                    placeholder="0.00" 
                                                    type="number" 
                                                    value={sendAmount} 
                                                    onChange={(e) => setSendAmount(e.target.value)}
                                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold pr-16 focus-visible:ring-indigo-600"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-indigo-600">SANJ</div>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleTransfer} 
                                            disabled={tokenLoading || !sendTo || !sendAmount} 
                                            className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest gap-3"
                                        >
                                            {tokenLoading ? "Processing Transaction..." : "Initiate Secure Transfer"}
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-xl rounded-[2.5rem] p-10 bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <Flame size={120} />
                                    </div>
                                    <CardHeader className="p-0 mb-8">
                                        <CardTitle className="text-2xl font-black flex items-center gap-3">
                                            <Flame className="text-rose-500" />
                                            Token Deflation
                                        </CardTitle>
                                        <CardDescription>Permanently remove tokens from the supply to increase scarcity.</CardDescription>
                                    </CardHeader>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount to Burn</label>
                                            <Input 
                                                placeholder="0.00" 
                                                type="number" 
                                                value={burnAmount} 
                                                onChange={(e) => setBurnAmount(e.target.value)}
                                                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold focus-visible:ring-rose-500"
                                            />
                                        </div>
                                        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                                            <div className="flex gap-3">
                                                <Info className="h-5 w-5 text-rose-500 shrink-0" />
                                                <p className="text-xs font-medium text-rose-700 leading-relaxed">
                                                    Burning tokens is irreversible. These tokens will be removed from your wallet and the total supply forever.
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleBurn} 
                                            disabled={tokenLoading || !burnAmount} 
                                            variant="destructive" 
                                            className="w-full h-16 rounded-[1.5rem] bg-rose-500 hover:bg-rose-600 font-black text-sm uppercase tracking-widest"
                                        >
                                            Confirm Burn Sequence
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {tab === "ico" && (
                            <div className="max-w-3xl mx-auto">
                                <Card className="border-none shadow-2xl rounded-[3rem] p-12 bg-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500"></div>
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                        <div>
                                            <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                                {stats.active ? "ICO Active & Secured" : "ICO Closed"}
                                            </Badge>
                                            <CardTitle className="text-4xl font-black tracking-tighter text-slate-800">Launch Your Node</CardTitle>
                                            <CardDescription className="text-base mt-2">Acquire SANJ tokens at protocol base rates.</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Protocol Rate</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl font-black text-indigo-600 tracking-tighter">1 ETH</span>
                                                <ChevronRight className="text-slate-300" />
                                                <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.rate} SANJ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div>
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Funding Progress</p>
                                                    <p className="text-lg font-black text-slate-800">{Number(stats.raised).toLocaleString()} / {Number(stats.hardCap).toLocaleString()} ETH</p>
                                                </div>
                                                <p className="text-xs font-black text-indigo-600">{((Number(stats.raised) / Number(stats.hardCap)) * 100).toFixed(1)}% Completed</p>
                                            </div>
                                            <Progress value={(Number(stats.raised) / Number(stats.hardCap)) * 100} className="h-4 rounded-full bg-slate-100" />
                                        </div>

                                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Investment Amount (ETH)</label>
                                                <div className="relative">
                                                    <Input 
                                                        placeholder="0.00" 
                                                        type="number" 
                                                        value={buyAmount} 
                                                        onChange={(e) => setBuyAmount(e.target.value)}
                                                        className="h-16 rounded-2xl border-slate-200 bg-white font-bold pr-16 focus-visible:ring-indigo-600 text-lg"
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-sm text-slate-400">ETH</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-sm px-2">
                                                <span className="text-slate-500 font-medium">Estimated Tokens:</span>
                                                <span className="font-black text-slate-800">{(buyAmount * stats.rate).toLocaleString()} SANJ</span>
                                            </div>

                                            <Button 
                                                onClick={handleBuy} 
                                                disabled={icoLoading || !stats.active || !buyAmount} 
                                                className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-xl"
                                            >
                                                {icoLoading ? "Securing Allocation..." : "Execute Purchase Protocol"}
                                            </Button>
                                        </div>

                                        {icoError && (
                                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                                                <p className="text-xs font-bold text-rose-600">{icoError}</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {tab === "vesting" && (
                            <div className="max-w-2xl mx-auto">
                                <Card className="border-none shadow-xl rounded-[2.5rem] p-10 bg-white text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Gift size={120} />
                                    </div>
                                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                        <Gift className="h-10 w-10 text-emerald-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Claim Your Rewards</h2>
                                    <p className="text-slate-500 mb-10 max-w-sm mx-auto">
                                        Tokens earned through the Wellness Program or early participation are released periodically.
                                    </p>

                                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 mb-8 relative">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Currently Available</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{Number(claimable).toLocaleString()}</span>
                                            <span className="text-sm font-black text-emerald-600 uppercase">SANJ</span>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={claim} 
                                        disabled={vestingLoading || parseFloat(claimable) === 0} 
                                        className="w-full h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-emerald-600/20"
                                    >
                                        {vestingLoading ? "Transmitting Rewards..." : "Claim Available Tokens"}
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>

                                    {vestingError && <p className="mt-4 text-rose-500 text-xs font-bold">{vestingError}</p>}
                                </Card>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}