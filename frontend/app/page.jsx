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
import { Activity, Briefcase, Building2, Heart, Shield, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";

export default function HomePage() {
    const { connect, isConnected, account, patientContract, doctorContract, marketplaceContract, hospitalContract, insuranceContract, loading: web3Loading, error: web3Error } = useWeb3();
    const router = useRouter();
    const [userType, setUserType] = useState("patient");
    const [isRouting, setIsRouting] = useState(false);
    const [localError, setLocalError] = useState("");

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
                if (!doctorContract) throw new Error("Doctor contract not loaded. Please wait.");
                const exists = await doctorContract.doctorExists(account);
                router.push(exists ? "/doctor/dashboard" : "/doctor/signup");
            } else if (userType === "company") {
                if (!marketplaceContract) throw new Error("Marketplace contract not loaded. Please wait.");
                const exists = await marketplaceContract.isCompany(account);
                router.push(exists ? "/company/dashboard" : "/company/signup");
            } else if (userType === "hospital") {
                if (!hospitalContract) throw new Error("Hospital contract not loaded. Please wait.");
                const id = await hospitalContract.walletToHospitalId(account);
                const exists = id.toString() !== "0";
                router.push(exists ? "/hospital/dashboard" : "/hospital/signup");
            } else if (userType === "insurance") {
                if (!insuranceContract) throw new Error("Insurance contract not loaded. Please wait.");
                const exists = await insuranceContract.isInsuranceProvider(account);
                router.push(exists ? "/insurance/dashboard" : "/insurance/signup");
            } else {
                if (!patientContract) throw new Error("Patient contract not loaded. Please wait.");
                const exists = await patientContract.userExists(account);
                router.push(exists ? "/patient/dashboard" : "/patient/signup");
            }
        } catch (err) {
            console.error("Routing error:", err);
            setLocalError(err.message);
            setIsRouting(false);
        }
    };

    // Auto-route only if we haven't tried yet and logic seems ready
    // Note: We might want connected users to ALWAYS manually click 'Enter' to confirm role selection? 
    // IF we auto-route, they can't switch tabs easily if they have dual roles.
    // Let's DISABLE auto-routing on load for better UX, requiring a click.
    // Exception: If they just connected via the button, we want to route.

    useEffect(() => {
        // If we just connected and user clicked 'Connect', `handleConnect` will trigger routing.
        // We can leave this empty or use it to clear errors on account switch.
    }, [account]);

    const handleConnect = async () => {
        setLocalError("");
        if (!isConnected) {
            await connect();
            // After this, we can't immediately route because state won't update in this closure.
            // We need an effect or a check.
            // Actually, `connect()` updates `isConnected` but `account` might take a tick.
            // Let's rely on the button being clicked AGAIN or use a flag "pendingRoute"?
            // Better: If they click "Connect", we await it. If successful, we try routing effectively?
            // Since `connect` is async, we can try `routeUser` if we assume state updates or can access provider directly.
            // But state-based `account` might be stale here.
            
            // ALTERNATIVE: Use a simple flag 'shouldRoute'
        } else {
            // Already connected, just route
            routeUser();
        }
    };

    // Auto-route on 'connect' completion is tricky without refs or extra state.
    // Let's settle for:
    // 1. If not connected -> Click Connect -> (User approves) -> 'Connected' shows on button -> User clicks 'Enter'.
    // 2. If connected -> Click 'Enter' -> Routes.
    // This is most stable.
    
    // To make it smoother (1-click), we can watch `isConnected` transition:
    useEffect(() => {
        if(isConnected && !isRouting && account) {
             // We could auto-route here, but as discussed, might be annoying if wrong tab.
             // Let's require 1 click.
        }
    }, [isConnected, account]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-8 w-8 text-[#703FA1]" />
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-600">
                                MediSecure
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                <Shield className="h-4 w-4" />
                                <span>Blockchain Secured</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                        Your Health Data. <span className="text-[#703FA1]">Your Control.</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        The first decentralized platform for secure medical records, instant doctor access, and ethical data monetization.
                    </p>
                </div>

                {/* Authentication Card */}
                <Card className="max-w-xl w-full mx-auto shadow-xl border-t-4 border-[#703FA1]">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">Choose Your Role</CardTitle>
                        <CardDescription>
                            Connect your wallet to enter the secure portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Tabs value={userType} onValueChange={setUserType} className="space-y-6">
                            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 rounded-lg gap-1">
                                <TabsTrigger value="patient" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Heart className={`h-5 w-5 ${userType==='patient'?'text-red-500':'text-gray-500'}`} />
                                        <span>Patient</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="doctor" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Stethoscope className={`h-5 w-5 ${userType==='doctor'?'text-blue-500':'text-gray-500'}`} />
                                        <span>Doctor</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="company" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Briefcase className={`h-5 w-5 ${userType==='company'?'text-amber-600':'text-gray-500'}`} />
                                        <span>Company</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="hospital" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Building2 className={`h-5 w-5 ${userType==='hospital'?'text-emerald-600':'text-gray-500'}`} />
                                        <span>Hospital</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="insurance" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Shield className={`h-5 w-5 ${userType==='insurance'?'text-blue-600':'text-gray-500'}`} />
                                        <span>Insurance</span>
                                    </div>
                                </TabsTrigger>
                            </TabsList>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-600 text-center min-h-[60px] flex items-center justify-center">
                                    {userType === 'patient' && "Manage your records, control access, and earn from your data."}
                                    {userType === 'doctor' && "View patient history, request access, and provide better care."}
                                    {userType === 'company' && "Purchase ethical, consented medical datasets for research."}
                                    {userType === 'hospital' && "Manage verification, staff duty, and emergency protocols."}
                                    {userType === 'insurance' && "Provide premiums and handle claims using ZK-Proofs."}
                                </div>

                                {localError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                        {localError}
                                    </div>
                                )}
                                
                                <Button
                                    onClick={handleConnect}
                                    disabled={web3Loading}
                                    size="lg"
                                    className="w-full bg-[#703FA1] hover:bg-[#5a2f81] text-lg py-6 shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
                                >
                                    {web3Loading ? "Connecting..." : (isConnected && account
                                        ? `Enter as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
                                        : "Connect Wallet")}
                                </Button>
                                {isConnected && (
                                    <p className="text-xs text-center text-gray-400 font-mono">
                                        Connected: {account}
                                    </p>
                                )}
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
                
                {/* Footer Badges */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center opacity-70">
                    <div className="flex flex-col items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-500" />
                        <span className="font-semibold text-gray-800">100% Uptime</span>
                        <span className="text-xs text-gray-500">Decentralized IPFS Storage</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Shield className="h-6 w-6 text-green-500" />
                        <span className="font-semibold text-gray-800">On-Chain Audit</span>
                        <span className="text-xs text-gray-500">Every view is immutably logged</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                         <Building2 className="h-6 w-6 text-purple-500" />
                        <span className="font-semibold text-gray-800">Ethical Data</span>
                        <span className="text-xs text-gray-500">Patient-owned data economy</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
