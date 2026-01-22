"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ethers } from "ethers"
import { CheckCircle2, Edit2, FileCheck, LayoutDashboard, LogOut, Plus, ScrollText, Shield, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useWeb3 } from "../../../context/Web3Context"

export default function InsuranceDashboard() {
    const { account, insuranceContract, disconnect } = useWeb3()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState([])
    const [policies, setPolicies] = useState([])
    const [providerData, setProviderData] = useState(null)
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
                const data = await insuranceContract.insuranceProviders(account)
                if (!data.isActive) {
                    router.push("/insurance/signup")
                    return
                }
                setProviderData({
                    id: data.id,
                    name: data.name
                })

                // Fetch real data from contract
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

    if (loading && !providerData) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 flex flex-col font-outfit">
            {/* Glossy Header */}
            <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">PROVIDER PORTAL</h1>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        <div className="text-right border-r border-white/10 pr-6">
                            <p className="text-sm font-black text-white leading-none mb-1">{providerData?.name}</p>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-black uppercase tracking-widest py-0.5">Verified Partner</Badge>
                        </div>
                        <Button variant="ghost" onClick={disconnect} className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold">
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full space-y-10">
                <Tabs defaultValue="overview" className="space-y-10">
                    <div className="flex justify-between items-end">
                        <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                            <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2 font-bold">
                                <LayoutDashboard className="h-4 w-4" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="policies" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2 font-bold">
                                <ScrollText className="h-4 w-4" /> Manage Policies
                            </TabsTrigger>
                        </TabsList>
                        
                        <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-6 py-6 font-black shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95">
                                    <Plus className="h-5 w-5" /> NEW POLICY
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#12141c] border-white/10 text-white rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">{editingPolicy ? 'EDIT POLICY' : 'NEW INSURANCE PLAN'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">Plan Name</Label>
                                        <Input 
                                            value={policyForm.name} 
                                            onChange={(e) => setPolicyForm({...policyForm, name: e.target.value})}
                                            placeholder="e.g. Platinum Health Plus" 
                                            className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</Label>
                                        <Textarea 
                                            value={policyForm.description} 
                                            onChange={(e) => setPolicyForm({...policyForm, description: e.target.value})}
                                            placeholder="What does this coverage include?" 
                                            className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Base Premium (ETH)</Label>
                                        <Input 
                                            type="number"
                                            value={policyForm.premium} 
                                            onChange={(e) => setPolicyForm({...policyForm, premium: e.target.value})}
                                            placeholder="0.1" 
                                            className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Min Age</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.minAge} 
                                                onChange={(e) => setPolicyForm({...policyForm, minAge: e.target.value})}
                                                placeholder="18" 
                                                className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Vaccine Stat (0/1)</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.requiredVaccine} 
                                                onChange={(e) => setPolicyForm({...policyForm, requiredVaccine: e.target.value})}
                                                placeholder="1" 
                                                className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Max Systolic BP</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.maxSystolic} 
                                                onChange={(e) => setPolicyForm({...policyForm, maxSystolic: e.target.value})}
                                                placeholder="140" 
                                                className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Max Diastolic BP</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.maxDiastolic} 
                                                onChange={(e) => setPolicyForm({...policyForm, maxDiastolic: e.target.value})}
                                                placeholder="90" 
                                                className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateUpdatePolicy} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 font-black transition-all">
                                        {editingPolicy ? 'SAVE CHANGES' : 'DEPLOY POLICY'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "TOTAL CUSTOMERS", val: requests.length, icon: Users, color: "from-blue-500 to-indigo-600" },
                                { label: "ZK-ELIGIBLE LEADS", val: requests.filter(r => r.isVerified).length, icon: FileCheck, color: "from-emerald-500 to-teal-600" },
                                { label: "ACTIVE PLANS", val: policies.length, icon: ScrollText, color: "from-purple-500 to-pink-600" }
                            ].map((s, i) => (
                                <Card key={i} className="bg-white/5 border-white/5 shadow-2xl overflow-hidden relative group">
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`}></div>
                                    <CardHeader className="pb-2 relative z-10">
                                        <s.icon className="h-5 w-5 text-gray-500 mb-2" />
                                        <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{s.label}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <p className="text-4xl font-black text-white tracking-tight">{s.val}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Requests Table */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="p-10 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-white">Service Requests</h2>
                                    <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Recent quote applications from network patients</p>
                                </div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {requests.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <Users className="h-10 w-10 text-gray-800 mx-auto mb-4" />
                                        <p className="text-gray-500 font-bold tracking-tight">No incoming requests detected on chain.</p>
                                    </div>
                                ) : (
                                    requests.map((req) => (
                                        <div key={req.id} className="p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-blue-500 border border-white/5 group-hover:border-blue-500/30 transition-all">
                                                    #{req.id}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <p className="font-bold text-lg text-white font-mono">{req.patient.substring(0,8)}...{req.patient.substring(36)}</p>
                                                        {req.isVerified && <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">ZK-Eligible</Badge>}
                                                        {req.isFinalized && <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Active Policy</Badge>}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Policy Selection: Plan #{req.policyId} • Status: {req.isFinalized ? "Completed" : "Action Required"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-10 mt-6 sm:mt-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Final Premium</p>
                                                    <p className="text-2xl font-black text-blue-500 leading-none">{req.finalPremium} <span className="text-xs text-blue-900 ml-1 uppercase">eth</span></p>
                                                </div>
                                                <Button 
                                                    onClick={() => handleFinalize(req.id)}
                                                    disabled={!req.isVerified || req.isFinalized || loading}
                                                    className={`h-14 rounded-2xl px-10 font-black shadow-2xl transition-all active:scale-95 flex items-center gap-2 ${
                                                        req.isFinalized 
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                                        : req.isVerified 
                                                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" 
                                                        : "bg-white/5 text-gray-600 border border-white/5"
                                                    }`}
                                                >
                                                    {req.isFinalized ? <><CheckCircle2 className="h-5 w-5" /> ACTIVATED</> : "AUTHORIZE COVERAGE"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="policies" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {policies.map((p) => (
                                <Card key={p.id} className="bg-white/5 border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                                    <CardHeader className="p-10 pb-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-3 rounded-2xl ${p.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                <ScrollText className="h-6 w-6" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => openEditModal(p)} variant="ghost" className="bg-white/5 hover:bg-white/10 rounded-xl h-10 w-10 p-0 text-gray-400 hover:text-white">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-white mb-2">{p.name}</CardTitle>
                                        <CardDescription className="text-gray-500 text-base leading-relaxed font-medium">
                                            {p.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <div className="px-10 pb-10 flex items-center justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black text-blue-500">{p.basePremium}</p>
                                            <p className="text-sm font-bold text-gray-600 uppercase">ETH Base</p>
                                        </div>
                                        <Badge className={`${p.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} border-none rounded-lg px-4 py-1.5 font-bold uppercase tracking-widest text-[9px]`}>
                                            {p.isActive ? "Published & Live" : "Inactive"}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
