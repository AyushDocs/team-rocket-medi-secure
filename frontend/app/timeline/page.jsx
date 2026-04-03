"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Rocket, Zap, Shield, Clock } from "lucide-react";
import Timeline from "@/components/Timeline";
import timelineData from "../../data/timeline.json";
import { Button } from "@/components/ui/button";

export default function TimelinePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-purple-700">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-[#703FA1]" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-700 to-blue-600">
                  Sanjeevni
                </span>
              </div>
            </div>
            
            <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
              Live Progress
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>48-Hour Development Blitz</span>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl">
            Sanjeevni <span className="text-[#703FA1]">Timeline</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Witness the rapid evolution of the first decentralized platform for secure medical records and ethical data monetization.
          </p>
        </div>
      </section>

      {/* Timeline Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white shadow-xl shadow-purple-100/20">
          <Timeline data={timelineData} />
        </div>
        
        {/* Footer Note */}
        <div className="mt-16 text-center space-y-4">
          <div className="p-1 px-4 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-semibold">
            <Rocket className="w-4 h-4" />
            <span>Mission Status: Production Ready</span>
          </div>
          <p className="text-gray-400 text-sm">
            Last Updated: April 3rd, 2026 • 06:15 PM
          </p>
        </div>
      </main>
    </div>
  );
}
