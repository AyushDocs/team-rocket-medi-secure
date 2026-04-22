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
import { Activity, Briefcase, Building2, Heart, Shield, Stethoscope, Clock, Mail, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { Logo } from "@/components/Logo";


export default function HomePage() {
    const { connect, connectWithGoogle, disconnect, isConnected, account, patientContract, doctorContract, marketplaceContract, hospitalContract, insuranceContract, loading: web3Loading, error: web3Error, custodianUser, authMode, userType, setUserType } = useWeb3();
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
                if (!doctorContract) throw new Error("Doctor contract not loaded. Please wait.");
                const exists = await doctorContract.doctorExists(account);
                router.push(exists ? "/doctor/dashboard" : "/doctor/signup");
            } else if (userType === "company") {
                if (!marketplaceContract) throw new Error("Marketplace contract not loaded. Please wait.");
                const company = await marketplaceContract.companies(account);
                const exists = company.isRegistered;
                router.push(exists ? "/company/dashboard" : "/company/signup");
            } else if (userType === "hospital") {
                if (!hospitalContract) throw new Error("Hospital contract not loaded. Please wait.");
                const id = await hospitalContract.walletToHospitalId(account);
                const exists = id.toString() !== "0";
                router.push(exists ? "/hospital/dashboard" : "/hospital/signup");
            } else if (userType === "insurance") {
                if (!insuranceContract) throw new Error("Insurance contract not loaded. Please wait.");
                const provider = await insuranceContract.insuranceProviders(account);
                const exists = Number(provider.status) === 1; // ACTIVE = 1, based on Enum in contract
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

    const handleConnect = async () => {
        setLocalError("");
        if (loginMethod === "wallet") {
            await connect();
        } else {
            await connectWithGoogle();
        }
    };

    const handleDisconnect = () => {
        disconnect();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Logo />

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                <Shield className="h-4 w-4" />
                                <span>Blockchain Secured</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center justify-center">
                <div className="text-center mb-6 space-y-2">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Your Health Data. <span className="text-[#703FA1]">Your Control.</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        The first decentralized platform for secure medical records, instant doctor access, and ethical data monetization.
                    </p>
                </div>

                <Card className="max-w-xl w-full mx-auto shadow-lg border-t-4 border-[#703FA1]">
                    <CardHeader className="text-center pb-2 pt-4">
                        <CardTitle className="text-xl">Choose Your Role</CardTitle>
                        <CardDescription className="text-xs">
                            Connect with wallet or sign in with Google
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant={loginMethod === "wallet" ? "default" : "outline"}
                                onClick={() => setLoginMethod("wallet")}
                                className={`flex-1 ${loginMethod === "wallet" ? "bg-[#703FA1]" : ""}`}
                            >
                                <Wallet className="h-4 w-4 mr-2" />
                                Wallet
                            </Button>
                            <Button
                                variant={loginMethod === "google" ? "default" : "outline"}
                                onClick={() => setLoginMethod("google")}
                                className={`flex-1 ${loginMethod === "google" ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium" : ""}`}
                            >
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </Button>
                        </div>

                        {loginMethod === "google" && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                                <p className="font-medium">Custodian Wallet Login</p>
                                <p className="mt-1">Sign in with Google to use our managed wallet solution. Your data is secured with Firebase authentication while maintaining blockchain access.</p>
                            </div>
                        )}

                        <Tabs value={userType} onValueChange={setUserType} className="space-y-4">
                            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 rounded-lg gap-1">
                                <TabsTrigger value="patient" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Heart className={`h-4 w-4 ${userType==='patient'?'text-red-500':'text-gray-500'}`} />
                                        <span className="text-[10px] sm:text-xs">Patient</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="doctor" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Stethoscope className={`h-4 w-4 ${userType==='doctor'?'text-blue-500':'text-gray-500'}`} />
                                        <span className="text-[10px] sm:text-xs">Doctor</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="company" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Briefcase className={`h-4 w-4 ${userType==='company'?'text-amber-600':'text-gray-500'}`} />
                                        <span className="text-[10px] sm:text-xs">Company</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="hospital" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Building2 className={`h-4 w-4 ${userType==='hospital'?'text-emerald-600':'text-gray-500'}`} />
                                        <span className="text-[10px] sm:text-xs">Hospital</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="insurance" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                                    <div className="flex flex-col items-center gap-1">
                                        <Shield className={`h-4 w-4 ${userType==='insurance'?'text-blue-600':'text-gray-500'}`} />
                                        <span className="text-[10px] sm:text-xs">Insurance</span>
                                    </div>
                                </TabsTrigger>
                            </TabsList>

                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg border text-xs text-gray-600 text-center min-h-[50px] flex items-center justify-center">
                                    {userType === 'patient' && "Manage your records, control access, and earn from your data."}
                                    {userType === 'doctor' && "View patient history, request access, and provide better care."}
                                    {userType === 'company' && "Purchase ethical, consented medical datasets for research."}
                                    {userType === 'hospital' && "Manage verification, staff duty, and emergency protocols."}
                                    {userType === 'insurance' && "Provide premiums and handle claims using ZK-Proofs."}
                                </div>

                                {localError && (
                                    <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs text-center">
                                        {localError}
                                    </div>
                                )}
                                
                                {isConnected || custodianUser ? (
                                    <div className="space-y-2">
                                        <Button
                                            onClick={routeUser}
                                            disabled={isRouting}
                                            size="lg"
                                            className="w-full bg-[#703FA1] hover:bg-[#5a2f81] text-base py-4 shadow-md transition-all hover:scale-[1.02]"
                                        >
                                            {isRouting ? "Routing..." : "Continue to Dashboard"}
                                        </Button>
                                        <Button
                                            onClick={handleDisconnect}
                                            size="lg"
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleConnect}
                                        disabled={web3Loading}
                                        size="lg"
                                        className="w-full bg-[#703FA1] hover:bg-[#5a2f81] text-base py-4 shadow-md shadow-purple-200 transition-all hover:scale-[1.02]"
                                    >
                                        {web3Loading ? "Connecting..." : (loginMethod === "wallet" ? "Connect Wallet" : "Sign in with Google")}
                                    </Button>
                                )}
                                {isConnected && (
                                    <p className="text-[10px] text-center text-gray-400 font-mono">
                                        Connected: {account}
                                    </p>
                                )}
                                {custodianUser && (
                                    <p className="text-[10px] text-center text-gray-400">
                                        Signed in as: {custodianUser.email}
                                    </p>
                                )}
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center opacity-70 scale-90">
                    <div className="flex flex-col items-center gap-1">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-gray-800 text-sm">99% Uptime</span>
                        <span className="text-[10px] text-gray-500">Decentralized IPFS Storage</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Shield className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-gray-800 text-sm">On-Chain Audit</span>
                        <span className="text-[10px] text-gray-500">Every view is immutably logged</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                         <Building2 className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold text-gray-800 text-sm">Ethical Data</span>
                        <span className="text-[10px] text-gray-500">Patient-owned data economy</span>
                    </div>
                </div>
            </main>

        </div>
    );
}