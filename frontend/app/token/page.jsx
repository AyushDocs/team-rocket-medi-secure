"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToken, useVesting, useICO } from "@/hooks/lib/useToken";
import { useWeb3 } from "@/context/Web3Context";

export default function TokenPage() {
  const { account } = useWeb3();
  const [tab, setTab] = useState("wallet");
  
  const { balance, totalSupply, transfer, approve, burn, loading, error } = useToken(
    process.env.NEXT_PUBLIC_TOKEN_ADDRESS
  );
  const { claimable, claim } = useVesting(process.env.NEXT_PUBLIC_VESTING_ADDRESS);
  const { stats, buyTokens } = useICO(process.env.NEXT_PUBLIC_ICO_ADDRESS);

  const [sendAmount, setSendAmount] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [burnAmount, setBurnAmount] = useState("");

  const handleTransfer = async () => {
    if (!sendTo || !sendAmount) return;
    const tx = await transfer(sendTo, sendAmount);
    if (tx) {
      setSendAmount("");
      setSendTo("");
    }
  };

  const handleBurn = async () => {
    if (!burnAmount) return;
    const tx = await burn(burnAmount);
    if (tx) setBurnAmount("");
  };

  const handleBuy = async () => {
    if (!sendAmount) return;
    const tx = await buyTokens(sendAmount);
    if (tx) setSendAmount("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SANJ Token</h1>
          <p className="text-gray-600">Sanjeevni Utility Token</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Your Balance</div>
              <div className="text-2xl font-bold text-[#703FA1]">{balance} SANJ</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Total Supply</div>
              <div className="text-2xl font-bold text-blue-600">{totalSupply} SANJ</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Claimable</div>
              <div className="text-2xl font-bold text-green-600">{claimable} SANJ</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant={tab === "wallet" ? "default" : "outline"} onClick={() => setTab("wallet")} className={tab === "wallet" ? "bg-[#703FA1]" : ""}>
            Wallet
          </Button>
          <Button variant={tab === "ico" ? "default" : "outline"} onClick={() => setTab("ico")} className={tab === "ico" ? "bg-[#703FA1]" : ""}>
            Buy Tokens
          </Button>
          <Button variant={tab === "vesting" ? "default" : "outline"} onClick={() => setTab("vesting")} className={tab === "vesting" ? "bg-[#703FA1]" : ""}>
            Vesting
          </Button>
        </div>

        {tab === "wallet" && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Send to</label>
                <Input placeholder="0x..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Amount</label>
                <Input placeholder="100" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
              </div>
              <Button onClick={handleTransfer} disabled={loading || !sendTo || !sendAmount} className="w-full">
                {loading ? "Sending..." : "Send Tokens"}
              </Button>

              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm">Burn tokens</label>
                  <Input placeholder="100" type="number" value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} />
                </div>
                <Button onClick={handleBurn} disabled={loading || !burnAmount} variant="destructive" className="w-full mt-2">
                  Burn Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "ico" && (
          <Card>
            <CardHeader>
              <CardTitle>Buy SANJ Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Rate:</span>
                <span>{stats.rate} SANJ per ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Raised:</span>
                <span>{stats.raised} / {stats.hardCap} ETH</span>
              </div>
              <Badge variant={stats.active ? "default" : "outline"}>
                {stats.active ? "Active" : "Closed"}
              </Badge>

              <div className="space-y-2">
                <label className="text-sm">ETH Amount</label>
                <Input placeholder="0.1" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
              </div>
              <Button onClick={handleBuy} disabled={loading || !stats.active} className="w-full">
                {loading ? "Buying..." : `Buy ${sendAmount ? (sendAmount * stats.rate).toFixed(0) : 0} SANJ`}
              </Button>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
          </Card>
        )}

        {tab === "vesting" && (
          <Card>
            <CardHeader>
              <CardTitle>Your Vesting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#703FA1]">{claimable}</div>
                <div className="text-gray-500">Claimable SANJ</div>
              </div>
              <Button onClick={claim} disabled={loading || parseFloat(claimable) === 0} className="w-full">
                {loading ? "Claiming..." : "Claim Tokens"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}