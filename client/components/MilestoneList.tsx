"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";
import { useState } from "react";

interface Milestone {
  description: string;
  amount: bigint;
  released: boolean;
  votesFor: bigint;
  votesAgainst: bigint;
}

interface MilestoneListProps {
  campaignId: number;
  milestones: Milestone[];
  totalDonated: bigint;
  signer: ethers.Signer | null;
  address: string;
  onUpdated: () => void;
}

export default function MilestoneList({
  campaignId, milestones, totalDonated, signer, address, onUpdated
}: MilestoneListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const vote = async (index: number, approve: boolean) => {
    if (!signer) return;
    setLoading(index + (approve ? "-yes" : "-no"));
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.voteOnMilestone(campaignId, index, approve);
      await tx.wait();
      onUpdated();
    } catch (err: any) {
      alert(err?.reason || err?.message || "Vote failed.");
    } finally {
      setLoading(null);
    }
  };

  const getVotePercent = (votesFor: any) => {
    if (!votesFor || totalDonated === 0n) return 0;
    try { return Math.min(Number((BigInt(votesFor.toString()) * 100n) / totalDonated), 100); } catch { return 0; }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Milestones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((m, i) => {
          const percent = getVotePercent(m.votesFor);
          return (
            <div key={i} className="space-y-2 p-3 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{m.description}</p>
                  <p className="text-xs text-muted-foreground">{ethers.formatEther(m.amount)} ETH</p>
                </div>
                {m.released ? (
                  <Badge variant="default">Released</Badge>
                ) : percent >= 60 ? (
                  <Badge variant="secondary">Threshold met</Badge>
                ) : (
                  <Badge variant="outline">Voting</Badge>
                )}
              </div>

              {!m.released && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Votes for: {m.votesFor ? ethers.formatEther(m.votesFor) : "0"} ETH</span>
                      <span>{percent}% / 60% needed</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>

                  {signer && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => vote(i, true)}
                        disabled={loading !== null}
                      >
                        {loading === i + "-yes" ? "..." : "Vote Yes"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => vote(i, false)}
                        disabled={loading !== null}
                      >
                        {loading === i + "-no" ? "..." : "Vote No"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}