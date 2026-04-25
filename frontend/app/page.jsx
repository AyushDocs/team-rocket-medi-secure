"use client"

import dynamic from "next/dynamic"

// Core sections
import HeroSection from "@/components/landing/HeroSection"

// Dynamic imports for sections below the fold to reduce initial bundle size
const FeaturesSection = dynamic(() => import("@/components/landing/FeaturesSection"), {
    loading: () => <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
})
const EcosystemSection = dynamic(() => import("@/components/landing/EcosystemSection"))
const CTASection = dynamic(() => import("@/components/landing/CTASection"))
const Footer = dynamic(() => import("@/components/landing/Footer"))

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-outfit overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-indigo-400/5 rounded-full blur-[100px]"></div>
            </div>

            <HeroSection />
            <FeaturesSection />
            <EcosystemSection />
            <CTASection />
            <Footer />
        </div>
    )
}