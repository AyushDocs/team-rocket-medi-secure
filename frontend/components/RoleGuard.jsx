"use client";

import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/context/Web3Context";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoleGuard({ children, role }) {
    const { 
        isConnected, 
        account, 
        patientContract, 
        doctorContract, 
        marketplaceContract, 
        hospitalContract, 
        insuranceContract, 
        loading: web3Loading 
    } = useWeb3();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkRole = async () => {
            // Wait for Web3 to initialize
            if (web3Loading) return;

            // 1. Basic Connection Check
            if (!isConnected || !account) {
                setChecking(false);
                setIsAuthorized(false);
                return;
            }

            try {
                setChecking(true);
                let exists = false;
                
                // 2. Role-Specific Contract Check
                if (role === "patient") {
                    if (!patientContract) return;
                    exists = await patientContract.userExists(account);
                } else if (role === "doctor") {
                    if (!doctorContract) return;
                    exists = await doctorContract.doctorExists(account);
                } else if (role === "company") {
                    if (!marketplaceContract) return;
                    exists = await marketplaceContract.isCompany(account);
                } else if (role === "hospital") {
                    if (!hospitalContract) return;
                    const id = await hospitalContract.walletToHospitalId(account);
                    exists = id.toString() !== "0";
                } else if (role === "insurance") {
                    if (!insuranceContract) return;
                    exists = await insuranceContract.isInsuranceProvider(account);
                }

                if (!exists) {
                    setIsAuthorized(false);
                    // Redirect after a short delay so user sees they are unauthorized
                    setTimeout(() => {
                        router.push(`/${role}/signup`);
                    }, 2000);
                } else {
                    setIsAuthorized(true);
                }
            } catch (err) {
                console.error("Role authorization check failed:", err);
                setError("Failed to verify credentials on-chain.");
            } finally {
                setChecking(false);
            }
        };

        checkRole();
    }, [isConnected, account, web3Loading, role, router, patientContract, doctorContract, marketplaceContract, hospitalContract, insuranceContract]);

    // Loading State
    if (web3Loading || checking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <Loader2 className="h-12 w-12 text-[#703FA1] animate-spin mb-4" />
                <p className="text-gray-600 font-medium animate-pulse">Verifying Secure Access...</p>
            </div>
        );
    }

    // Unconnected State
    if (!isConnected) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="bg-red-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Authentication Required</h1>
                    <p className="text-gray-600">
                        This dashboard is protected by blockchain security. Please connect your wallet to proceed.
                    </p>
                    <Button 
                        onClick={() => router.push("/")}
                        className="bg-[#703FA1] hover:bg-[#5a2f81] w-full py-6 text-lg"
                    >
                        Go to Login Page
                    </Button>
                </div>
            </div>
        );
    }

    // Unauthorized Role State
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="bg-amber-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                        <ShieldAlert className="h-10 w-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
                    <p className="text-gray-600">
                        Your wallet is connected, but you are not registered as a <span className="font-bold capitalize">{role}</span>.
                        Redirecting you to the signup page...
                    </p>
                    <Loader2 className="h-6 w-6 text-amber-600 animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    // Success
    return children;
}
