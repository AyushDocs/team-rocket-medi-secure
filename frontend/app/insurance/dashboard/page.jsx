"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Plus, LayoutDashboard, ScrollText } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWeb3 } from "@/context/Web3Context"
import toast from "react-hot-toast"
import RoleGuard from "@/components/RoleGuard"

import InsuranceHeader from "@/components/insurance/InsuranceHeader"
import KPIGrid from "@/components/insurance/KPIGrid"
import RequestRoster from "@/components/insurance/RequestRoster"

const PolicyCatalog = dynamic(() => import("@/components/insurance/PolicyCatalog"), {
    loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-[2.5rem]" />
})

const PolicyManagementModal = dynamic(() => import("@/components/insurance/PolicyManagementModal"), {
    ssr: false
})

export default function InsuranceDashboard() {
    const { account, insuranceContract, disconnect } = useWeb3()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState([])
    const [policies, setPolicies] = useState([])
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    
    // Policy Form State
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
    const [editingPolicy, setEditingPolicy] = useState(null)
    const [policyForm, setPolicyForm] = useState({ 
        name: "", 
        description: "", 
        premium: "",
        minAge: "18",
        maxSystolic: "140",
        maxDiastolic: "90",
        requiredVaccine: "1"
    })

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!insuranceContract || !account) return
            try {
                const { ethers } = await import("ethers");
                const [contractRequests, contractPolicies] = await Promise.all([
                    insuranceContract.getProviderInsuranceRequests(account),
                    insuranceContract.getProviderPolicies(account)
                ])
                
                setRequests(contractRequests.map(req => ({
                    id: Number(req.requestId),
                    policyId: Number(req.policyId),
                    patient: req.patient,
                    finalPremium: ethers.formatEther(req.finalPremium),
                    isVerified: req.isVerified,
                    isCalculated: req.isCalculated,
                    isFinalized: req.isFinalized
                })).sort((a, b) => b.id - a.id))

                setPolicies(contractPolicies.map(p => ({
                    id: Number(p.id),
                    name: p.name,
                    description: p.description,
                    basePremium: ethers.formatEther(p.basePremium),
                    isActive: p.isActive,
                    minAge: Number(p.minAge),
                    maxSystolic: Number(p.maxSystolic),
                    maxDiastolic: Number(p.maxDiastolic),
                    requiredVaccine: Number(p.requiredVaccine)
                })))
                
            } catch (err) {
                console.error(err)
                toast.error("Failed to load dashboard data")
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [account, insuranceContract, router, refreshTrigger])

    const handleCreateUpdatePolicy = async () => {
        try {
            setLoading(true)
            const { ethers } = await import("ethers");
            const premiumWei = ethers.parseEther(policyForm.premium)
            let tx;
            
            if (editingPolicy) {
                tx = await insuranceContract.updatePolicy(
                    editingPolicy.id, 
                    policyForm.name, 
                    policyForm.description, 
                    premiumWei, 
                    true,
                    Number(policyForm.minAge),
                    Number(policyForm.maxSystolic),
                    Number(policyForm.maxDiastolic),
                    Number(policyForm.requiredVaccine)
                )
            } else {
                tx = await insuranceContract.createPolicy(
                    policyForm.name, 
                    policyForm.description, 
                    premiumWei,
                    Number(policyForm.minAge),
                    Number(policyForm.maxSystolic),
                    Number(policyForm.maxDiastolic),
                    Number(policyForm.requiredVaccine)
                )
            }
            
            toast.promise(tx.wait(), {
                loading: editingPolicy ? 'Updating policy...' : 'Creating policy...',
                success: editingPolicy ? 'Policy updated!' : 'Policy created!',
                error: 'Transaction failed',
            })
            
            await tx.wait()
            setIsPolicyModalOpen(false)
            setEditingPolicy(null)
            setPolicyForm({ name: "", description: "", premium: "", minAge: "18", maxSystolic: "140", maxDiastolic: "90", requiredVaccine: "1" })
            setRefreshTrigger(prev => prev + 1)
        } catch (err) {
            console.error(err)
            toast.error(err.reason || "Blockchain Error")
        } finally {
            setLoading(false)
        }
    }

    const handleFinalize = async (requestId) => {
        try {
            const tx = await insuranceContract.finalizePolicy(requestId)
            toast.promise(tx.wait(), {
                loading: 'Finalizing policy...',
                success: 'Policy finalized successfully!',
                error: 'Failed to finalize policy',
            })
            await tx.wait()
            setRefreshTrigger(prev => prev + 1)
        } catch (err) {
            console.error(err)
            toast.error(err.reason || "Error finalizing policy")
        }
    }

    const handleLogout = () => {
        disconnect()
        router.push("/")
    }

    const openEditModal = (policy) => {
        setEditingPolicy(policy)
        setPolicyForm({
            name: policy.name,
            description: policy.description,
            premium: policy.basePremium,
            minAge: policy.minAge.toString(),
            maxSystolic: policy.maxSystolic.toString(),
            maxDiastolic: policy.maxDiastolic.toString(),
            requiredVaccine: policy.requiredVaccine.toString()
        })
        setIsPolicyModalOpen(true)
    }

    return (
        <RoleGuard role="insurance">
            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-outfit relative overflow-hidden">
                {/* Ambient Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-[120px]"></div>
                </div>

                <InsuranceHeader account={account} onLogout={handleLogout} />

                <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                    {/* Hero Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge className="bg-blue-100 text-blue-600 border-none px-3 py-1 font-bold rounded-full text-[10px] tracking-widest uppercase">Overview</Badge>
                                <span className="text-slate-200">/</span>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Real-time Node</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Insurance Control</h2>
                            <p className="text-slate-500 font-medium mt-2 max-w-xl">Scale your coverage globally. Manage dynamic policies and verify ZK-proofs from the decentralized registry.</p>
                        </div>
                        
                        <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] px-8 h-16 font-black shadow-xl shadow-blue-200 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group">
                                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    MINT NEW POLICY
                                </Button>
                            </DialogTrigger>
                            <PolicyManagementModal 
                                editingPolicy={editingPolicy}
                                policyForm={policyForm}
                                setPolicyForm={setPolicyForm}
                                handleCreateUpdatePolicy={handleCreateUpdatePolicy}
                            />
                        </Dialog>
                    </motion.div>

                    {/* Dashboard Layout */}
                    <Tabs defaultValue="overview" className="space-y-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <TabsList className="bg-slate-50 border border-slate-100 p-1.5 rounded-[2rem] h-auto">
                                <TabsTrigger value="overview" className="rounded-[1.5rem] px-10 py-3.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-3 font-black uppercase text-[11px] tracking-[0.15em] text-slate-400">
                                    <LayoutDashboard className="h-4 w-4" /> Provider Feed
                                </TabsTrigger>
                                <TabsTrigger value="policies" className="rounded-[1.5rem] px-10 py-3.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-3 font-black uppercase text-[11px] tracking-[0.15em] text-slate-400">
                                    <ScrollText className="h-4 w-4" /> Global Catalog
                                </TabsTrigger>
                            </TabsList>
                        </motion.div>

                        <TabsContent value="overview" className="space-y-10 mt-0">
                            <KPIGrid requests={requests} policies={policies} />
                            <RequestRoster requests={requests} handleFinalize={handleFinalize} loading={loading} />
                        </TabsContent>

                        <TabsContent value="policies" className="space-y-8 mt-0">
                            <PolicyCatalog 
                                policies={policies} 
                                onEdit={openEditModal}
                                onOpenCreate={() => setIsPolicyModalOpen(true)}
                            />
                        </TabsContent>
                    </Tabs>
                </main>

                {/* Footer Spacer */}
                <div className="h-20"></div>
            </div>
        </RoleGuard>
    )
}
