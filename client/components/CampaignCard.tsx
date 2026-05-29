"use client";

import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface CampaignCardProps {
  id: number;
  title: string;
  description: string;
  goal: bigint;
  totalDonated: bigint;
  active: boolean;
  milestoneCount: number;
}

export default function CampaignCard({
  id, title, description, goal, totalDonated, active, milestoneCount
}: CampaignCardProps) {
  const goalEth = parseFloat(ethers.formatEther(goal));
  const donatedEth = parseFloat(ethers.formatEther(totalDonated));
  const progress = goalEth > 0 ? Math.min((donatedEth / goalEth) * 100, 100) : 0;

  return (
    <Link href={"/campaign/" + id}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={active ? "default" : "secondary"}>
              {active ? "Active" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="font-medium">{donatedEth.toFixed(3)} ETH raised</span>
            <span className="text-muted-foreground">Goal: {goalEth.toFixed(3)} ETH</span>
          </div>
          <p className="text-xs text-muted-foreground">{milestoneCount} stages</p>
        </CardContent>
      </Card>
    </Link>
  );
}