"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useWeb3 } from "../../../context/Web3Context"

export default function CompanySignup() {
  const { marketplaceContract, account } = useWeb3()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!marketplaceContract || !account) {
        setStatus("Wallet not connected or contract not loaded.")
        return
    }

    setLoading(true)
    setStatus("Registering Company...")

    try {
      const tx = await marketplaceContract.registerCompany(formData.name, formData.email)
      await tx.wait()
      
      setStatus("Registration Successful! Redirecting...")
      setTimeout(() => {
          router.push("/company/dashboard")
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus("Registration Failed: " + (err.reason || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-[#703FA1]">Company Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                required
                placeholder="Acme Biotech Inc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="contact@acme.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <Button 
                type="submit" 
                className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                disabled={loading}
            >
              {loading ? "Registering..." : "Register as Company"}
            </Button>
            
            {status && (
                <p className={`text-sm text-center ${status.includes("Success") ? "text-green-600" : "text-red-500"}`}>
                    {status}
                </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
