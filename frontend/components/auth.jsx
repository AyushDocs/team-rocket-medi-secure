"use client";

import { useState } from "react";

export default function Auth() {
    const [walletAddress, setWalletAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [patientIds, setPatientIds] = useState<[] | null>(null);

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
                alert("No patient account found. Please create a new account.");
            } else {
                // Patient exists, you can redirect to dashboard
                // For demo, we just reload
                window.location.reload();
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
