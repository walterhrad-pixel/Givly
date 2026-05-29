"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";
import { useState } from "react";

interface Stage {
  description: string;
  amount: bigint;
  released: boolean;
  releasedAt: bigint;
}

interface StageListProps {
  campaignId: number;
  stages: Stage[];
  status: number;
  currentStage: number;
  timeUntilNext: number;
  ngo: string;
  signer: ethers.Signer | null;
  address: string;
  onUpdated: () => void;
}

export default function StageList({
  campaignId, stages, status, currentStage, timeUntilNext, ngo, signer, address, onUpdated
}: StageListProps) {
  const [loading, setLoading] = useState(false);

  const requestRelease = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.requestRelease(campaignId);
      await tx.wait();
      onUpdated();
    } catch (err: any) {
      alert(err?.reason || err?.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  const isNgo = address.toLowerCase() === ngo.toLowerCase();

  const statusBadge = () => {
    if (status === 1) return <Badge variant="destructive">Frozen</Badge>;
    if (status === 2) return <Badge variant="default">Completed</Badge>;
    return <Badge variant="secondary">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Funding Stages</CardTitle>
          {statusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 1 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive font-medium">Campaign Frozen</p>
            <p className="text-xs text-destructive/80 mt-1">
              An early fund request was detected. All remaining funds are permanently locked.
              Donors may claim a refund after 30 days.
            </p>
          </div>
        )}

        {stages.map((s, i) => {
          const isCurrentStage = i === currentStage;

          return (
            <div key={i} className="space-y-2 p-3 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{s.description}</p>
                  <p className="text-xs text-muted-foreground">{ethers.formatEther(s.amount)} ETH</p>
                </div>
                {s.released ? (
                  <Badge variant="default">Released</Badge>
                ) : status === 1 ? (
                  <Badge variant="destructive">Frozen</Badge>
                ) : isCurrentStage ? (
                  <Badge variant="secondary">Current</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>

              {isCurrentStage && status === 0 && isNgo && (
                <div className="space-y-2">
                  {timeUntilNext > 0 && (
                    <p className="text-xs text-amber-600 font-medium">
                      Warning: Requesting release before 30 days will permanently freeze this campaign.
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={requestRelease}
                    disabled={loading}
                    variant={timeUntilNext > 0 ? "destructive" : "default"}
                  >
                    {loading ? "Processing..." : timeUntilNext > 0 ? "Request Early Release (Will Freeze Campaign)" : "Request Stage Release"}
                  </Button>
                </div>
              )}

              {isCurrentStage && status === 0 && !isNgo && (
                <p className="text-xs text-muted-foreground">Waiting for NGO to request release</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
