"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, FileText, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useWeb3 } from "../../../context/Web3Context"

import { useEffect, useState } from "react"
// ... imports

export default function PatientDashboardLayout({ children }) {
  const { account, disconnect, patientContract, loading } = useWeb3()
  const router = useRouter()
  const pathname = usePathname()
  const [verifying, setVerifying] = useState(true)

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  useEffect(() => {
      const verifyPatient = async () => {
          if (!loading && patientContract && account) {
              try {
                  const exists = await patientContract.userExists(account);
                  if (!exists) {
                      console.warn("Account is not a registered patient. Redirecting.");
                      router.push("/patient/signup"); 
                  }
              } catch (err) {
                  console.error("Patient verification failed:", err);
              } finally {
                  setVerifying(false);
              }
          }
      };
      
      verifyPatient();
  }, [account, patientContract, loading, router]);

  const getValue = () => {
    if (pathname.includes("overview")) return "overview"
    if (pathname.includes("records")) return "records"
    if (pathname.includes("chat")) return "chat"
    if (pathname.includes("access-requests")) return "access-requests"
    if (pathname.includes("marketplace")) return "marketplace"
    return "overview"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="/man.jpg" alt="Patient Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Health Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {account}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                 <Shield className="h-4 w-4 text-[#b2e061]" />
                 <span>Secure Session</span>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={getValue()} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <Link href="/patient/dashboard/overview" className="w-full">
                <TabsTrigger value="overview" className="w-full flex items-center gap-2 cursor-pointer">
                    <Activity className="h-4 w-4" />
                    Overview
                </TabsTrigger>
            </Link>
            <Link href="/patient/dashboard/records" className="w-full">
                <TabsTrigger value="records" className="w-full flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Records
                </TabsTrigger>
            </Link>
            <Link href="/patient/dashboard/chat" className="w-full">
                <TabsTrigger value="chat" className="w-full flex items-center gap-2 cursor-pointer">
                    Chat
                </TabsTrigger>
            </Link>
            <Link href="/patient/dashboard/access-requests" className="w-full">
                <TabsTrigger value="access-requests" className="w-full flex items-center gap-2 cursor-pointer">
                    Requests
                </TabsTrigger>
            </Link>
            <Link href="/patient/dashboard/marketplace" className="w-full">
                <TabsTrigger value="marketplace" className="w-full flex items-center gap-2 cursor-pointer text-purple-700 font-bold">
                    Marketplace
                </TabsTrigger>
            </Link>
          </TabsList>
            
          {children}
        </Tabs>
      </div>
    </div>
  )
}
