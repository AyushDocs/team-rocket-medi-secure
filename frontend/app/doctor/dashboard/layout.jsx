"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import RoleGuard from "@/components/RoleGuard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Activity, 
    Calendar, 
    ChevronRight, 
    FileText, 
    Heart, 
    LogOut, 
    MessageSquare, 
    ShieldCheck, 
    Users 
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useWeb3 } from "../../../context/Web3Context"
import { Logo } from "@/components/Logo"
import SanjBalance from "@/components/SanjBalance"


export default function DoctorDashboardLayout({ children }) {
  const { account, disconnect } = useWeb3()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  const getActiveTab = () => {
    if (pathname.includes("overview")) return "overview"
    if (pathname.includes("patients")) return "patients"
    if (pathname.includes("appointments")) return "appointments"
    if (pathname.includes("messages")) return "messages"
    if (pathname.includes("documents")) return "documents"
    return "overview"
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Premium Gradient Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Logo size={48} showText={false} />
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Sanjeevni <span className="text-indigo-600">MedLink</span></h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px]">Node: {account}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <SanjBalance />
              <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Secure Session</span>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                className="group h-11 px-4 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold"
              >
                <LogOut className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Finalize Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Modern Tabs Navigation */}
        <div className="mb-10">
            <Tabs value={getActiveTab()} className="w-full">
                <TabsList className="h-auto p-1.5 bg-slate-100 rounded-[1.5rem] grid grid-cols-2 md:grid-cols-5 gap-1 shadow-inner">
                    <Link href="/doctor/dashboard/overview" className="contents">
                        <TabsTrigger 
                            value="overview" 
                            className="h-12 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-2"
                        >
                            <Activity className="h-4 w-4" /> Overview
                        </TabsTrigger>
                    </Link>
                    <Link href="/doctor/dashboard/patients" className="contents">
                        <TabsTrigger 
                            value="patients" 
                            className="h-12 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" /> Patients
                        </TabsTrigger>
                    </Link>
                    <Link href="/doctor/dashboard/appointments" className="contents">
                        <TabsTrigger 
                            value="appointments" 
                            className="h-12 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4" /> Scheduler
                        </TabsTrigger>
                    </Link>
                    <Link href="/doctor/dashboard/messages" className="contents">
                        <TabsTrigger 
                            value="messages" 
                            className="h-12 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-2"
                        >
                            <MessageSquare className="h-4 w-4" /> Messages
                        </TabsTrigger>
                    </Link>
                    <Link href="/doctor/dashboard/documents" className="contents">
                        <TabsTrigger 
                            value="documents" 
                            className="h-12 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4" /> Vault
                        </TabsTrigger>
                    </Link>
                </TabsList>
            </Tabs>
        </div>

        {/* Page Content with Entrance Animation */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            <RoleGuard role="doctor">
                {children}
            </RoleGuard>
        </div>

        {/* Support Footer */}
        <div className="mt-20 py-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400">
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                <span>Network Status: Optimal</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full" />
                <span>Protocol: v3.2.1-Beta</span>
            </div>
            <p className="text-xs font-medium">© 2026 Sanjeevni Advanced Medical Infrastructure. All node actions are audited.</p>
        </div>
      </main>
    </div>
  )
}
