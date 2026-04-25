"use client"
 
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { 
    Activity, 
    AtSign, 
    Droplets, 
    HeartPulse, 
    Mail, 
    Phone, 
    Plus, 
    Save, 
    ShieldCheck, 
    Sparkles, 
    Stethoscope, 
    Thermometer, 
    User, 
    Wallet 
} from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"
 
export default function PatientProfile() {
    const { patientContract, patientDetailsContract, account } = useWeb3()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [updatingVitals, setUpdatingVitals] = useState(false)
    
    // Profile State
    const [profile, setProfile] = useState({
        username: "",
        name: "",
        email: "",
        age: "",
        bloodGroup: ""
    })
 
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
 
    // Health Vitals State
    const [vitals, setVitals] = useState({
        bloodPressure: "",
        weight: "",
        height: "",
        heartRate: "",
        temperature: "",
        lastUpdated: 0
    })
 
    // Nominees State
    const [nominees, setNominees] = useState([])
    const [newNominee, setNewNominee] = useState({
        name: "",
        walletAddress: "",
        relationship: "",
        contactNumber: ""
    })
    const [addingNominee, setAddingNominee] = useState(false)
 
    useEffect(() => {
        const fetchData = async () => {
            if (!patientContract || !account) return;
            try {
                setLoading(true)
                const patientId = await patientContract.walletToPatientId(account)
                
                if (patientId.toString() === "0") {
                   toast.error("Profile not found. Please register.");
                   setLoading(false);
                   return;
                }
 
                // Fetch Details
                const details = await patientContract.getPatientDetails(patientId);
                setProfile({
                    username: details.username,
                    name: details.name,
                    email: details.email,
                    age: details.age.toString(),
                    bloodGroup: details.bloodGroup
                });
 
                // Fetch Nominees
                const fetchedNominees = await patientContract.getNominees(patientId);
                setNominees(fetchedNominees);
 
                // Fetch Vitals from PatientDetails contract
                if (patientDetailsContract) {
                    const healthVitals = await patientDetailsContract.getVitals(account);
                    setVitals({
                        bloodPressure: healthVitals.bloodPressure,
                        weight: healthVitals.weight,
                        height: healthVitals.height,
                        heartRate: healthVitals.heartRate,
                        temperature: healthVitals.temperature,
                        lastUpdated: Number(healthVitals.lastUpdated)
                    });
                }
 
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [patientContract, patientDetailsContract, account]);
 
    const validateEmail = (email) => {
        return String(email)
          .toLowerCase()
          .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };
 
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (!profile.name || !profile.email || !profile.age || !profile.bloodGroup) {
            toast.error("All profile fields are required.");
            return;
        }
 
        if (!validateEmail(profile.email)) {
            toast.error("Please enter a valid email address.");
            return;
        }
 
        const ageNum = Number(profile.age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
            toast.error("Please enter a valid age (0-120).");
            return;
        }
 
        try {
            setUpdating(true);
            const tx = await patientContract.updatePatientDetails(
                profile.name,
                profile.email,
                ageNum,
                profile.bloodGroup
            );
            toast.promise(tx.wait(), {
                loading: 'Updating Blockchain Identity...',
                success: 'Profile Secured on Chain!',
                error: 'Update Reverted on Chain'
            });
            await tx.wait();
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.reason || "Failed to update profile.");
        } finally {
            setUpdating(false);
        }
    };
 
    const handleAddNominee = async (e) => {
        e.preventDefault();
        
        if (!newNominee.walletAddress.startsWith("0x") || newNominee.walletAddress.length !== 42) {
            toast.error("Please enter a valid Ethereum wallet address.");
            return;
        }
 
        try {
            setAddingNominee(true);
            const tx = await patientContract.addNominee(
                newNominee.name,
                newNominee.walletAddress,
                newNominee.relationship,
                newNominee.contactNumber
            );
            toast.promise(tx.wait(), {
                loading: 'Registering Emergency Contact...',
                success: 'Nominee Authorized!',
                error: 'Permission Denied'
            });
            await tx.wait();
            
            // Refresh Nominees
            const patientId = await patientContract.walletToPatientId(account);
            const fetchedNominees = await patientContract.getNominees(patientId);
            setNominees(fetchedNominees);
            
            // Reset Form
            setNewNominee({ name: "", walletAddress: "", relationship: "", contactNumber: "" });
 
        } catch (error) {
            console.error("Add Nominee error:", error);
            toast.error(error.reason || "Failed to add nominee.");
        } finally {
            setAddingNominee(false);
        }
    };
 
    const handleUpdateVitals = async (e) => {
        e.preventDefault();
        if (!patientDetailsContract) return;
 
        try {
            setUpdatingVitals(true);
            const tx = await patientDetailsContract.setVitals(
                vitals.bloodPressure,
                vitals.weight,
                vitals.height,
                vitals.heartRate,
                vitals.temperature
            );
            toast.promise(tx.wait(), {
                loading: 'Syncing Vitals to Encrypted Vault...',
                success: 'Biometrics Updated!',
                error: 'Sync Failed'
            });
            await tx.wait();
            
            setVitals(prev => ({ ...prev, lastUpdated: Math.floor(Date.now() / 1000) }));
        } catch (error) {
            console.error("Vitals update error:", error);
            toast.error(error.reason || "Failed to update health vitals.");
        } finally {
            setUpdatingVitals(false);
        }
    };
 
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-8 space-y-12 font-outfit">
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-[2.5rem]" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                        <Skeleton className="h-96 rounded-[2rem]" />
                        <Skeleton className="h-96 rounded-[2rem]" />
                        <Skeleton className="h-96 rounded-[2rem]" />
                    </div>
                </div>
            </div>
        )
    }
 
    return (
        <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 font-outfit animate-in fade-in duration-700">
            {/* Hero Profile Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="h-32 w-32 md:h-40 md:w-40 bg-white/20 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center border border-white/30 shadow-inner">
                            <User className="h-16 w-16 md:h-20 md:w-20 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-400 p-3 rounded-2xl shadow-lg border-4 border-purple-700">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="text-center md:text-left space-y-3">
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none py-1 px-4 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                Verified Patient
                            </Badge>
                            <Badge className="bg-emerald-400/20 text-emerald-300 border-none py-1 px-4 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                Active Node
                            </Badge>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{profile.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-indigo-100 font-medium opacity-90">
                            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                <AtSign className="h-4 w-4" /> @{profile.username}
                            </span>
                            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                <Wallet className="h-4 w-4" /> {account?.slice(0, 6)}...{account?.slice(-4)}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl invisible md:visible"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full -mr-32 -mb-32 blur-3xl invisible md:visible"></div>
            </div>
 
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Identity & Vitals */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Identity Matrix Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:rotate-[360deg] transition-all duration-700">
                                    <Sparkles className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                                </div>
                                <Activity className="h-5 w-5 text-indigo-100 animate-pulse" />
                            </div>
                            <CardTitle className="text-3xl font-black text-slate-800">Identity Matrix</CardTitle>
                            <CardDescription className="text-slate-500 font-medium text-lg">Your core blockchain medical identifiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Legal Full Name</Label>
                                        <div className="relative group/input">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" />
                                            <Input 
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 focus:bg-white transition-all font-bold text-slate-700"
                                                value={profile.name} 
                                                onChange={(e) => setProfile({...profile, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Digital Mailbox</Label>
                                        <div className="relative group/input">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" />
                                            <Input 
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 focus:bg-white transition-all font-bold text-slate-700"
                                                type="email" 
                                                value={profile.email}
                                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Age Matrix</Label>
                                        <Input 
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 focus:bg-white transition-all font-bold text-slate-700 pl-6"
                                            type="number" 
                                            value={profile.age}
                                            onChange={(e) => setProfile({...profile, age: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Blood Essence</Label>
                                        <Select 
                                            value={profile.bloodGroup} 
                                            onValueChange={(val) => setProfile({...profile, bloodGroup: val})}
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 focus:bg-white transition-all font-bold text-slate-700 pl-12 relative">
                                                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-400" />
                                                <SelectValue placeholder="Select Blood Group" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                {bloodGroups.map(bg => (
                                                    <SelectItem key={bg} value={bg} className="font-bold text-slate-700 rounded-xl m-1">{bg}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" disabled={updating} className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:translate-y-[-2px] active:scale-95 group">
                                    {updating ? (
                                        <span className="flex items-center gap-3">
                                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                                            Updating Vault...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-3">
                                            <Save className="h-5 w-5 group-hover:animate-bounce" /> Update Blockchain Identity
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
 
                    {/* Biometric Telemetry Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-rose-100/40 overflow-hidden bg-white mb-8 group">
                        <CardHeader className="p-8 pb-4 relative">
                            <CardTitle className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <div className="p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-500 transition-colors duration-500">
                                    <HeartPulse className="h-6 w-6 text-rose-600 group-hover:text-white" />
                                </div>
                                Biometric Telemetry
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium text-lg ml-12">Encrypted real-time health snapshots.</CardDescription>
                            <div className="absolute top-8 right-8">
                                <Badge className="bg-rose-50 text-rose-500 border-none font-black text-[10px] tracking-widest uppercase py-1 px-4">Private Vault</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <form onSubmit={handleUpdateVitals} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rose-100 transition-colors">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pressure</Label>
                                        <Input className="border-none bg-transparent h-8 text-lg font-black text-slate-700 p-0 focus-visible:ring-0" placeholder="120/80" value={vitals.bloodPressure} onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})} />
                                    </div>
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rose-100 transition-colors">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heart Rate</Label>
                                        <Input className="border-none bg-transparent h-8 text-lg font-black text-slate-700 p-0 focus-visible:ring-0" placeholder="72 bpm" value={vitals.heartRate} onChange={(e) => setVitals({...vitals, heartRate: e.target.value})} />
                                    </div>
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rose-100 transition-colors">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Weight</Label>
                                        <Input className="border-none bg-transparent h-8 text-lg font-black text-slate-700 p-0 focus-visible:ring-0" placeholder="70 kg" value={vitals.weight} onChange={(e) => setVitals({...vitals, weight: e.target.value})} />
                                    </div>
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rose-100 transition-colors">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Height</Label>
                                        <Input className="border-none bg-transparent h-8 text-lg font-black text-slate-700 p-0 focus-visible:ring-0" placeholder="175 cm" value={vitals.height} onChange={(e) => setVitals({...vitals, height: e.target.value})} />
                                    </div>
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rose-100 transition-colors">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Temp</Label>
                                        <Input className="border-none bg-transparent h-8 text-lg font-black text-slate-700 p-0 focus-visible:ring-0" placeholder="98.6 F" value={vitals.temperature} onChange={(e) => setVitals({...vitals, temperature: e.target.value})} />
                                    </div>
                                </div>
 
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-rose-50/30 p-6 rounded-3xl border border-rose-50">
                                    <div className="flex items-center gap-4 text-rose-500">
                                        <Activity className="h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Last Transmission</p>
                                            <p className="text-sm font-bold">
                                                {vitals.lastUpdated > 0 ? new Date(vitals.lastUpdated * 1000).toLocaleString() : "First transmission pending"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={updatingVitals} className="w-full md:w-auto px-8 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 font-bold transition-all shadow-lg shadow-rose-100">
                                        {updatingVitals ? "Broadcasting..." : "Sync Biometrics to Chain"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
 
                {/* RIGHT COLUMN: Emergency Protocol */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Add Nominee card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-amber-100/50 bg-white overflow-hidden group">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-500 transition-colors duration-500">
                                    <Plus className="h-6 w-6 text-amber-600 group-hover:text-white" />
                                </div>
                                <ShieldCheck className="h-5 w-5 text-amber-100" />
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-800">Assign Guardian</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Nominate emergency data custodians.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <form onSubmit={handleAddNominee} className="grid gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-amber-500 ml-1">Guardian Name</Label>
                                    <Input 
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-bold text-slate-700"
                                        placeholder="Full Name" 
                                        value={newNominee.name}
                                        onChange={(e) => setNewNominee({...newNominee, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-amber-500 ml-1">Guardian Wallet</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            className="h-12 pl-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white font-mono text-[10px] text-slate-600"
                                            placeholder="0x..." 
                                            value={newNominee.walletAddress}
                                            onChange={(e) => setNewNominee({...newNominee, walletAddress: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-amber-500 ml-1">Kinship</Label>
                                        <Input 
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                                            placeholder="Relation" 
                                            value={newNominee.relationship}
                                            onChange={(e) => setNewNominee({...newNominee, relationship: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-amber-500 ml-1">Frequency</Label>
                                        <Input 
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                                            placeholder="Contact" 
                                            value={newNominee.contactNumber}
                                            onChange={(e) => setNewNominee({...newNominee, contactNumber: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={addingNominee} className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 mt-2 font-black shadow-lg shadow-amber-50 transition-all active:scale-95">
                                     {addingNominee ? "Deploying..." : "Authorize Guardian Access"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
 
                    {/* Nominee List card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                                Active Guardians
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            {nominees.length === 0 ? (
                                <div className="text-center py-12 space-y-3 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <Stethoscope className="h-10 w-10 text-slate-200 mx-auto" />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Guardians Designated</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {nominees.map((nominee, idx) => (
                                        <div key={idx} className="group relative bg-slate-50 hover:bg-indigo-50/50 p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-lg font-black text-slate-800">{nominee.name}</p>
                                                    <Badge className="bg-indigo-100 text-indigo-600 border-none font-black text-[9px] px-2 py-0 h-5 mt-1">{nominee.relationship}</Badge>
                                                </div>
                                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-50">
                                                    <Wallet className="h-3 w-3" />
                                                    <span className="truncate">{nominee.walletAddress}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 px-3">
                                                    <Phone className="h-3 w-3" /> {nominee.contactNumber}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
