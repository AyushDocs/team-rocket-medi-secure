"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Shield, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../context/Web3Context"

export default function InsuranceSignup() {
    const { insuranceContract, account } = useWeb3()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!insuranceContract || !account) {
            toast.error("Please connect your wallet first.")
            return
        }

        try {
            setLoading(true)
            // The contract now only takes Name for registration. 
            // Policies are created separately in the dashboard.
            const tx = await insuranceContract.registerInsuranceProvider(name)
            
            toast.promise(tx.wait(), {
                loading: 'Registering your company on-chain...',
                success: 'Registration successful!',
                error: 'Registration failed.',
            })
            
            await tx.wait()
            router.push("/insurance/dashboard")
        } catch (error) {
            console.error(error)
            toast.error(error.reason || "Registration failed. Check if you are already registered.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 font-outfit">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <Card className="max-w-md w-full bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl rounded-[2.5rem] relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardHeader className="text-center pt-10 pb-6">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-black text-white tracking-tight">Enterprise Setup</CardTitle>
                    <CardDescription className="text-gray-400 font-medium mt-2">Register your insurance company on the MediSecure network.</CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Company Name
                            </Label>
                            <Input 
                                id="name" 
                                placeholder="e.g. Rohindia Healthcare" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-medium"
                                required 
                            />
                        </div>
                        
                        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-start gap-4">
                            <Sparkles className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                            <p className="text-sm text-gray-400 leading-relaxed">
                                After registration, you'll be able to create and manage multiple insurance plans, set dynamic premiums, and authorize coverage for patients.
                            </p>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-500 h-16 rounded-2xl font-black text-white text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50" 
                            disabled={loading || !name}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    REGISTERING...
                                </div>
                            ) : "COMPLETE REGISTRATION"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
