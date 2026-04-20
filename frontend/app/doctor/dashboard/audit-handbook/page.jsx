"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    BookOpen, 
    ChevronLeft, 
    Fingerprint, 
    Gavel, 
    History, 
    ShieldAlert, 
    ShieldCheck, 
    Terminal, 
    Zap 
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function AuditHandbook() {
  const router = useRouter()

  const handleAcknowledge = () => {
      toast.success("Protocol Acknowledged. Node Synchronized.")
      setTimeout(() => {
          router.push("/doctor/dashboard/documents")
      }, 1000)
  }
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-outfit pb-20">
        
        {/* BACK BUTTON */}
        <Link href="/doctor/dashboard/documents">
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Return to Vault
            </Button>
        </Link>

        {/* HERO SECTION */}
        <div className="text-center space-y-6 py-12">
            <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
                <Gavel className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
                <h1 className="text-5xl font-black text-slate-800 tracking-tight">Audit Handbook</h1>
                <p className="text-xl font-medium text-slate-500 max-w-2xl mx-auto">The definitive guide to clinical accountability and immutable record sovereignty on the Sanjeevni Protocol.</p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Protocol v4.2 Compliance</Badge>
                <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Blockchain Validated</Badge>
            </div>
        </div>

        {/* CORE PRINCIPLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                {
                    title: "Immutability",
                    desc: "Every record access event is cryptographically hashed and stored on the blockchain, creating a permanent, tamper-proof audit trail.",
                    icon: Fingerprint,
                    color: "indigo"
                },
                {
                    title: "Sovereignty",
                    desc: "Patients maintain total ownership of their encryption keys. Doctors act as temporary custodians of health data with explicit authorization.",
                    icon: ShieldCheck,
                    color: "emerald"
                },
                {
                    title: "Transparency",
                    desc: "The Sanjeevni Protocol ensures that every 'Break-Glass' event is immediately visible to the patient and global compliance nodes.",
                    icon: Terminal,
                    color: "amber"
                }
            ].map((p, i) => (
                <Card key={i} className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white p-8 space-y-6 hover:-translate-y-2 transition-transform duration-500">
                    <div className={`h-14 w-14 rounded-2xl bg-${p.color}-50 flex items-center justify-center`}>
                        <p.icon className={`h-7 w-7 text-${p.color}-600`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">{p.title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{p.desc}</p>
                    </div>
                </Card>
            ))}
        </div>

        {/* DETAILED SECTIONS */}
        <div className="space-y-16 pt-8">
            
            {/* 1. ACCESS TIERS */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <History className="h-5 w-5 text-slate-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Data Authorization Tiers</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="rounded-[2.5rem] border-2 border-slate-100 p-10 bg-white">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 mb-6 font-black uppercase tracking-tighter">Tier 1: Standard</Badge>
                        <h4 className="text-xl font-black mb-4">Patient-Initiated Consent</h4>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                            The standard protocol involves a cryptographic handshake where the patient explicitly authorizes a doctor address to access a specific file hash for a fixed duration.
                        </p>
                        <ul className="space-y-3">
                            {['Encryption key share (via Proxy)', 'Auto-expiry of session', 'Blockchain event: AccessGranted'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
                                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full" /> {item}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="rounded-[2.5rem] border-2 border-red-50 p-10 bg-white">
                        <div className="flex gap-2">
                             <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 mb-6 font-black uppercase tracking-tighter">Tier 2: High-Criticality</Badge>
                             <Badge className="bg-red-600 text-white animate-pulse border-none px-3 py-1 mb-6 font-black uppercase tracking-tighter">Break Glass</Badge>
                        </div>
                        <h4 className="text-xl font-black mb-4">Autonomous Emergency Seizure</h4>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                            By-pass protocol allowed ONLY in life-threatening scenarios. Requires a verified "On-Duty" status at a recognized hospital node.
                        </p>
                        <ul className="space-y-3">
                            {['Immediate Audit Seizure broadcast', 'Doctor status verification', 'Post-event ethical review'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
                                    <div className="h-1.5 w-1.5 bg-red-500 rounded-full" /> {item}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </section>

            {/* 2. THE AUDIT LOG */}
            <section className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group">
                <div className="relative z-10 max-w-2xl space-y-6">
                    <h2 className="text-4xl font-black tracking-tight">The Immutable Witness</h2>
                    <p className="text-indigo-200 text-lg font-medium opacity-80">
                        Every clinical action you take within the Sanjeevni ecosystem is broadcast to the peer-to-peer network. 
                    </p>
                    <div className="space-y-4 pt-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                            <h5 className="font-black text-indigo-400 uppercase tracking-widest text-[10px] mb-2 font-mono">Blockchain Transaction Payload</h5>
                            <code className="text-xs text-white/60 font-mono leading-relaxed break-all">
                                {`{ "event": "ResourceAccess", "actor": "0xDr...882", "target": "0xPat...11a", "resource": "QmHash...", "mode": "Emergency", "station": "0xHosp...12b" }`}
                            </code>
                        </div>
                    </div>
                </div>
                <BookOpen className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
            </section>

            {/* 3. ETHICAL CHARTER */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ethical Compliance Charter</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        As a registered healthcare professional on the Sanjeevni Protocol, you are bound by dual accountability systems: traditional medical ethics (Hippocratic Oath) and algorithmic clinical transparency. 
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                        <div>
                            <h4 className="font-black text-slate-800 text-lg mb-4">Authorized Use Cases</h4>
                            <p className="text-sm">Active clinical consultation with patient consent, legitimate emergency response while on duty, and multidisciplinary review within an authorized medical group.</p>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-lg mb-4">Unauthorized Conduct</h4>
                            <p className="text-sm">Unauthorized duplication of records (screenshots), access for curiosities sake, and facilitating access without valid clinical justification.</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>

        {/* FINAL ADVISORY */}
        <div className="bg-indigo-50 rounded-[2.5rem] p-12 text-center space-y-8">
            <h3 className="text-2xl font-black text-indigo-900">Protocol Verification Complete</h3>
            <p className="text-indigo-600 max-w-xl mx-auto font-bold opacity-80">
                You are currently operating under Protocol Version 4.2. Ensure your terminal remains secure and you finalize sessions after every review.
            </p>
            <div className="flex justify-center gap-4">
                <Button 
                    onClick={handleAcknowledge}
                    className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200"
                >
                    Acknowledge & Sync
                </Button>
            </div>
        </div>

    </div>
  )
}
