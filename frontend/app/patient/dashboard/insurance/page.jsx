"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ethers } from "ethers"
import { AlertCircle, ArrowRight, CheckCircle2, FileLock2, Gem, Shield, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import * as snarkjs from "snarkjs"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientInsurance() {
    const { account, insuranceContract, patientContract, patientDetailsContract } = useWeb3()
    const [policies, setPolicies] = useState([])
    const [myRequests, setMyRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const fetchInsuranceData = async () => {
        if (!insuranceContract || !account) return
        try {
            const [allPolicies, requests] = await Promise.all([
                insuranceContract.getAllActivePolicies(),
                insuranceContract.getPatientInsuranceRequests(account)
            ])
            setPolicies(allPolicies)
            setMyRequests(requests)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInsuranceData()
    }, [insuranceContract, account])

    const handleRequestQuote = async (policyId) => {
        try {
            setActionLoading(true)
            const tx = await insuranceContract.requestInsuranceQuote(policyId)
            toast.promise(tx.wait(), {
                loading: 'Submitting quote request...',
                success: 'Quote requested successfully!',
                error: 'Failed to request quote',
            })
            await tx.wait()
            fetchInsuranceData()
        } catch (err) {
            console.error(err)
            toast.error(err.reason || "Failed to request quote")
        } finally {
            setActionLoading(false)
        }
    }

    const handleSubmitProof = async (requestId, policy) => {
        const toastId = toast.loading("Preparing ZK-Proof generation...");
        try {
            setActionLoading(true)

            // 1. Fetch Patient Data (Age)
            const patientId = await patientContract.walletToPatientId(account)
            const patient = await patientContract.getPatientDetails(patientId)
            const age = Number(patient.age)

            // 2. Fetch Vitals (Blood Pressure)
            const vitals = await patientDetailsContract.getVitals(account)
            let systolic = 120
            let diastolic = 80
            
            if (vitals.bloodPressure && vitals.bloodPressure.includes("/")) {
                const parts = vitals.bloodPressure.split("/")
                systolic = parseInt(parts[0])
                diastolic = parseInt(parts[1])
            }

            // 3. Define Thresholds (Public Inputs from the Policy)
            const minAge = Number(policy.minAge)
            const requiredVaccine = Number(policy.requiredVaccine)
            const maxSystolic = Number(policy.maxSystolic)
            const maxDiastolic = Number(policy.maxDiastolic)

            toast.loading("Generating Zero-Knowledge Proof locally...", { id: toastId })

            // 4. Generate ZK-Proof
            const input = {
                age: age,
                vaccinationStatus: 1, 
                systolicBP: systolic,
                diastolicBP: diastolic,
                minAge: minAge,
                requiredVaccinationStatus: requiredVaccine,
                maxSystolicBP: maxSystolic,
                maxDiastolicBP: maxDiastolic
            }

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                "/zk/premium_calc.wasm",
                "/zk/premium_calc_final.zkey"
            )

            // 5. Format Proof for Solidity
            const a = [proof.pi_a[0], proof.pi_a[1]]
            const b = [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]]
            ]
            const c = [proof.pi_c[0], proof.pi_c[1]]
            const pubSignals = publicSignals.map(s => s.toString())

            toast.loading("Submitting Proof to Blockchain Verifier...", { id: toastId })
            
            const tx = await insuranceContract.submitInsuranceProof(requestId, a, b, c, pubSignals)
            await tx.wait()
            
            toast.success("ZK-Proof Verified! 20% Discount applied.", { id: toastId })
            fetchInsuranceData()
        } catch (err) {
            console.error("ZK Error:", err)
            toast.error("ZK Verification failed: " + (err.reason || err.message), { id: toastId })
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-12 py-8 px-4 font-outfit">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-10 text-white shadow-2xl shadow-blue-200">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none py-1.5 px-4 backdrop-blur-md rounded-full font-black tracking-widest uppercase text-[10px]">
                            Private Insurance Marketplace
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Unlock Premium Privacy</h1>
                        <p className="text-blue-100 max-w-lg text-lg font-medium">Verify your health status using Zero-Knowledge Proofs. Access lower premiums without ever sharing your private medical data.</p>
                    </div>
                    <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-xl border border-white/20 shadow-inner">
                        <Shield className="h-20 w-20 text-blue-200 animate-pulse" />
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Available Policies */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Gem className="h-6 w-6 text-blue-600" />
                            Active Health Plans
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{policies.length} Plans Available</span>
                    </div>

                    {policies.length === 0 ? (
                        <Card className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
                            <CardContent className="py-20 text-center flex flex-col items-center gap-4">
                                <Sparkles className="h-10 w-10 text-gray-200" />
                                <p className="text-gray-400 font-bold">No insurance plans are currently being offered.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {policies.map((p) => (
                                <Card key={p.id} className="group overflow-hidden rounded-[2rem] border-none shadow-xl shadow-gray-100 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300">
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                                Plan #{p.id.toString()}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Starting At</p>
                                                <p className="text-xl font-black text-blue-600">{ethers.formatEther(p.basePremium)} ETH</p>
                                            </div>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</CardTitle>
                                        <CardDescription className="text-gray-500 font-medium text-base leading-relaxed mt-2">{p.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 flex items-center justify-between border-t border-gray-50 mt-4 bg-gray-50/50">
                                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                            <Shield className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-600">ZK-Verified Discount Applied</span>
                                        </div>
                                        <Button 
                                            onClick={() => handleRequestQuote(p.id)}
                                            disabled={actionLoading}
                                            className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 font-black shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            Get Quote <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Requests */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <FileLock2 className="h-6 w-6 text-purple-600" />
                            My Subscriptions
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{myRequests.length} Active Quotes</span>
                    </div>

                    {myRequests.length === 0 ? (
                        <Card className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
                            <CardContent className="py-20 text-center flex flex-col items-center gap-4">
                                <FileLock2 className="h-10 w-10 text-gray-200" />
                                <p className="text-gray-400 font-bold">You haven't requested any quotes yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {myRequests.map((req) => (
                                <Card key={req.requestId} className={`rounded-[2rem] border-none shadow-xl shadow-gray-100 overflow-hidden ${req.isVerified ? "ring-2 ring-emerald-500/20" : ""}`}>
                                    <CardContent className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Policy Quote #{req.requestId.toString()}</p>
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-3xl font-black text-gray-900">{ethers.formatEther(req.finalPremium)}</p>
                                                    <p className="text-sm font-bold text-gray-400">ETH</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {req.isFinalized ? (
                                                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight">
                                                        <Shield className="h-3 w-3 mr-2" /> Active Policy
                                                    </Badge>
                                                ) : req.isVerified ? (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight">
                                                        <CheckCircle2 className="h-3 w-3 mr-2" /> ZK-Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-purple-50 text-purple-600 border-purple-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight">
                                                        <AlertCircle className="h-3 w-3 mr-2" /> Awaiting Proof
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {!req.isVerified && !req.isFinalized && (
                                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-3xl border border-blue-100 shadow-inner">
                                                <p className="text-sm text-blue-900 font-bold mb-4 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                                    Unlock 20% Health Discount
                                                </p>
                                                <Button 
                                                    className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none shadow-lg shadow-blue-100 rounded-2xl font-black py-6 transition-all active:scale-95"
                                                    onClick={() => {
                                                        const p = policies.find(p => p.id.toString() === req.policyId.toString())
                                                        handleSubmitProof(req.requestId, p)
                                                    }}
                                                    disabled={actionLoading}
                                                >
                                                    Generate ZK-Proof Locally
                                                </Button>
                                            </div>
                                        )}
                                        
                                        {req.isVerified && !req.isFinalized && (
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                <div className="bg-emerald-500 p-1.5 rounded-lg">
                                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-xs font-bold text-emerald-700">Verified. Waiting for provider and final policy activation.</span>
                                            </div>
                                        )}

                                        {req.isFinalized && (
                                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                                <div className="bg-blue-500 p-1.5 rounded-lg">
                                                    <Shield className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-xs font-bold text-blue-700">Your policy is active. Coverage is currently live and secured.</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
