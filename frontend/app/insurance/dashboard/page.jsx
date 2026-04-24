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
import { 
    CheckCircle2, 
    Edit2, 
    FileCheck, 
    LayoutDashboard, 
    LogOut, 
    Plus, 
    ScrollText, 
    Shield, 
    Users,
    Activity,
    ArrowUpRight,
    Zap,
    Clock,
    Search,
    ChevronRight,
    PlusCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useWeb3 } from "@/context/Web3Context"
import RoleGuard from "@/components/RoleGuard"
import { motion, AnimatePresence } from "framer-motion"

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    return (
        <RoleGuard role="insurance">
            <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-outfit relative overflow-hidden">
                {/* Ambient Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
                    <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-indigo-600/5 rounded-full blur-[80px]"></div>
                </div>

                {/* Header */}
                <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-black/20">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div 
                            className="flex items-center space-x-3 cursor-pointer group" 
                            onClick={() => router.push('/')}
                        >
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-white leading-none">MediInsurance</h1>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Enterprise Portal</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                            <div className="text-right border-r border-white/10 pr-6 hidden sm:block">
                                <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Authenticated Provider</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-sm font-bold text-gray-200">{account?.substring(0, 6)}...{account?.substring(38)}</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                onClick={handleLogout} 
                                className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all font-bold px-5"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Exit
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                    {/* Hero Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge className="bg-blue-600/10 text-blue-400 border-blue-600/20 px-3 py-1 font-bold rounded-full text-[10px] tracking-widest uppercase">Overview</Badge>
                                <span className="text-white/20">/</span>
                                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Real-time Node</span>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tight">Insurance Control</h2>
                            <p className="text-gray-500 font-medium mt-2 max-w-xl">Scale your coverage globally. Manage dynamic policies and verify ZK-proofs from the decentralized registry.</p>
                        </div>
                        
                        <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] px-8 h-16 font-black shadow-2xl shadow-blue-600/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group">
                                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    MINT NEW POLICY
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0f1115] border-white/5 text-white sm:max-w-[550px] rounded-[2.5rem] p-10 overflow-hidden shadow-3xl">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black">{editingPolicy ? 'Update Strategy' : 'Mint New Policy'}</DialogTitle>
                                    <p className="text-gray-500 text-sm font-medium">Configure risk parameters and premium logic for the blockchain.</p>
                                </DialogHeader>
                                <div className="space-y-6 py-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Policy Name</Label>
                                        <Input 
                                            value={policyForm.name} 
                                            onChange={(e) => setPolicyForm({...policyForm, name: e.target.value})}
                                            placeholder="e.g. Platinum Health Guard" 
                                            className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Description</Label>
                                        <Textarea 
                                            value={policyForm.description} 
                                            onChange={(e) => setPolicyForm({...policyForm, description: e.target.value})}
                                            placeholder="Specify coverage scope..." 
                                            className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] text-white focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Base Premium (ETH)</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.premium} 
                                                onChange={(e) => setPolicyForm({...policyForm, premium: e.target.value})}
                                                placeholder="0.05" 
                                                className="bg-white/5 border-white/10 rounded-2xl h-14 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-gray-500 uppercase tracking-widest">Min Age</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.minAge} 
                                                onChange={(e) => setPolicyForm({...policyForm, minAge: e.target.value})}
                                                className="bg-white/5 border-white/10 rounded-2xl h-14 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-red-400 uppercase tracking-widest">Max Systolic</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.maxSystolic} 
                                                onChange={(e) => setPolicyForm({...policyForm, maxSystolic: e.target.value})}
                                                className="bg-white/5 border-white/10 rounded-2xl h-14 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-red-400 uppercase tracking-widest">Max Diastolic</Label>
                                            <Input 
                                                type="number"
                                                value={policyForm.maxDiastolic} 
                                                onChange={(e) => setPolicyForm({...policyForm, maxDiastolic: e.target.value})}
                                                className="bg-white/5 border-white/10 rounded-2xl h-14 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateUpdatePolicy} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-16 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                                        {editingPolicy ? 'EXECUTE UPDATE' : 'DEPLOY POLICY'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </motion.div>

                    {/* Dashboard Layout */}
                    <Tabs defaultValue="overview" className="space-y-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-[2rem] h-auto backdrop-blur-md">
                                <TabsTrigger value="overview" className="rounded-[1.5rem] px-10 py-3.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-3 font-black uppercase text-[11px] tracking-[0.15em] text-gray-500">
                                    <LayoutDashboard className="h-4 w-4" /> Provider Feed
                                </TabsTrigger>
                                <TabsTrigger value="policies" className="rounded-[1.5rem] px-10 py-3.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-3 font-black uppercase text-[11px] tracking-[0.15em] text-gray-500">
                                    <ScrollText className="h-4 w-4" /> Global Catalog
                                </TabsTrigger>
                            </TabsList>
                        </motion.div>

                        <TabsContent value="overview" className="space-y-10 mt-0">
                            {/* Stats Grid */}
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {[
                                    { label: "TOTAL CUSTOMERS", val: requests.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", trend: "+12%" },
                                    { label: "ZK-ELIGIBLE", val: requests.filter(r => r.isVerified).length, icon: FileCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "verified" },
                                    { label: "ACTIVE PLANS", val: policies.length, icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10", trend: "stable" }
                                ].map((s, i) => (
                                    <motion.div key={i} variants={itemVariants}>
                                        <Card className="bg-white/5 border-white/5 hover:border-white/10 transition-all group overflow-hidden relative rounded-[2rem]">
                                            <div className={`absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 ${s.color}`}>
                                                <s.icon size={120} />
                                            </div>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{s.label}</CardTitle>
                                                <div className={`p-3 rounded-2xl ${s.bg} border border-white/5`}>
                                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-end justify-between">
                                                    <p className="text-4xl font-black text-white">{s.val}</p>
                                                    <Badge className="bg-white/5 text-white/40 border-none font-bold text-[9px] uppercase tracking-widest">{s.trend}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Requests Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="bg-white/5 border-white/5 rounded-[2.5rem] overflow-hidden shadow-3xl">
                                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl font-black text-white">Incoming Requests</CardTitle>
                                            <CardDescription className="text-gray-500 font-medium mt-1">Real-time stream of quote applications from the network.</CardDescription>
                                        </div>
                                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                            <Search className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs font-bold text-gray-500">Filter Requests</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {requests.length === 0 ? (
                                            <div className="py-32 text-center">
                                                <div className="bg-white/5 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-white/5">
                                                    <Users className="h-8 w-8 text-gray-600" />
                                                </div>
                                                <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Synchronizing with registry...</p>
                                                <p className="text-gray-600 text-xs mt-2 font-medium">No incoming quote requests detected on chain.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                <AnimatePresence>
                                                    {requests.map((req) => (
                                                        <motion.div 
                                                            key={req.id} 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors gap-6 group"
                                                        >
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-blue-400 border border-white/10 group-hover:border-blue-500/30 transition-all group-hover:scale-105">
                                                                    #{req.id}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <p className="font-black text-white font-mono tracking-tight text-lg">{req.patient.substring(0,8)}...{req.patient.substring(34)}</p>
                                                                        {req.isVerified && (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                                                                                <Zap className="h-2 w-2 mr-1 fill-emerald-400" /> ZK-Eligible
                                                                            </Badge>
                                                                        )}
                                                                        {req.isFinalized && (
                                                                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                                                                                Active Vault
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                                                        <span className="flex items-center gap-1.5"><ScrollText className="h-3 w-3" /> Plan ID: {req.policyId}</span>
                                                                        <span className="text-white/10">•</span>
                                                                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Received 2m ago</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-8">
                                                                <div className="text-right">
                                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Calculated Premium</p>
                                                                    <div className="flex items-baseline justify-end gap-1.5">
                                                                        <p className="text-3xl font-black text-blue-400 tracking-tighter">{req.finalPremium}</p>
                                                                        <p className="text-xs font-black text-gray-500 uppercase">ETH</p>
                                                                    </div>
                                                                </div>
                                                                <Button 
                                                                    onClick={() => handleFinalize(req.id)}
                                                                    disabled={!req.isVerified || req.isFinalized || loading}
                                                                    className={`font-black h-14 px-8 rounded-2xl transition-all active:scale-95 text-xs tracking-widest uppercase ${
                                                                        req.isFinalized 
                                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                                                        : req.isVerified 
                                                                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20" 
                                                                        : "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
                                                                    }`}
                                                                >
                                                                    {req.isFinalized ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Authorized</> : "Finalize Order"}
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
                                        <Button variant="ghost" className="text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:text-white">
                                            View Full On-Chain History <ArrowUpRight className="h-3 w-3 ml-2" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="policies" className="space-y-8 mt-0">
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                            >
                                {policies.length === 0 ? (
                                    <div className="col-span-full py-32 text-center bg-white/5 rounded-[2.5rem] border border-white/5">
                                        <PlusCircle className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-500 font-black uppercase tracking-widest">No Policies Deployed</p>
                                        <Button 
                                            variant="link" 
                                            onClick={() => setIsPolicyModalOpen(true)}
                                            className="text-blue-400 font-bold mt-2 hover:text-blue-300"
                                        >
                                            Start by minting your first strategy
                                        </Button>
                                    </div>
                                ) : (
                                    policies.map((p) => (
                                        <motion.div key={p.id} variants={itemVariants}>
                                            <Card className="bg-white/5 border-white/5 hover:border-white/10 transition-all rounded-[2.5rem] p-4 relative group overflow-hidden">
                                                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                                    <Shield size={100} className="text-blue-400" />
                                                </div>
                                                <CardHeader className="pb-4">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${p.isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-500/10' : 'bg-gray-500/10 text-gray-500 border-white/5'}`}>
                                                            <ScrollText className="h-6 w-6" />
                                                        </div>
                                                        <Button 
                                                            onClick={() => openEditModal(p)} 
                                                            variant="ghost" 
                                                            className="h-10 w-10 p-0 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <CardTitle className="text-2xl font-black text-white">{p.name}</CardTitle>
                                                    <CardDescription className="text-gray-500 font-medium leading-relaxed mt-2 line-clamp-2">{p.description}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Max Systolic</p>
                                                            <p className="text-lg font-black text-white">{p.maxSystolic} <span className="text-[10px] text-gray-600">mmHg</span></p>
                                                        </div>
                                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Min Age</p>
                                                            <p className="text-lg font-black text-white">{p.minAge} <span className="text-[10px] text-gray-600">Yrs</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-3xl font-black text-blue-400 tracking-tighter">{p.basePremium}</p>
                                                            <p className="text-xs font-black text-gray-500 uppercase">ETH / BASE</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{p.isActive ? "Network Active" : "Paused"}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" className="text-blue-400 font-black text-[10px] tracking-widest uppercase hover:bg-transparent">
                                                        View Metrics <ChevronRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </main>

                {/* Footer Gradient */}
                <div className="h-64 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none"></div>
            </div>
        </RoleGuard>
    )
}
