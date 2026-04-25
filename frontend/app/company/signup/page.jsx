"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useWeb3 } from "../../../context/Web3Context"
import { motion } from "framer-motion"
import { Building2, Mail, Briefcase, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
 
export default function CompanySignup() {
  const { marketplaceContract, account } = useWeb3()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })
  const [loading, setLoading] = useState(false)
 
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!marketplaceContract || !account) {
        toast.error("Wallet not connected or contract not loaded.")
        return
    }
 
    if (!validateEmail(formData.email)) {
        toast.error("Please enter a valid official email.")
        return
    }
 
    setLoading(true)
 
    try {
      const tx = await marketplaceContract.registerCompany(formData.name, formData.email)
      
      toast.promise(tx.wait(), {
        loading: 'Registering company on-chain...',
        success: 'Welcome to the Research Network!',
        error: 'Registration failed.',
      });
 
      await tx.wait()
      router.push("/company/dashboard")
    } catch (err) {
      console.error(err)
      toast.error(err.reason || "Registration failed.")
    } finally {
      setLoading(false)
    }
  }
 
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
                            <Briefcase className="h-10 w-10 text-white" />
                        </div>
                    </motion.div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight italic">Company Registry</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-2">Access ethical medical datasets for research and development.</CardDescription>
                </CardHeader>
                
                <CardContent className="px-10 pb-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Organization Name
                            </Label>
                            <Input
                                placeholder="e.g. Acme Biotech Inc."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                required
                            />
                        </div>
 
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Official Email
                            </Label>
                            <Input
                                placeholder="contact@company.com"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14"
                                required
                            />
                        </div>
 
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Companies are subject to <span className="text-blue-600 font-bold">Strict Ethical Data Protocols</span>. 
                                Any violation of patient privacy will lead to permanent revocation of access.
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
  )
}
