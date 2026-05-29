"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/lib/contract";
import ConnectWallet from "@/components/ConnectWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ADMIN_PASSWORD = "Admin@123";
const OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ngo, setNgo] = useState("");
  const [stages, setStages] = useState([
    { description: "", amount: "" },
    { description: "", amount: "" },
  ]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password.");
    }
  };

  const addStage = () => setStages([...stages, { description: "", amount: "" }]);

  const updateStage = (i: number, field: string, value: string) => {
    const updated = [...stages];
    updated[i] = { ...updated[i], [field]: value };
    setStages(updated);
  };

  const createCampaign = async () => {
    if (!signer) { setError("Connect wallet first."); return; }
    if (address.toLowerCase() !== OWNER.toLowerCase()) {
      setError("Only the contract owner can create campaigns.");
      return;
    }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const descs = stages.map((s) => s.description);
      const amounts = stages.map((s) => ethers.parseEther(s.amount || "0"));
      const goal = amounts.reduce((a, b) => a + b, 0n);
      const tx = await contract.createCampaign(title, description, ngo, goal, descs, amounts);
      await tx.wait();
      setSuccess("Campaign created successfully!");
      setTitle(""); setDescription(""); setNgo("");
      setStages([{ description: "", amount: "" }, { description: "", amount: "" }]);
    } catch (err: any) {
      setError(err?.reason || err?.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <Button onClick={handleLogin} className="w-full">Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin</h1>
        <ConnectWallet onConnected={(s, a) => { setSigner(s); setAddress(a); }} />
      </div>

      {address && address.toLowerCase() !== OWNER.toLowerCase() && (
        <p className="text-destructive text-sm">This wallet is not the contract owner.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Campaign title" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this campaign for?" />
          </div>
          <div className="space-y-1">
            <Label>NGO Wallet Address</Label>
            <Input value={ngo} onChange={(e) => setNgo(e.target.value)} placeholder="0x..." />
          </div>
          <div className="space-y-2">
            <Label>Funding Stages</Label>
            {stages.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Stage description"
                  value={s.description}
                  onChange={(e) => updateStage(i, "description", e.target.value)}
                />
                <Input
                  placeholder="ETH"
                  type="number"
                  className="w-24"
                  value={s.amount}
                  onChange={(e) => updateStage(i, "amount", e.target.value)}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addStage}>+ Add Stage</Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button
            onClick={createCampaign}
            disabled={loading || !signer || address.toLowerCase() !== OWNER.toLowerCase()}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
