"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { motion } from "framer-motion";
import { Heart, Mail, User, Fingerprint, CalendarDays, Droplets, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPatient() {
  const { patientContract, account, custodianUser } = useWeb3();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [loading, setLoading] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  useEffect(() => {
    if (custodianUser) {
        if (custodianUser.displayName && !name) setName(custodianUser.displayName);
        if (custodianUser.email && !email) setEmail(custodianUser.email);
    }
  }, [custodianUser]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (patientContract && account) {
        try {
          const registered = await patientContract.isRegistered(account);
          if (registered) {
            router.push("/patient/dashboard");
          }
        } catch (e) {
          console.error("Error checking registration status:", e);
        }
      }
    };
    checkRegistration();
  }, [patientContract, account, router]);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!patientContract) {
      toast.error("Contract not connected. Please check your network.");
      return;
    }
    
    // Validations
    if (!username || !name || !email || !age || !bloodGroup) {
      toast.error("All fields are required.");
      return;
    }

    if (!validateEmail(email)) {
        toast.error("Please enter a valid email address.");
        return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        toast.error("Please enter a valid age (0-120).");
        return;
    }

    try {
      setLoading(true);

      // 1. Check if already registered (Pre-flight)
      const alreadyRegistered = await patientContract.isRegistered(account);
      if (alreadyRegistered) {
        toast.error("This wallet is already registered. Redirecting...");
        setTimeout(() => router.push("/patient/dashboard"), 2000);
        return;
      }

      // 2. Check if username taken (Pre-flight)
      const existingId = await patientContract.usernameToPatientId(username);
      if (existingId && existingId.toString() !== "0") {
        toast.error("Username is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      // 3. Register Patient
      const tx = await patientContract.registerPatient(username, name, email, ageNum, bloodGroup);
      
      toast.promise(tx.wait(), {
        loading: 'Minting your medical identity...',
        success: 'Welcome to the network!',
        error: 'Transaction failed.',
      });

      await tx.wait();
      router.push("/patient/dashboard");

    } catch (error) {
      console.error("Signup error:", error);
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
                            <Heart className="h-10 w-10 text-white" />
                        </div>
                    </motion.div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight italic">Patient Registry</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-2">Initialize your secure medical vault on the blockchain.</CardDescription>
                </CardHeader>
                
                <CardContent className="px-10 pb-12">
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Fingerprint className="h-3 w-3" /> Digital ID
                                </Label>
                                <Input
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3" /> Full Name
                                </Label>
                                <Input
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Communication
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays className="h-3 w-3" /> Age
                                </Label>
                                <Input
                                    placeholder="Age"
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Droplets className="h-3 w-3" /> Blood Group
                                </Label>
                                <select
                                    value={bloodGroup}
                                    onChange={(e) => setBloodGroup(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Select Blood Group</option>
                                    {bloodGroups.map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Your data is protected by <span className="text-blue-600 font-bold">End-to-End Encryption</span>. 
                                Only authorized doctors can access your records with your explicit consent.
                            </p>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl font-black text-white text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
                        >
                            {loading ? "INITIALIZING..." : "COMPLETE REGISTRATION"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
}
