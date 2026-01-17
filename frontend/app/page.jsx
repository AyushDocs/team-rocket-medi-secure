"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";

export default function HomePage() {
    const { connect, isConnected, account, patientContract, doctorContract, loading: web3Loading, error: web3Error } = useWeb3();
    const router = useRouter();
    const [userType, setUserType] = useState("patient");
    const [isRouting, setIsRouting] = useState(false);
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (web3Error) {
            setLocalError(web3Error);
        }
    }, [web3Error]);

    // Handle routing once connected
    useEffect(() => {
        const routeUser = async () => {
             if (isConnected && account && !web3Loading && !isRouting) {
                 setIsRouting(true);
                 try {
                     if (userType === "doctor") {
                         if (!doctorContract) {
                             throw new Error("Doctor contract not loaded. Check network.");
                         }
                         const exists = await doctorContract.doctorExists(account);
                         if (exists) {
                             router.push("/doctor/dashboard");
                         } else {
                             router.push("/doctor/signup");
                         }
                     } else {
                         if (!patientContract) {
                             throw new Error("Patient contract not loaded. Check network.");
                         }
                         const exists = await patientContract.userExists(account);
                         if (exists) {
                             router.push("/patient/dashboard");
                         } else {
                             router.push("/patient/signup");
                         }
                     }
                 } catch (err) {
                     console.error("Routing error:", err);
                     setLocalError(err.message);
                     setIsRouting(false);
                 }
             }
        };

        // Only run routing logic if we engaged the connect flow or are already connected
        // But we want to avoid auto-routing if user just lands on page without intent?
        // Actually, if they are already connected (metamask), auto-login is good UX.
        // But we need to know WHICH tab they prefer?
        // Default is "patient". If a doctor visits, they might get routed to patient signup if not careful.
        // Better: Only route when they click "Connect" OR if they are already connected, maybe wait for them to confirm?
        // Let's rely on explicit "Connect" button action triggering the check, OR if already connected, we check based on current tab? 
        // Logic: If connected, check BOTH. If Doctor, go Doctor. If Patient, go Patient.
        // But `userType` state defaults to Patient. 
        // Let's keep it simple: Route based on `userType` state when connected.
        // If user is Doctor but on Patient tab, they might fail UserExists and go to Patient Signup. 
        // Ideally we check both contracts to guess type, but for now stick to Tab selection.
        
        if (isConnected && !isRouting) {
            // We wait for the user to trigger connection?
            // The context might auto-connect on load.
            // If explicit action is preferred, we can use a flag.
            // But for now, let's just let the effect run.
            routeUser();
        }
    }, [isConnected, account, web3Loading, patientContract, doctorContract, userType, router]);

    const handleConnect = async () => {
        setLocalError("");
        if (!isConnected) {
            await connect();
        } 
        // The useEffect will handle routing once `isConnected` becomes true
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-2">
                            <Heart className="h-8 w-8 text-[#7eb0d5]" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                HealthShare
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Shield className="h-5 w-5 text-[#b2e061]" />
                            <span className="text-sm text-gray-600">
                                Secure & Private
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Secure Healthcare Data Exchange
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Connecting patients and healthcare providers through
                        secure, privacy-focused data sharing
                    </p>
                </div>

                {/* Authentication */}
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Access Your Account</CardTitle>
                        <CardDescription>
                            Sign in to access your secure healthcare dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={userType} onValueChange={setUserType}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="patient">
                                    Patient
                                </TabsTrigger>
                                <TabsTrigger value="doctor">Doctor</TabsTrigger>
                            </TabsList>

                            <TabsContent value="patient">
                                <div className="space-y-4">
                                    {localError && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                            {localError}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleConnect}
                                        disabled={web3Loading || isRouting}
                                        className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                                    >
                                        {web3Loading || isRouting ? "Loading..." : (isConnected || account
                                            ? `Connected: ${account?.slice(0,6)}...`
                                            : "Connect with MetaMask")}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="doctor">
                                <div className="space-y-4">
                                    {localError && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                            {localError}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleConnect}
                                        disabled={web3Loading || isRouting}
                                        className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                                    >
                                        {web3Loading || isRouting ? "Loading..." : (isConnected || account
                                            ? `Connected: ${account?.slice(0,6)}...`
                                            : "Connect with MetaMask")}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
