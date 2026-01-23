"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Calendar, FileText, Heart, Shield, Users } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useWeb3 } from "../../../context/Web3Context"


export default function DoctorDashboardLayout({ children }) {
  const { account, disconnect } = useWeb3()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  // Helper to determine active tab based on path
  const getValue = () => {
    if (pathname.includes("overview")) return "overview"
    if (pathname.includes("patients")) return "patients"
    if (pathname.includes("appointments")) return "appointments"
    if (pathname.includes("messages")) return "messages"
    if (pathname.includes("documents")) return "documents"
    return "overview"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Heart className="h-7 w-7 text-[#7eb0d5]" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Doctor Dashboard</h1>
                <p className="text-sm text-gray-600 truncate">Wallet: {account}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-[#b2e061]" />
                <span>Secure Session</span>
              </div>
              <Button onClick={handleLogout} variant="outline" className="text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={getValue()} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <Link href="/doctor/dashboard/overview" className="w-full">
                <TabsTrigger value="overview" className="w-full flex items-center gap-2 cursor-pointer">
                    <Activity className="h-4 w-4" />Overview
                </TabsTrigger>
            </Link>
            <Link href="/doctor/dashboard/patients" className="w-full">
                <TabsTrigger value="patients" className="w-full flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" />Patients
                </TabsTrigger>
            </Link>
            <Link href="/doctor/dashboard/appointments" className="w-full">
                <TabsTrigger value="appointments" className="w-full flex items-center gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4" />Appointments
                </TabsTrigger>
            </Link>
            <Link href="/doctor/dashboard/messages" className="w-full">
                <TabsTrigger value="messages" className="w-full flex items-center gap-2 cursor-pointer">
                    Messages
                </TabsTrigger>
            </Link>
            <Link href="/doctor/dashboard/documents" className="w-full">
                <TabsTrigger value="documents" className="w-full flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />Documents
                </TabsTrigger>
            </Link>
          </TabsList>
            
          <RoleGuard role="doctor">
            {children}
          </RoleGuard>
        </Tabs>
      </div>
    </div>
  )
}
