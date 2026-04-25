"use client"

import { Button } from "@/components/ui/button"
import { Shield, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import SanjBalance from "@/components/SanjBalance"

export default function InsuranceHeader({ account, onLogout }) {
    const router = useRouter()

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-slate-200 bg-white/80">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div 
                    className="flex items-center space-x-3 cursor-pointer group" 
                    onClick={() => router.push('/')}
                >
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">MediInsurance</h1>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Enterprise Portal</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-6">
                    <SanjBalance />
                    <div className="text-right border-r border-slate-200 pr-6 hidden sm:block">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Provider</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-sm font-bold text-slate-700">{account?.substring(0, 6)}...{account?.substring(38)}</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={onLogout} 
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold px-5"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Exit
                    </Button>
                </div>
            </div>
        </header>
    )
}
