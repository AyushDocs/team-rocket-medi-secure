"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWeb3 } from "@/context/Web3Context";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function HospitalSignup() {
    const { hospitalContract, account } = useWeb3();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        location: "",
        regNumber: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hospitalContract) return;

        setLoading(true);
        try {
            const tx = await hospitalContract.registerHospital(
                formData.name,
                formData.email,
                formData.location,
                formData.regNumber
            );
            await tx.wait();
            toast.success("Hospital registered successfully!");
            router.push("/hospital/dashboard");
        } catch (err) {
            console.error(err);
            toast.error("Registration failed: " + (err.reason || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-emerald-600">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center">
                        <Building2 className="text-emerald-600 h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">Hospital Registration</CardTitle>
                    <p className="text-gray-500 text-sm">Join the MediSecure Emergency Network</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hospital Name</label>
                            <Input 
                                required 
                                placeholder="e.g. City General Hospital" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Official Email</label>
                            <Input 
                                required 
                                type="email" 
                                placeholder="contact@hospital.com" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Location</label>
                            <Input 
                                required 
                                placeholder="City, Country" 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Registration Number</label>
                            <Input 
                                required 
                                placeholder="Licence #123456" 
                                value={formData.regNumber}
                                onChange={(e) => setFormData({...formData, regNumber: e.target.value})}
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6"
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Register Hospital"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
