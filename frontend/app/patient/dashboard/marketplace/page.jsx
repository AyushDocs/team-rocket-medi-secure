"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ethers } from "ethers"
import { ShoppingCart, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { useWeb3 } from "../../../../context/Web3Context"

export default function PatientMarketplace() {
    const { marketplaceContract, patientContract, account } = useWeb3()
    const [offers, setOffers] = useState([])
    const [myRecords, setMyRecords] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedOffer, setSelectedOffer] = useState(null)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [status, setStatus] = useState("")

    useEffect(() => {
        if(marketplaceContract && patientContract && account) {
            loadMarketplace();
        }
    }, [marketplaceContract, patientContract, account])

    const loadMarketplace = async () => {
        try {
            // 1. Fetch Active Offers
            const allOffers = await marketplaceContract.getAllOffers();
            // Filter only active offers (budget > price)
            // Note: Struct field is 'price', not 'pricePerRecord'
            const active = allOffers.filter(o => o.isActive && BigInt(o.budget) >= BigInt(o.price));
            setOffers(active);

            // 2. Fetch My Records (to sell)
            const patientId = await patientContract.walletToPatientId(account);
            if (patientId > 0) {
                const records = await patientContract.getMedicalRecords(patientId);
                setMyRecords(records.map(r => ({
                    ipfsHash: r.ipfsHash || r[1], 
                    fileName: r.fileName || r[2],
                    date: r.recordDate || r[3]
                })));
            }
        } catch(e) { console.error("Marketplace Load Error:", e); }
    }

    const handleSell = async () => {
        if(!selectedOffer || !selectedRecord) return;
        setLoading(true);
        setStatus("Processing Transaction...");
        
        try {
            // Call sellData(offerId, ipfsHash)
            const tx = await marketplaceContract.sellData(selectedOffer.id, selectedRecord.ipfsHash);
            setStatus("Transaction Sent... Waiting for Confirmation");
            await tx.wait();
            
            setStatus("Success! Data Sold & ETH Received.");
            alert("Data Sold Successfully!");
            loadMarketplace(); // Refresh
            setSelectedOffer(null);
            
        } catch(e) {
            console.error(e);
            setStatus("Transaction Failed: " + (e.reason || e.message));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Data Marketplace</h2>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200">
                    Earn ETH for your Data
                </span>
            </div>

            {/* Active Offers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">
                        No active offers available at the moment. Check back later.
                    </p>
                ) : (
                    offers.map((offer) => (
                        <Card key={offer.id.toString()} className="hover:shadow-lg transition-shadow border-t-4 border-purple-600">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between">
                                    {offer.title}
                                    <span className="text-green-600 font-bold text-base">
                                        {ethers.formatEther(offer.price)} ETH
                                    </span>
                                </CardTitle>
                                <p className="text-xs text-gray-400 font-mono text-ellipsis overflow-hidden">
                                    By: {offer.company.slice(0,6)}...{offer.company.slice(-4)}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4 h-12 overflow-hidden text-ellipsis">
                                    {offer.description}
                                </p>
                                
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button 
                                            className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                                            onClick={() => setSelectedOffer(offer)}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Sell My Data
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Select Data to Sell</DialogTitle>
                                        </DialogHeader>
                                        
                                        <div className="space-y-4 py-4">
                                            <p className="text-sm text-gray-600">
                                                You are selling data to <b>{offer.title}</b> for <b>{ethers.formatEther(offer.price)} ETH</b>.
                                            </p>

                                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                                                {myRecords.map((rec, i) => (
                                                    <div 
                                                        key={i} 
                                                        onClick={() => setSelectedRecord(rec)}
                                                        className={`p-3 rounded border cursor-pointer flex justify-between items-center ${selectedRecord?.ipfsHash === rec.ipfsHash ? 'bg-purple-50 border-purple-500' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div>
                                                            <p className="font-medium text-sm">{rec.fileName}</p>
                                                            <p className="text-xs text-gray-400">{rec.date}</p>
                                                        </div>
                                                        {selectedRecord?.ipfsHash === rec.ipfsHash && (
                                                            <Upload className="w-4 h-4 text-purple-600" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {loading ? (
                                                <div className="text-center py-2 space-y-2">
                                                    <p className="text-sm font-semibold animate-pulse text-purple-600">Processing Blockchain Transaction...</p>
                                                    <p className="text-xs text-slate-500">{status}</p>
                                                </div>
                                            ) : (
                                                <Button 
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    disabled={!selectedRecord}
                                                    onClick={handleSell}
                                                >
                                                    Confirm Sale
                                                </Button>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>

                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
