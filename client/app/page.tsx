"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";
import CampaignCard from "@/components/CampaignCard";
import ConnectWallet from "@/components/ConnectWallet";

interface Campaign {
  id: number;
  title: string;
  description: string;
  ngo: string;
  goal: bigint;
  totalDonated: bigint;
  active: boolean;
  milestoneCount: number;
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const count = await contract.campaignCount();
      const items: Campaign[] = [];
      for (let i = 0; i < Number(count); i++) {
        const c = await contract.getCampaign(i);
        const milestones = await contract.getStages(i);
        items.push({
          id: i,
          title: c.title,
          description: c.description,
          ngo: c.ngo,
          goal: c.goal,
          totalDonated: c.totalDonated,
          active: c.active,
          milestoneCount: milestones.length,
        });
      }
      setCampaigns(items);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Donate to verified NGO campaigns. Funds released only when milestones are met.
          </p>
        </div>
        <ConnectWallet onConnected={(s) => setSigner(s)} />
      </div>

      {loading && <p className="text-muted-foreground">Loading campaigns...</p>}

      {!loading && campaigns.length === 0 && (
        <p className="text-muted-foreground">No campaigns yet. Check back soon.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}