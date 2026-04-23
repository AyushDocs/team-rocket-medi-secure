"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import { Wallet, ExternalLink } from "lucide-react";

export function LinkWalletModal({ open, onOpenChange }) {
    const { linkWallet, connect, isConnected } = useWeb3();
    const [walletAddress, setWalletAddress] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLink = async () => {
        setError("");
        setLoading(true);
        
        try {
            if (!ethers.isAddress(walletAddress)) {
                setError("Invalid Ethereum address");
                return;
            }
            
            await linkWallet(walletAddress);
            onOpenChange(false);
            setWalletAddress("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectMetaMask = async () => {
        setError("");
        setLoading(true);
        try {
            await connect();
            // Wait for connection and get account
            setTimeout(async () => {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    await linkWallet(accounts[0]);
                    onOpenChange(false);
                }
                setLoading(false);
            }, 1000);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link Your Wallet</DialogTitle>
                    <DialogDescription>
                        Connect your Ethereum wallet to enable full blockchain functionality.
                        You can use MetaMask or enter an address manually.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <Button 
                        onClick={handleConnectMetaMask}
                        className="w-full bg-[#F6851B] hover:bg-[#E27625] text-white"
                        disabled={loading}
                    >
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect with MetaMask
                    </Button>
                    
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-gray-200" />
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                        <div className="flex-grow border-t border-gray-200" />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Enter wallet address manually
                        </label>
                        <Input
                            placeholder="0x..."
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            className="font-mono text-sm"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleLink} 
                        disabled={!walletAddress || loading}
                        className="bg-[#703FA1]"
                    >
                        {loading ? "Linking..." : "Link Wallet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function CustodianOnlyView({ children, fallback }) {
    const { isCustodian, custodianUser, isConnected } = useWeb3();
    
    if (!isCustodian && !isConnected) {
        return fallback || (
            <div className="p-4 text-center text-gray-500">
                Please sign in to view this content
            </div>
        );
    }
    
    return children;
}