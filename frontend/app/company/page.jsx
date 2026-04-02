"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Building2, Shield, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../context/Web3Context"

export default function CompanyLanding() {
  const { marketplaceContract, account, connect, loading } = useWeb3()
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  // Auto-Redirect if registered
  useEffect(() => {
    const checkRegistration = async () => {
        if (marketplaceContract && account) {
            setChecking(true);
            try {
                const isCompany = await marketplaceContract.isCompany(account);
                if (isCompany) {
                    router.push("/company/dashboard");
                }
            } catch(e) {
                console.error("Company check failed:", e);
            } finally {
                setChecking(false);
            }
        }
    };
    checkRegistration();
  }, [marketplaceContract, account, router]);

  const handleRegister = () => {
      router.push("/company/signup");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b py-4">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-purple-700" />
                  <span className="font-bold text-xl text-gray-800">MediMarketplace</span>
              </div>
              <div>
                  {/* If connected but not redirected, show address */}
                  {account ? <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{account.slice(0,6)}...{account.slice(-4)}</span> : null}
              </div>
          </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                  Unlock Medical Insights with <span className="text-[#703FA1]">Secure Data</span>
              </h1>
              <p className="text-lg text-gray-600">
                  Join the world's first blockchain-powered medical data marketplace. Buy anonymized, patient-consented datasets directly from the source.
              </p>
          </div>

          {!account ? (
              <Button onClick={connect} size="lg" className="bg-[#703FA1] text-lg px-8 py-6 h-auto">
                  {loading ? "Connecting..." : "Connect Company Wallet"}
              </Button>
          ) : (
              <div className="space-y-4">
                  {checking ? (
                      <p className="text-purple-600 animate-pulse">Verifying Credentials...</p>
                  ) : (
                      <div className="flex flex-col gap-3">
                        <Button onClick={handleRegister} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8">
                            Register New Company
                        </Button>
                        <p className="text-sm text-gray-500">Already registered? You should have been redirected.</p>
                      </div>
                  )}
              </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl">
              <Card className="bg-white/50 backdrop-blur">
                  <CardHeader><Building2 className="h-8 w-8 text-purple-600 mx-auto" /></CardHeader>
                  <CardContent><h3 className="font-bold">Company Profile</h3><p className="text-sm text-gray-500">Build your reputation.</p></CardContent>
              </Card>
              <Card className="bg-white/50 backdrop-blur">
                  <CardHeader><TrendingUp className="h-8 w-8 text-green-600 mx-auto" /></CardHeader>
                  <CardContent><h3 className="font-bold">Real-time Data</h3><p className="text-sm text-gray-500">Access fresh records instantly.</p></CardContent>
              </Card>
              <Card className="bg-white/50 backdrop-blur">
                  <CardHeader><Shield className="h-8 w-8 text-blue-600 mx-auto" /></CardHeader>
                  <CardContent><h3 className="font-bold">Ethical & Legal</h3><p className="text-sm text-gray-500">100% Patient Consented.</p></CardContent>
              </Card>
          </div>
      </main>
    </div>
  )
}
