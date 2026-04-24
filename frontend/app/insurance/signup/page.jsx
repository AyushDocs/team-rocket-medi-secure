"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Shield, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../context/Web3Context"
import { motion } from "framer-motion"

export default function InsuranceSignup() {
    const { insuranceContract, account } = useWeb3()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")

    useEffect(() => {
        const checkExisting = async () => {
            if (insuranceContract && account) {
                try {
                    const provider = await insuranceContract.insuranceProviders(account)
                    // status 1 is ACTIVE
                    if (provider && Number(provider.status) === 1) {
                        router.push("/insurance/dashboard")
                    }
                } catch (error) {
                    console.error("Error checking existing registration:", error)
                }
            }
        }
        checkExisting()
    }, [insuranceContract, account, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!insuranceContract || !account) {
            toast.error("Please connect your wallet first.")
            return
        }

        try {
            setLoading(true)
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
        <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 font-outfit relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden border">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <CardHeader className="text-center pt-12 pb-6">
                        <motion.div 
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            className="flex justify-center mb-6"
                        >
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-3xl shadow-2xl shadow-blue-500/20 ring-4 ring-white/5">
                                <Shield className="h-10 w-10 text-white" />
                            </div>
                        </motion.div>
                        <CardTitle className="text-3xl font-black text-white tracking-tight">Enterprise Setup</CardTitle>
                        <CardDescription className="text-gray-400 font-medium mt-2">Register your insurance company on the MediSecure network.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-10 pb-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Building2 className="h-3 w-3" /> Provider Identity
                                </Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Rohindia Healthcare" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-white/5 border-white/10 rounded-2xl h-16 text-white focus:ring-2 focus:ring-blue-500/50 transition-all text-lg font-medium placeholder:text-gray-600"
                                    required 
                                />
                            </div>
                            
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-start gap-4"
                            >
                                <Sparkles className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    Your provider ID will be linked to your wallet address: <span className="text-blue-400 font-bold">{account?.substring(0,6)}...{account?.substring(38)}</span>. 
                                    This allows you to mint dynamic policies and verify patient ZK-proofs.
                                </p>
                            </motion.div>

                            <Button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-500 h-16 rounded-2xl font-black text-white text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50" 
                                disabled={loading || !name}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        INITIALIZING...
                                    </div>
                                ) : "COMPLETE SETUP"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
