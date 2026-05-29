"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";

interface DonateFormProps {
  campaignId: number;
  signer: ethers.Signer | null;
  onDonated: () => void;
}

export default function DonateForm({ campaignId, signer, onDonated }: DonateFormProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const donate = async () => {
    if (!signer) { setError("Connect your wallet first."); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount."); return; }
    setError("");
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.donate(campaignId, {
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      setAmount("");
      onDonated();
    } catch (err: any) {
      setError(err?.reason || err?.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Make a Donation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.1"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={donate} disabled={loading} className="w-full">
          {loading ? "Sending..." : "Donate"}
        </Button>
        {!signer && (
          <p className="text-xs text-muted-foreground text-center">
            Connect your wallet to donate
          </p>
        )}
      </CardContent>
    </Card>
  );
}