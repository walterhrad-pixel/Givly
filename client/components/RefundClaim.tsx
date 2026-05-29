"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RefundClaimProps {
  campaignId: number;
  signer: ethers.Signer | null;
  address: string;
  onClaimed: () => void;
}

export default function RefundClaim({ campaignId, signer, address, onClaimed }: RefundClaimProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    if (!address) return;
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const s = await contract.getRefundStatus(campaignId, address);
      setStatus(s);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadStatus(); }, [address, campaignId]);

  const claimRefund = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.claimRefund(campaignId);
      await tx.wait();
      onClaimed();
    } catch (err: any) {
      alert(err?.reason || err?.message || "Refund failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!status || !status.isFrozen) return null;

  const timeLeft = Number(status.timeUntilRefund);
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Refund Available</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This campaign was frozen due to an early fund request. Donors are entitled to a refund.
        </p>

        {status.alreadyClaimed ? (
          <p className="text-sm text-green-600 font-medium">Refund already claimed.</p>
        ) : status.refundAvailable ? (
          <div className="space-y-2">
            <p className="text-sm">
              Your estimated refund: <span className="font-medium">
                {ethers.formatEther(status.estimatedRefund)} ETH
              </span>
            </p>
            <Button onClick={claimRefund} disabled={loading} className="w-full" variant="destructive">
              {loading ? "Claiming..." : "Claim Refund"}
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Refund available in: <span className="font-medium">{days}d {hours}h</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Estimated refund: {ethers.formatEther(status.estimatedRefund)} ETH
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
