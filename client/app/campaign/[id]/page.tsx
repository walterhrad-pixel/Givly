"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";
import ConnectWallet from "@/components/ConnectWallet";
import DonateForm from "@/components/DonateForm";
import StageList from "@/components/StageList";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefundClaim from "@/components/RefundClaim";

type Role = null | "donor" | "ngo";

export default function CampaignPage() {
  const { id } = useParams();
  const campaignId = Number(id);
  const [campaign, setCampaign] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [donors, setDonors] = useState<string[]>([]);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [ngoPassword, setNgoPassword] = useState("");
  const [ngoPasswordError, setNgoPasswordError] = useState("");
  const [ngoAuthenticated, setNgoAuthenticated] = useState(false);

  const load = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const c = await contract.getCampaign(campaignId);
      const s = await contract.getStages(campaignId);
      const d = await contract.getDonors(campaignId);
      const t = await contract.getTimeUntilNextRelease(campaignId);
      setCampaign(c);
      setStages(s);
      setDonors(d);
      setTimeUntilNext(Number(t));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleNgoLogin = () => {
    if (!campaign) return;
    const ngoAddr: string = campaign.ngo;
    const expectedPassword = ngoAddr.slice(-6).toLowerCase();
    if (ngoPassword.toLowerCase() === expectedPassword) {
      setNgoAuthenticated(true);
      setNgoPasswordError("");
    } else {
      setNgoPasswordError("Incorrect password. Redirecting to donor view...");
      setTimeout(() => {
        setRole("donor");
        setNgoPassword("");
        setNgoPasswordError("");
      }, 2000);
    }
  };

  if (loading) return <p className="text-muted-foreground p-8">Loading...</p>;
  if (!campaign) return <p className="text-destructive p-8">Campaign not found.</p>;

  const goalEth = parseFloat(ethers.formatEther(campaign.goal));
  const donatedEth = parseFloat(ethers.formatEther(campaign.totalDonated));
  const progress = goalEth > 0 ? Math.min((donatedEth / goalEth) * 100, 100) : 0;
  const statusLabel = ["Active", "Frozen", "Completed"][Number(campaign.status)];
  const statusVariant: any = ["secondary", "destructive", "default"][Number(campaign.status)];

  const CampaignSummary = () => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{donatedEth.toFixed(3)} ETH raised</span>
        <span className="text-muted-foreground">Goal: {goalEth.toFixed(3)} ETH</span>
      </div>
      <Progress value={progress} className="h-3" />
      <div className="flex gap-3 text-sm text-muted-foreground items-center">
        <span>{donors.length} donors</span>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
    </div>
  );

  if (!role) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">How are you accessing this campaign?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">{campaign.title}</p>
            <Button className="w-full" onClick={() => setRole("donor")}>I am a Donor</Button>
            <Button className="w-full" variant="outline" onClick={() => setRole("ngo")}>I am the NGO</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "ngo" && !ngoAuthenticated) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-sm">
          <CardHeader><CardTitle>NGO Access</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your NGO access code for this campaign.</p>
            <div className="space-y-1">
              <Label>Access Code</Label>
              <Input type="password" value={ngoPassword}
                onChange={(e) => setNgoPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNgoLogin()}
                placeholder="Enter access code" />
            </div>
            {ngoPasswordError && <p className="text-sm text-destructive">{ngoPasswordError}</p>}
            <Button onClick={handleNgoLogin} className="w-full">Login</Button>
            <Button variant="ghost" className="w-full" onClick={() => setRole(null)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "donor") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          </div>
          <ConnectWallet onConnected={(s, a) => { setSigner(s); setAddress(a); }} />
        </div>
        <CampaignSummary />
        <DonateForm campaignId={campaignId} signer={signer} onDonated={load} />
        <RefundClaim campaignId={campaignId} signer={signer} address={address} onClaimed={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <p className="text-muted-foreground mt-1">{campaign.description}</p>
        </div>
        <ConnectWallet onConnected={(s, a) => { setSigner(s); setAddress(a); }} />
      </div>
      <CampaignSummary />
      <div className="p-3 rounded-lg bg-muted text-sm">
        <p className="font-medium">NGO Dashboard</p>
        <p className="text-muted-foreground text-xs mt-1">Connect the NGO wallet ({campaign.ngo.slice(0, 6)}...{campaign.ngo.slice(-4)}) to request stage releases.</p>
      </div>
      <StageList campaignId={campaignId} stages={stages} status={Number(campaign.status)}
        currentStage={Number(campaign.currentStage)} timeUntilNext={timeUntilNext}
        ngo={campaign.ngo} signer={signer} address={address} onUpdated={load} />
    </div>
  );
}