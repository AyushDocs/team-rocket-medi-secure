"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CTASection() {
    const router = useRouter()

    return (
        <section className="py-40 px-6">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[4rem] p-16 text-center relative overflow-hidden shadow-3xl shadow-blue-500/30">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
                
                <div className="relative z-10 space-y-8">
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">READY TO JOIN THE REVOLUTION?</h2>
                    <p className="text-blue-50 text-xl font-medium max-w-2xl mx-auto">Start your journey toward secure, decentralized healthcare today. Connect your identity to explore the ecosystem.</p>
                    <Button 
                        onClick={() => router.push('/login')}
                        className="bg-white text-blue-600 hover:bg-slate-50 rounded-[2rem] px-16 h-20 font-black text-2xl italic transition-all shadow-2xl active:scale-95 flex items-center gap-4 mx-auto border-none"
                    >
                        ENTER PORTAL <ChevronRight className="h-8 w-8" />
                    </Button>
                </div>
            </div>
        </section>
    )
}
