"use client";
 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { motion } from "framer-motion";
import { Stethoscope, Mail, User, Award, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
 
export default function SignupDoctor() {
  const { doctorContract, account, custodianUser } = useWeb3();
  const router = useRouter();
 
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (custodianUser) {
        if (custodianUser.displayName && !name) setName(custodianUser.displayName);
        if (custodianUser.email && !email) setEmail(custodianUser.email);
    }
  }, [custodianUser]);
 
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };
 
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!doctorContract) {
      toast.error("Contract not connected. Please check your network.");
      return;
    }
    
    if (!name || !specialization || !email) {
      toast.error("All fields are required.");
      return;
    }
 
    if (!validateEmail(email)) {
        toast.error("Please enter a valid email address.");
        return;
    }
 
    try {
      setLoading(true);
 
      const tx = await doctorContract.registerDoctor(name, specialization, email);
      
      toast.promise(tx.wait(), {
        loading: 'Registering your medical license on-chain...',
        success: 'Doctor registered successfully!',
        error: 'Registration failed.',
      });
 
      await tx.wait();
      router.push("/doctor/dashboard");
 
    } catch (error) {
      console.error(error);
      toast.error(error.reason || "An error occurred during registration.");
    } finally {
        setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-outfit">
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-[120px]"></div>
        </div>
 
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full relative z-10"
        >
            <Card className="bg-white border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden border">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardHeader className="text-center pt-12 pb-6">
                    <motion.div 
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-2xl shadow-blue-500/20 ring-4 ring-slate-50">
                            <Stethoscope className="h-10 w-10 text-white" />
                        </div>
                    </motion.div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight italic">Doctor Registry</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-2">Join the network of verified medical professionals.</CardDescription>
                </CardHeader>
                
                <CardContent className="px-10 pb-12">
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="h-3 w-3" /> Professional Name
                            </Label>
                            <Input
                                placeholder="e.g. Dr. Jane Smith"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                required
                            />
                        </div>
 
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Award className="h-3 w-3" /> Specialization
                            </Label>
                            <Input
                                placeholder="e.g. Cardiology"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                required
                            />
                        </div>
 
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Contact Email
                            </Label>
                            <Input
                                placeholder="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                required
                            />
                        </div>
 
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Your professional credentials will be verified by the <span className="text-blue-600 font-bold">MediSecure Governance Board</span>. 
                                Once verified, you will be able to issue medical records and access patient history.
                            </p>
                        </div>
 
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl font-black text-white text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
                        >
                            {loading ? "REGISTERING..." : "COMPLETE REGISTRATION"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
}