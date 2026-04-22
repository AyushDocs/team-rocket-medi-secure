"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Stethoscope, Briefcase, Building2, Shield } from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";

export default function Auth() {
    const [walletAddress, setWalletAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [patientIds, setPatientIds] = useState<[] | null>(null);
    const { userType, setUserType } = useWeb3();
    const router = useRouter();

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:5000/wallet/${walletAddress}/patients`);

            if (!response.ok) {
                throw new Error("Failed to fetch patient IDs");
            }

            const data = await response.json(); // <-- Parse JSON
            const ids = data.patientIds.length > 0 ? data.patientIds : null;
            setPatientIds(ids);

            console.log("Patient IDs:", ids);

            if (!ids) {
                alert("No account found for this role. Redirecting to signup.");
                router.push(`/${userType}/signup`);
            } else {
                // User exists, redirect to dashboard
                router.push(`/${userType}/dashboard`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
                <p className="text-gray-600 text-center mb-6">
                    Enter your wallet address to access your dashboard
                </p>

                {error && (
                    <p className="text-red-500 text-center mb-4">{error}</p>
                )}

                <Tabs value={userType} onValueChange={setUserType} className="mb-6">
                    <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 rounded-lg gap-1">
                        <TabsTrigger value="patient" className="py-2 flex flex-col items-center gap-1 data-[state=active]:bg-white">
                            <Heart className={`h-4 w-4 ${userType==='patient'?'text-red-500':'text-gray-500'}`} />
                            <span className="text-[10px]">Patient</span>
                        </TabsTrigger>
                        <TabsTrigger value="doctor" className="py-2 flex flex-col items-center gap-1 data-[state=active]:bg-white">
                            <Stethoscope className={`h-4 w-4 ${userType==='doctor'?'text-blue-500':'text-gray-500'}`} />
                            <span className="text-[10px]">Doctor</span>
                        </TabsTrigger>
                        <TabsTrigger value="company" className="py-2 flex flex-col items-center gap-1 data-[state=active]:bg-white">
                            <Briefcase className={`h-4 w-4 ${userType==='company'?'text-amber-600':'text-gray-500'}`} />
                            <span className="text-[10px]">Company</span>
                        </TabsTrigger>
                        <TabsTrigger value="hospital" className="py-2 flex flex-col items-center gap-1 data-[state=active]:bg-white">
                            <Building2 className={`h-4 w-4 ${userType==='hospital'?'text-emerald-600':'text-gray-500'}`} />
                            <span className="text-[10px]">Hospital</span>
                        </TabsTrigger>
                        <TabsTrigger value="insurance" className="py-2 flex flex-col items-center gap-1 data-[state=active]:bg-white">
                            <Shield className={`h-4 w-4 ${userType==='insurance'?'text-blue-600':'text-gray-500'}`} />
                            <span className="text-[10px]">Insurance</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <input
                    type="text"
                    placeholder="Wallet Address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
                />

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg disabled:bg-gray-400"
                >
                    {isLoading ? "Logging in..." : "Login"}
                </button>

                {patientIds && (
                    <p className="mt-4 text-green-600 text-center">
                        Patient IDs found: {patientIds.join(", ")}
                    </p>
                )}
            </div>
        </div>
    );
}
