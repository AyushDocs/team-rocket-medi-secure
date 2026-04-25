"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/context/Web3Context"
import { 
    Activity, 
    Building2, 
    ChevronRight, 
    Hospital, 
    LogOut, 
    ShieldCheck 
} from "lucide-react"
import { useRouter } from "next/navigation"
import RoleGuard from "@/components/RoleGuard"
import { Logo } from "@/components/Logo"
import SanjBalance from "@/components/SanjBalance"


export default function HospitalDashboardLayout({ children }) {
  const { account, disconnect } = useWeb3()
  const router = useRouter()

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      
      {/* PREMIUM HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-3">
                <Logo size={48} showText={false} />
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Station Admin</h1>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Node Verified</span>
                    </div>
                </div>
              </div>

              {/* BREADCRUMBS / CONTEXT */}
              <div className="hidden md:flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</p>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Command Center</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <SanjBalance />
              <div className="hidden sm:flex items-center gap-4 bg-emerald-50/50 px-6 py-3 rounded-2xl border border-emerald-100/50">
                <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Station Wallet</p>
                    <p className="text-xs font-mono font-bold text-emerald-900">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
                </div>
                <div className="h-8 w-[1px] bg-emerald-200/50" />
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>

              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                className="h-12 px-6 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-black text-xs uppercase tracking-widest group"
              >
                  Terminate
                  <LogOut className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
           <RoleGuard role="hospital">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {children}
                </div>
           </RoleGuard>
      </main>
      
      {/* SYSTEM STATUS FOOTER */}
      <footer className="max-w-[1600px] mx-auto px-6 lg:px-12 pb-12">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                      <Activity className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Synchronicity</p>
                      <p className="text-xs font-bold text-slate-600">Sanjeevni Protocol Alpha-01 (Mainnet-Test)</p>
                  </div>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© 2026 Sanjeevni Intelligence Systems</p>
          </div>
      </footer>
    </div>
  )
}
