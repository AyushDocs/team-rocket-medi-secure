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

    return (
        <RoleGuard role="insurance">
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
                {/* Header */}
                <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
                            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">MediInsurance Portal</h1>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                            <div className="text-right border-r pr-6 hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 leading-none mb-1">Insurance Provider</p>
                                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] uppercase tracking-wider py-0 px-2 font-bold">Verified Provider</Badge>
                            </div>
                            <Button variant="ghost" onClick={handleLogout} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-semibold">
                                <LogOut className="h-4 w-4 mr-2" />
                                Log Out
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                            <p className="text-gray-500 text-sm">Manage your insurance policies and verify patient eligibility.</p>
                        </div>
                        <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                    <Plus className="h-5 w-5" /> NEW POLICY
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Policy Name</Label>
                                        <Input 
                                            value={policyForm.name} 
                                            onChange={(e) => setPolicyForm({...policyForm, name: e.target.value})}
                                            placeholder="e.g. Standard Health Plan" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Description</Label>
                                        <Textarea 
                                            value={policyForm.description} 
                                            onChange={(e) => setPolicyForm({...policyForm, description: e.target.value})}
                                            placeholder="What does this coverage include?" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Base Premium (ETH)</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.premium} 
                                                onChange={(e) => setPolicyForm({...policyForm, premium: e.target.value})}
                                                placeholder="0.05" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Min Age Requirement</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.minAge} 
                                                onChange={(e) => setPolicyForm({...policyForm, minAge: e.target.value})}
                                                placeholder="18" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Max Systolic BP</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.maxSystolic} 
                                                onChange={(e) => setPolicyForm({...policyForm, maxSystolic: e.target.value})}
                                                placeholder="140" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Max Diastolic BP</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.maxDiastolic} 
                                                onChange={(e) => setPolicyForm({...policyForm, maxDiastolic: e.target.value})}
                                                placeholder="90" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateUpdatePolicy} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                                        {editingPolicy ? 'Update Policy' : 'Create Policy'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-white border p-1 rounded-xl h-auto">
                            <TabsTrigger value="overview" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2 font-bold">
                                <LayoutDashboard className="h-4 w-4" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="policies" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2 font-bold">
                                <ScrollText className="h-4 w-4" /> Manage Policies
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-8 mt-0">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "TOTAL CUSTOMERS", val: requests.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "ZK-ELIGIBLE LEADS", val: requests.filter(r => r.isVerified).length, icon: FileCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { label: "ACTIVE PLANS", val: policies.length, icon: ScrollText, color: "text-purple-600", bg: "bg-purple-50" }
                                ].map((s, i) => (
                                    <Card key={i} className="border-none shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">{s.label}</CardTitle>
                                            <div className={`p-2 rounded-lg ${s.bg}`}>
                                                <s.icon className={`h-4 w-4 ${s.color}`} />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-3xl font-bold text-gray-900">{s.val}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Requests Table */}
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardHeader className="border-b bg-white">
                                    <CardTitle className="text-xl font-bold">Service Requests</CardTitle>
                                    <CardDescription>Recent quote applications from network patients</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {requests.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 font-medium">No incoming requests detected on chain.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {requests.map((req) => (
                                                <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 border">
                                                            #{req.id}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-bold text-gray-900 font-mono">{req.patient.substring(0,8)}...{req.patient.substring(36)}</p>
                                                                {req.isVerified && <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">ZK-Eligible</Badge>}
                                                                {req.isFinalized && <Badge className="bg-blue-100 text-blue-700 border-none font-bold">Active Policy</Badge>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-medium">Policy Selection: Plan #{req.policyId} • {req.isFinalized ? "Completed" : "Action Required"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Final Premium</p>
                                                            <p className="text-xl font-bold text-blue-600">{req.finalPremium} <span className="text-xs ml-0.5">ETH</span></p>
                                                        </div>
                                                        <Button 
                                                            onClick={() => handleFinalize(req.id)}
                                                            disabled={!req.isVerified || req.isFinalized || loading}
                                                            size="sm"
                                                            className={`font-bold h-10 px-5 rounded-lg ${
                                                                req.isFinalized 
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                                                : req.isVerified 
                                                                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                                                : "bg-gray-100 text-gray-400 border cursor-not-allowed"
                                                            }`}
                                                        >
                                                            {req.isFinalized ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Activated</> : "Authorize"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="policies" className="space-y-6 mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {policies.map((p) => (
                                    <Card key={p.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`p-2.5 rounded-xl ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                                                    <ScrollText className="h-5 w-5" />
                                                </div>
                                                <Button onClick={() => openEditModal(p)} variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                            </div>
                                            <CardTitle className="text-xl font-bold text-gray-900">{p.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{p.description}</CardDescription>
                                        </Header>
                                        <CardContent className="flex items-center justify-between border-t pt-4">
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-2xl font-bold text-blue-600">{p.basePremium}</p>
                                                <p className="text-xs font-bold text-gray-500 uppercase font-mono">ETH</p>
                                            </div>
                                            <Badge variant="outline" className={`${p.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'} font-bold`}>
                                                {p.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </RoleGuard>
    )
}
