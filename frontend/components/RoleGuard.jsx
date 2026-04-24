"use client";

import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/context/Web3Context";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function RoleGuard({ children, role }) {
    const { 
        isConnected, 
        account, 
        patientContract, 
        doctorContract, 
        marketplaceContract, 
        hospitalContract, 
        insuranceContract, 
        loading: web3Loading,
        refreshKey,
        triggerRefresh
    } = useWeb3();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState(null);
    const redirectRef = useRef(null);

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
                    if (!patientContract) {
                        return;
                    }
                    exists = await patientContract.userExists(account);
                } else if (role === "doctor") {
                    if (!doctorContract) {
                        return;
                    }
                    exists = await doctorContract.doctorExists(account);
                } else if (role === "company") {
                    if (!marketplaceContract) return;
                    const company = await marketplaceContract.companies(account);
                    exists = company.isRegistered;
                } else if (role === "hospital") {
                    if (!hospitalContract) return;
                    const id = await hospitalContract.walletToHospitalId(account);
                    exists = id.toString() !== "0";
                } else if (role === "insurance") {
                    if (!insuranceContract) return;
                    const provider = await insuranceContract.insuranceProviders(account);
                    exists = provider && Number(provider.status) === 1; // ACTIVE = 1
                }

                if (!exists) {
                    setIsAuthorized(false);
                    // Schedule redirect if not already scheduled
                    if (!redirectRef.current) {
                        console.log(`RoleGuard: Not authorized as ${role}, scheduling redirect...`);
                        redirectRef.current = setTimeout(() => {
                            router.push(`/${role}/signup`);
                        }, 2000);
                    }
                } else {
                    setIsAuthorized(true);
                    // Clear any pending redirect if we are now authorized
                    if (redirectRef.current) {
                        clearTimeout(redirectRef.current);
                        redirectRef.current = null;
                    }
                }
            } catch (err) {
                console.error("Role authorization check failed:", err);
                setError("Failed to verify credentials on-chain.");
            } finally {
                setChecking(false);
            }
        };

        checkRole();
    }, [isConnected, account, web3Loading, role, router, patientContract, doctorContract, marketplaceContract, hospitalContract, insuranceContract, refreshKey]);

    // Loading State
    if (web3Loading || checking) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-dashed border-slate-200">
                <Loader2 className="h-12 w-12 text-[#703FA1] animate-spin mb-4" />
                <p className="text-gray-600 font-bold animate-pulse tracking-tight text-center">Verifying MediSecure Access...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-red-50/30 p-8 rounded-3xl border border-red-100">
                <div className="bg-red-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Security Check Failed</h1>
                <p className="text-red-700 font-medium text-center mb-6">{error}</p>
                <Button 
                    onClick={() => {
                        setError(null);
                        triggerRefresh();
                    }} 
                    className="bg-red-600 hover:bg-red-700 w-full rounded-2xl h-12 font-black shadow-lg shadow-red-200"
                >
                    Retry Verification
                </Button>
            </div>
        );
    }

    // Unconnected State
    if (!isConnected) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-8">
                <div className="bg-red-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Authentication Required</h1>
                <p className="text-gray-500 font-medium text-center mb-6 max-w-sm">
                    This dashboard is protected by MediSecure. Please connect your wallet to proceed.
                </p>
                <Button 
                    onClick={() => router.push("/")}
                    className="bg-[#703FA1] hover:bg-[#5a2f81] w-full rounded-2xl h-14 text-lg font-black shadow-xl shadow-purple-200"
                >
                    Return to Login
                </Button>
            </div>
        );
    }

    // Unauthorized Role State
    if (!isAuthorized) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-8">
                <div className="bg-amber-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-10 w-10 text-amber-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h1>
                <p className="text-gray-500 font-medium text-center mb-6 max-w-sm">
                    Your wallet is connected, but you are not registered as a <span className="text-blue-600 font-black capitalize underline decoration-blue-200 underline-offset-4">{role}</span>.
                </p>
                <div className="flex flex-col items-center gap-4">
                    <p className="text-xs text-slate-400 font-bold animate-pulse italic">Auto-redirecting to signup...</p>
                    <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                </div>
            </div>
        );
    }

    // Success
    return children;
}
