"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ethers } from "ethers"
import { ShoppingCart, Upload, Database, Briefcase, Zap, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"
import { motion, AnimatePresence } from "framer-motion"

export default function PatientMarketplace() {
    const { marketplaceContract, patientContract, account, signSellData } = useWeb3()
    const [offers, setOffers] = useState([])
    const [myRecords, setMyRecords] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingOffers, setLoadingOffers] = useState(true)
    const [selectedOffer, setSelectedOffer] = useState(null)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [status, setStatus] = useState("")

    useEffect(() => {
        if(marketplaceContract && patientContract && account) {
            loadMarketplace();
        }
    }, [marketplaceContract, patientContract, account])

    const loadMarketplace = async () => {
        setLoadingOffers(true);
        try {
            const allOffers = await marketplaceContract.getAllOffers();
            const active = allOffers.filter(o => o.isActive && BigInt(o.budget) >= BigInt(o.price));
            setOffers(active);

            const patientId = await patientContract.walletToPatientId(account);
            if (patientId > 0) {
                const records = await patientContract.getMedicalRecords(patientId);
                setMyRecords(records.map(r => ({
                    ipfsHash: r.ipfsHash || r[1], 
                    fileName: r.fileName || r[2],
                    date: r.recordDate || r[3]
                })));
            }
        } catch(e) { 
            console.error("Marketplace Load Error:", e);
            toast.error("Failed to load marketplace offers");
        } finally {
            setLoadingOffers(false);
        }
    }

    const handleSell = async () => {
        if(!selectedOffer || !selectedRecord) return;
        setLoading(true);
        setStatus("Processing Transaction...");
        
        const sellPromise = new Promise(async (resolve, reject) => {
            try {
                const tx = await marketplaceContract.sellData(selectedOffer.id, selectedRecord.ipfsHash);
                setStatus("Sent to Network...");
                await tx.wait();
                resolve();
                loadMarketplace();
                setSelectedOffer(null);
            } catch(e) {
                reject(e);
            } finally {
                setLoading(false);
            }
        });

        toast.promise(sellPromise, {
            loading: 'Confirming Sale...',
            success: 'Sold Successfully!',
            error: (err) => `Failed: ${err.message}`
        });
    }

    const handleSellGasless = async () => {
        if(!selectedOffer || !selectedRecord) return;
        setLoading(true);
        setStatus("Signing Data Wallet...");

        const sellPromise = new Promise(async (resolve, reject) => {
            try {
                const signature = await signSellData(selectedOffer.id, selectedRecord.ipfsHash);
                setStatus("Relaying Signature...");

                const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"
                const response = await fetch(`${baseUrl}/api/v1/marketplace/sell/gasless`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        offerId: selectedOffer.id.toString(),
                        ipfsHash: selectedRecord.ipfsHash,
                        patientAddress: account,
                        signature
                    })
                });

                const responseJson = await response.json();
                if (!response.ok) throw new Error(responseJson.error || "Relay failure");

                const data = responseJson.data || responseJson;

                resolve(data);
                loadMarketplace();
                setSelectedOffer(null);
            } catch (e) {
                reject(e);
            } finally {
                setLoading(false);
            }
        });

        toast.promise(sellPromise, {
            loading: 'Gasless Signing...',
            success: 'Gasless Sale Relayed!',
            error: (err) => `Failed: ${err.message}`
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Data Marketplace</h2>
                    <p className="text-slate-500 font-medium mt-1">Monetize your medical insights securely via MediSecure Protocol.</p>
                </div>
                <div className="flex items-center gap-3 glass px-6 py-3 rounded-2xl border-indigo-100">
                    <div className="p-2 bg-indigo-100 rounded-xl"><Database className="text-indigo-600 h-5 w-5" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400">Inventory</p>
                        <p className="text-lg font-black text-indigo-900">{myRecords.length} Records</p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loadingOffers ? (
                        [1,2,3].map(i => (
                            <div key={i} className="card-premium bg-white p-6 space-y-4">
                                <Skeleton className="h-8 w-3/4 rounded-xl" />
                                <Skeleton className="h-4 w-1/2 rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-2xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ))
                    ) : offers.length === 0 ? (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-400 col-span-full text-center py-20 italic font-medium"
                        >
                            The marketplace is currently waiting for new research offers.
                        </motion.p>
                    ) : (
                        offers.map((offer, idx) => (
                            <motion.div
                                key={offer.id.toString()}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="card-premium h-full bg-white group hover:border-indigo-200 border-none transition-all">
                                    <CardHeader className="pb-4 relative overflow-hidden rounded-t-[2rem]">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors"></div>
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-600 transition-colors">
                                                <Briefcase className="h-6 w-6 text-slate-400 group-hover:text-white" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900">{ethers.formatEther(offer.price)}</p>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">ETH Reward</p>
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-black mt-6 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {offer.title}
                                        </CardTitle>
                                        <p className="text-xs text-slate-400 font-mono mt-1">
                                            Entity: {offer.company.slice(0,6)}...{offer.company.slice(-4)}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2 h-10">
                                            {offer.description}
                                        </p>
                                        
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-7 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center gap-2 group-hover:bg-indigo-600 group-hover:shadow-indigo-100"
                                                    onClick={() => setSelectedOffer(offer)}
                                                >
                                                    <ShoppingCart size={18} />
                                                    Participate in Study
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2.5rem] border-none shadow-3xl max-w-lg p-0 overflow-hidden">
                                                <div className="bg-indigo-600 p-8 text-white relative">
                                                    <div className="absolute top-0 right-0 p-8 opacity-10"><Database size={80}/></div>
                                                    <h3 className="text-2xl font-black tracking-tight relative z-10">Select Contribution</h3>
                                                    <p className="text-indigo-100 text-sm font-medium mt-1 relative z-10">Earn {ethers.formatEther(offer.price)} ETH for sharing select records.</p>
                                                </div>
                                                
                                                <div className="p-8 space-y-6">
                                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                                        {myRecords.map((rec, i) => (
                                                            <motion.div 
                                                                key={i} 
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => setSelectedRecord(rec)}
                                                                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedRecord?.ipfsHash === rec.ipfsHash ? 'bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-50' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                                                            >
                                                                <div>
                                                                    <p className="font-black text-slate-800 tracking-tight">{rec.fileName}</p>
                                                                    <p className="text-xs text-slate-400 font-bold">{rec.date}</p>
                                                                </div>
                                                                {selectedRecord?.ipfsHash === rec.ipfsHash ? (
                                                                    <div className="bg-indigo-600 p-2 rounded-xl text-white"><ShieldCheck size={18} /></div>
                                                                ) : (
                                                                    <Upload className="text-slate-300" size={18} />
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>

                                                    <AnimatePresence mode="wait">
                                                        {loading ? (
                                                            <motion.div 
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="text-center py-4 bg-slate-50 rounded-3xl border border-slate-100"
                                                            >
                                                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{status}</p>
                                                            </motion.div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                <Button 
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-2xl shadow-lg shadow-indigo-100 flex flex-col items-center gap-1 group"
                                                                    disabled={!selectedRecord}
                                                                    onClick={handleSellGasless}
                                                                >
                                                                    <Zap size={18} className="text-indigo-200 group-hover:animate-pulse" />
                                                                    <span className="text-xs">Gasless Sale</span>
                                                                </Button>
                                                                <Button 
                                                                    variant="outline"
                                                                    className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black py-8 rounded-2xl flex flex-col items-center gap-1"
                                                                    disabled={!selectedRecord}
                                                                    onClick={handleSell}
                                                                >
                                                                    <ShieldCheck size={18} />
                                                                    <span className="text-xs">Standard Sale</span>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
                                                    
                                                    <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">
                                                        Verified by Multi-Sig Network
                                                    </p>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </AnimatePresence>
        </motion.div>
    )
}
