"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Briefcase, Building2, Heart, Shield, Stethoscope, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const { 
        connect, 
        connectWithGoogle, 
        disconnect, 
        isConnected, 
        account, 
        patientContract, 
        doctorContract, 
        marketplaceContract, 
        hospitalContract, 
        insuranceContract, 
        loading: web3Loading, 
        error: web3Error, 
        custodianUser, 
        userType, 
        setUserType 
    } = useWeb3();
    
    const router = useRouter();
    const [isRouting, setIsRouting] = useState(false);
    const [localError, setLocalError] = useState("");
    const [loginMethod, setLoginMethod] = useState("wallet"); // 'wallet' or 'google'

    useEffect(() => {
        if (web3Error) {
            setLocalError(web3Error);
        }
    }, [web3Error]);

    const routeUser = async () => {
        if (!account) return;
        setIsRouting(true);
        try {
            if (userType === "doctor") {
                if (!doctorContract) throw new Error("Doctor contract not loaded.");
                const exists = await doctorContract.doctorExists(account);
                router.push(exists ? "/doctor/dashboard" : "/doctor/signup");
            } else if (userType === "company") {
                if (!marketplaceContract) throw new Error("Marketplace contract not loaded.");
                const company = await marketplaceContract.companies(account);
                router.push(company.isRegistered ? "/company/dashboard" : "/company/signup");
            } else if (userType === "hospital") {
                if (!hospitalContract) throw new Error("Hospital contract not loaded.");
                const id = await hospitalContract.walletToHospitalId(account);
                router.push(id.toString() !== "0" ? "/hospital/dashboard" : "/hospital/signup");
            } else if (userType === "insurance") {
                if (!insuranceContract) throw new Error("Insurance contract not loaded.");
                const provider = await insuranceContract.insuranceProviders(account);
                router.push(Number(provider.status) === 1 ? "/insurance/dashboard" : "/insurance/signup");
            } else {
                if (!patientContract) throw new Error("Patient contract not loaded.");
                const exists = await patientContract.userExists(account);
                router.push(exists ? "/patient/dashboard" : "/patient/signup");
            }
        } catch (err) {
            console.error("Routing error:", err);
            setLocalError(err.message);
            setIsRouting(false);
        }
    };

    const handleConnect = async () => {
        setLocalError("");
        if (loginMethod === "wallet") {
            await connect();
        } else {
            await connectWithGoogle();
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pt-32 pb-20 p-6 relative overflow-hidden font-outfit">
             {/* Ambient Background */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-[120px]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full relative z-10"
            >
                <Card className="bg-white border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <CardHeader className="text-center pt-12 pb-6">
                        <CardTitle className="text-3xl font-black text-slate-900 tracking-tight italic">Connect Identity</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-2">Choose your entry point into the MediSecure ecosystem.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-10 pb-12 space-y-8">
                        {/* Method Selection */}
                        <div className="flex gap-4 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <Button
                                variant="ghost"
                                onClick={() => setLoginMethod("wallet")}
                                className={`flex-1 rounded-xl font-bold transition-all h-12 ${loginMethod === "wallet" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                            >
                                <Wallet className="h-4 w-4 mr-2" />
                                Web3 Wallet
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setLoginMethod("google")}
                                className={`flex-1 rounded-xl font-bold transition-all h-12 ${loginMethod === "google" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                            >
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google Auth
                            </Button>
                        </div>

                        <AnimatePresence mode="wait">
                            {loginMethod === "google" && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-600 font-bold"
                                >
                                    <p className="uppercase tracking-widest mb-1">Custodian Protocol</p>
                                    <p className="opacity-70 leading-relaxed">Managed wallet security via Firebase. Seamless Web2 to Web3 bridge.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Tabs value={userType} onValueChange={setUserType} className="space-y-6">
                            <TabsList className="grid w-full grid-cols-5 h-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                {[
                                    { id: 'patient', icon: Heart, color: 'text-red-500' },
                                    { id: 'doctor', icon: Stethoscope, color: 'text-blue-500' },
                                    { id: 'company', icon: Briefcase, color: 'text-amber-500' },
                                    { id: 'hospital', icon: Building2, color: 'text-emerald-500' },
                                    { id: 'insurance', icon: Shield, color: 'text-indigo-500' }
                                ].map(role => (
                                    <TabsTrigger key={role.id} value={role.id} className="py-3 data-[state=active]:bg-white transition-all rounded-xl group shadow-none data-[state=active]:shadow-sm">
                                        <role.icon className={`h-5 w-5 ${userType === role.id ? role.color : 'text-slate-300 group-hover:text-slate-400'} transition-colors`} />
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-center min-h-[80px] flex items-center justify-center">
                                <p className="text-xs font-bold text-slate-500 italic uppercase tracking-widest">
                                    {userType === 'patient' && "Control medical records and monetize data."}
                                    {userType === 'doctor' && "Access patient history and provide care."}
                                    {userType === 'company' && "Purchase ethical datasets for research."}
                                    {userType === 'hospital' && "Manage verifications and protocols."}
                                    {userType === 'insurance' && "Handle claims via Zero-Knowledge proofs."}
                                </p>
                            </div>

                            {localError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-red-100">
                                    {localError}
                                </div>
                            )}

                            {isConnected || custodianUser ? (
                                <div className="space-y-4">
                                    <Button
                                        onClick={routeUser}
                                        disabled={isRouting}
                                        className="w-full h-16 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
                                    >
                                        {isRouting ? "LOADING..." : "ENTER PORTAL"}
                                    </Button>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-mono mb-4 truncate px-4">
                                            {account || custodianUser?.email}
                                        </p>
                                        <Button
                                            onClick={disconnect}
                                            variant="ghost"
                                            className="text-slate-500 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest"
                                        >
                                            Switch Account
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleConnect}
                                    disabled={web3Loading}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
                                >
                                    {web3Loading ? "CONNECTING..." : (loginMethod === "wallet" ? "CONNECT WALLET" : "SIGN IN WITH GOOGLE")}
                                </Button>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="mt-12 grid grid-cols-3 gap-8 text-center px-6">
                    {[
                        { icon: Activity, label: "99% Uptime", sub: "IPFS Node" },
                        { icon: Shield, label: "On-Chain", sub: "Audit Trails" },
                        { icon: Building2, label: "Ethical", sub: "Data Econ" }
                    ].map((feat, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <feat.icon className="h-5 w-5 text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{feat.label}</p>
                            <p className="text-[8px] font-bold text-slate-300 uppercase">{feat.sub}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
