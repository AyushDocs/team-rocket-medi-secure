"use client"

import { Button } from "@/components/ui/button"
import { Shield, Menu, X, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function PublicNavbar() {
    const router = useRouter()
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Only show on public routes
    const publicRoutes = ["/", "/about", "/contact", "/login"]
    const isPublicRoute = publicRoutes.includes(pathname)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    if (!isPublicRoute) return null

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ]

    return (
        <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className={`backdrop-blur-xl border transition-all duration-500 rounded-[2rem] px-8 py-4 flex items-center justify-between ${scrolled ? 'bg-white/80 border-slate-200 shadow-xl' : 'bg-transparent border-transparent'}`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className={`text-xl font-black tracking-tight italic transition-colors ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>MediSecure</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-10">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href}
                                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${pathname === link.href ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center space-x-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push('/login')}
                            className={`hidden md:flex font-bold text-[11px] uppercase tracking-widest px-6 transition-colors text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl`}
                        >
                            Sign In
                        </Button>
                        <Button 
                            onClick={() => router.push('/login')}
                            className={`rounded-xl px-8 h-12 font-black text-[11px] tracking-widest uppercase transition-all active:scale-95 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200`}
                        >
                            Get Started <ArrowRight className="h-4 w-4" />
                        </Button>

                        {/* Mobile Toggle */}
                        <button 
                            className={`md:hidden p-2 transition-colors text-slate-900`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-[90] bg-white pt-32 px-10 flex flex-col space-y-8"
                    >
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`text-4xl font-black italic tracking-tighter ${pathname === link.href ? 'text-blue-600' : 'text-slate-900'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <hr className="border-slate-100" />
                        <Button 
                            onClick={() => {
                                setMobileMenuOpen(false)
                                router.push('/login')
                            }}
                            className="bg-blue-600 text-white h-16 rounded-2xl font-black text-xl italic shadow-2xl shadow-blue-600/20"
                        >
                            Enter Portal
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
