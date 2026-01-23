"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/context/Web3Context"
import { Hospital, Shield } from "lucide-react"
import { useRouter } from "next/navigation"


export default function HospitalDashboardLayout({ children }) {
  const { account, disconnect } = useWeb3()
  const router = useRouter()

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Hospital className="h-7 w-7 text-emerald-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Hospital Admin</h1>
                <p className="text-sm text-gray-600 truncate">Wallet: {account}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Verified Entity</span>
              </div>
              <Button onClick={handleLogout} variant="outline" className="text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
           <RoleGuard role="hospital">
                {children}
           </RoleGuard>
      </div>
    </div>
  )
}
