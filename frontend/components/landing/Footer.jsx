"use client"

import { Shield } from "lucide-react"

function Link({ children, href, className }) {
    return (
        <a href={href} className={className}>
            {children}
        </a>
    )
}

export default function Footer() {
    return (
        <footer className="py-20 border-t border-slate-100 px-6 bg-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center space-x-3 group">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900 italic">MediSecure</span>
                </div>
                <div className="flex items-center space-x-12">
                    <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Privacy Protocol</Link>
                    <Link href="/contact" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Emergency Node</Link>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">© 2026 MediSecure Foundation</span>
                </div>
            </div>
        </footer>
    )
}
