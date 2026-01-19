"use client"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/context/Web3Context"
import { Hospital, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HospitalDashboardLayout({ children }) {
  const { account, disconnect, hospitalContract, loading } = useWeb3()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  useEffect(() => {
      const verifyUser = async () => {
          if (!loading && hospitalContract && account) {
              try {
                  const id = await hospitalContract.walletToHospitalId(account);
                  if (id.toString() === "0") {
                      console.warn("Account is not a registered hospital. Redirecting.");
                      router.push("/hospital/signup"); 
                  }
              } catch (err) {
                  console.error("Hospital verification failed:", err);
              } finally {
                  setVerifying(false);
              }
          } else if (!loading && !account) {
               router.push("/");
          }
      };
      
      verifyUser();
  }, [account, hospitalContract, loading, router]);

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

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
           {children}
      </div>
    </div>
  )
}
