"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface ConnectWalletProps {
  onConnected: (signer: ethers.Signer, address: string) => void;
}

export default function ConnectWallet({ onConnected }: ConnectWalletProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const reconnect = async () => {
      if (typeof window.ethereum === "undefined") return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
        onConnected(signer, addr);
      }
    };
    reconnect();
  }, []);

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not found. Please install it.");
      return;
    }
    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      onConnected(signer, addr);
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  if (address) {
    return (
      <Badge variant="outline" className="text-sm px-3 py-1">
        {address.slice(0, 6)}...{address.slice(-4)}
      </Badge>
    );
  }

  return (
    <Button onClick={connect} disabled={connecting}>
      {connecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}