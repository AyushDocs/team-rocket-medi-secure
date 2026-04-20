"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, FileText, Shield, Siren, User, Crown, LayoutDashboard, ShoppingBag, Heart, Lock } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../context/Web3Context"
import RoleGuard from "@/components/RoleGuard"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/Logo"


export default function PatientDashboardLayout({ children }) {
  const { account, disconnect, doctorContract } = useWeb3()
  const router = useRouter()
  const pathname = usePathname()
  const [emergencyAlert, setEmergencyAlert] = useState(null)

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  useEffect(() => {
      const checkEmergencies = async () => {
          if(!doctorContract || !account) return;
          try {
              const filter = doctorContract.filters.EmergencyAccessGranted(null, account);
              const events = await doctorContract.queryFilter(filter); 
              
              if(events.length > 0) {
                  const latest = events[events.length - 1];
                  const timestamp = latest.args[4];
                  const ipfsHash = latest.args[2];
                  const doctorAddr = latest.args[0];
                  
                  const resolveFilter = doctorContract.filters.EmergencyResolved(account);
                  const resolveEvents = await doctorContract.queryFilter(resolveFilter);
                  
                  const isActuallyResolved = resolveEvents.some(r => 
                      r.args[2] === ipfsHash && r.blockNumber > latest.blockNumber
                  );

                  if (isActuallyResolved) {
                      setEmergencyAlert(null);
                      return;
                  }

                  const now = Math.floor(Date.now() / 1000);
                  if (now - Number(timestamp) < 86400) { 
                      setEmergencyAlert({
                          doctor: doctorAddr,
                          reason: latest.args[3],
                          ipfsHash: ipfsHash,
                          txn: latest.transactionHash
                      });
                      toast("SMS ALERT: Emergency Access Detected!", {
                          icon: '🚨',
                          style: { borderRadius: '20px', background: '#ef4444', color: '#fff', fontWeight: 'bold' },
                          duration: 5000,
                      });
                  }
              }
          } catch(e) { console.error("Emergency Check Failed:", e); }
      }
      checkEmergencies();
  }, [account, doctorContract]);

  const handleResolveEmergency = async () => {
      if (!emergencyAlert || !doctorContract) return;
      try {
          const tx = await doctorContract.resolveEmergency(emergencyAlert.doctor, emergencyAlert.ipfsHash);
          await tx.wait();
          setEmergencyAlert(null);
          toast.success("Emergency Alert Dismissed.");
      } catch (e) {
          console.error("Dismiss failed", e);
          toast.error("Failed to dismiss alert.");
      }
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/patient/dashboard/overview' },
    { id: 'records', label: 'Health Records', icon: FileText, href: '/patient/dashboard/records' },
    { id: 'access-requests', label: 'Trust Circle', icon: Shield, href: '/patient/dashboard/access-requests' },
    { id: 'marketplace', label: 'Data Bank', icon: ShoppingBag, href: '/patient/dashboard/marketplace', premium: true },
    { id: 'insurance', label: 'Insurance', icon: Heart, href: '/patient/dashboard/insurance' },
    { id: 'profile', label: 'Vault Profile', icon: User, href: '/patient/dashboard/profile' },
  ]

  const getCurrentTab = () => {
    const item = navItems.find(item => pathname.includes(item.id))
    return item ? item.id : 'overview'
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] selection:bg-blue-100 italic-none">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 glass border-b-none py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size={40} />
            
            <div className="hidden md:flex h-8 w-[1px] bg-slate-200"></div>
            
            <div className="hidden md:flex items-center gap-4">
               {navItems.map((item) => (
                 <Link key={item.id} href={item.href}>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${pathname.includes(item.id) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                       <item.icon size={14} />
                       {item.label}
                       {item.premium && <Crown size={10} className={pathname.includes(item.id) ? 'text-blue-200' : 'text-amber-400'} />}
                    </button>
                 </Link>
               ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div 
                className="hidden lg:flex flex-col items-end cursor-pointer group"
                onDoubleClick={() => {
                   if (account) {
                      navigator.clipboard.writeText(account);
                      toast.success("Address copied to clipboard!", {
                        icon: '📋',
                        style: { borderRadius: '12px', background: '#1e293b', color: '#fff' }
                      });
                   }
                }}
                title="Double-click to copy address"
             >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">Authenticated Proxy</p>
                <p className="text-xs font-bold text-slate-700 font-mono group-hover:text-blue-600 transition-colors">{account?.slice(0,6)}...{account?.slice(-4)}</p>
             </div>
             <Link href="/patient/dashboard/profile">
                <Avatar className="h-10 w-10 ring-2 ring-slate-100 hover:ring-blue-400 transition-all cursor-pointer">
                  <AvatarImage src="/man.jpg" />
                  <AvatarFallback className="font-black bg-blue-50 text-blue-600">P</AvatarFallback>
                </Avatar>
             </Link>
             <Button 
                onClick={handleLogout} 
                variant="ghost"
                className="rounded-xl px-4 font-black text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                Sign Out
              </Button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {emergencyAlert && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-600 text-white overflow-hidden shadow-2xl relative"
            >
              <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl animate-pulse">
                        <Siren size={24} />
                      </div>
                      <div>
                          <p className="text-lg font-black tracking-tight leading-none">Security Override Initiated</p>
                          <p className="text-sm font-medium opacity-90 mt-1">
                             Dr. {emergencyAlert.doctor.slice(0,6)} requested emergency bypass for "{emergencyAlert.reason}"
                          </p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <Button onClick={handleResolveEmergency} className="bg-white text-red-600 hover:bg-blue-50 font-black rounded-xl px-6 shadow-xl active:scale-95 transition-all">
                          Dismiss & Log Safe
                      </Button>
                      <Button variant="outline" className="border-white/30 text-white hover:bg-red-700 bg-transparent rounded-xl font-black">
                          Track Audit Trail
                      </Button>
                  </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <motion.div
           key={pathname}
           initial={{ opacity: 0, x: 10 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <RoleGuard role="patient">
            {children}
          </RoleGuard>
        </motion.div>
      </main>

      {/* Security Health Indicator */}
      <footer className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span className="flex items-center gap-1"><Lock size={12} className="text-emerald-500" /> AES-256</span>
            <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> Proof-of-Health</span>
            <span className="flex items-center gap-1 text-slate-500">Node Status: Operational</span>
         </div>
         <p className="text-[10px] font-black text-slate-400">MediSecure v2.1.0-prod</p>
      </footer>
    </div>
  )
}
