"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Radio, ShieldCheck, X } from "lucide-react"
import { ethers } from "ethers"

export default function EmergencyConsole({ 
    isOnDuty, 
    dutyLoading, 
    selectedHospital, 
    setSelectedHospital, 
    knownHospitals, 
    customAddress, 
    setCustomAddress, 
    toggleDuty 
}) {
    return (
        <div className={`relative overflow-hidden rounded-[2.5rem] transition-all duration-500 shadow-2xl ${
            isOnDuty 
            ? 'bg-neutral-950 text-white shadow-red-200/20' 
            : 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-100'
        }`}>
            <div className="relative z-10 p-10 md:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge className={`${isOnDuty ? 'bg-red-500 animate-pulse' : 'bg-white/20'} text-white border-none px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase`}>
                                {isOnDuty ? "Critical Access Protocol Active" : "Standby Mode"}
                            </Badge>
                            {isOnDuty && (
                                <div className="flex items-center gap-2 text-red-500 font-black text-xs animate-pulse">
                                    <Radio className="h-4 w-4" /> LIVE NODE
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            {isOnDuty ? "Emergency Duty Active" : "Clinical Command Console"}
                        </h1>
                        <p className={`max-w-xl text-lg font-medium ${isOnDuty ? 'text-neutral-400' : 'text-indigo-100'}`}>
                            {isOnDuty 
                                ? "You have elevated permissions for the selected station. All 'Break Glass' actions are historically immutable."
                                : "Initialize your duty status to access emergency records and real-time station telemetry."}
                        </p>
                    </div>

                    <div className={`p-8 rounded-[2rem] border backdrop-blur-3xl min-w-[340px] shadow-inner ${
                        isOnDuty ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'
                    }`}>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-1">Hospital Station</label>
                                <Select value={selectedHospital} onValueChange={setSelectedHospital} disabled={isOnDuty || dutyLoading}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-400">
                                        <SelectValue placeholder="Select Station" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {(knownHospitals || []).map(h => (
                                            <SelectItem key={h.address} value={h.address} className="font-bold">{h.name}</SelectItem>
                                        ))}
                                        <SelectItem value="custom" className="text-indigo-600 font-bold italic">Private Network Address...</SelectItem>
                                    </SelectContent>
                                </Select>
                                {selectedHospital === "custom" && !isOnDuty && (
                                    <input 
                                        type="text"
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-mono placeholder:opacity-30 focus:outline-none focus:border-white/40 transition-all mt-2"
                                        placeholder="0x Station Hash"
                                        value={customAddress}
                                        onChange={(e) => setCustomAddress(e.target.value)} 
                                    />
                                )}
                            </div>
                            <Button 
                                onClick={toggleDuty} 
                                disabled={dutyLoading}
                                className={`w-full h-14 rounded-2xl font-black text-base transition-all active:scale-95 shadow-xl ${
                                    isOnDuty 
                                    ? 'bg-neutral-100 text-neutral-950 hover:bg-white' 
                                    : 'bg-indigo-400 text-white hover:bg-indigo-300 shadow-indigo-500/20'
                                }`}
                            >
                                {dutyLoading ? (
                                    <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" /> Synchronizing...</span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {isOnDuty ? <X className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                        {isOnDuty ? "PUNCH OUT STATION" : "INITIALIZE DUTY"}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background Decorations */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] -mr-64 -mt-64 transition-colors duration-1000 ${isOnDuty ? 'bg-red-900/40' : 'bg-indigo-400/20'}`} />
            <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[80px] -ml-32 -mb-32 transition-colors duration-1000 ${isOnDuty ? 'bg-neutral-800' : 'bg-violet-400/20'}`} />
        </div>
    )
}
