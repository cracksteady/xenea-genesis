"use client";

import { useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x7669e8b5ca288c6982bdbade8a504648daee8d4c";

const ABI = [
  "function mint(string memory metadataURI) public",
  "function totalSupply() public view returns(uint256)",
  "function hasMinted(address) public view returns(bool)"
];

const METADATA_URI = "ipfs://bafkreigu22qfa2eivawklotfp4kt5s3em3dshsizg2zv25irsxrtmwr7dq";

export default function Home() {

  const [wallet, setWallet] = useState("");
  const [minting, setMinting] = useState(false);
  const [supply, setSupply] = useState(0);
  const [status, setStatus] = useState("");

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    setWallet(accounts[0]);

    loadSupply();
  }

  async function loadSupply() {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      provider
    );

    const total = await contract.totalSupply();

    setSupply(Number(total));
  }

  async function mintNFT() {
    try {
      setMinting(true);
      setStatus("Preparing transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const alreadyMinted = await contract.hasMinted(wallet);

      if (alreadyMinted) {
        alert("Wallet already minted");
        setMinting(false);
        return;
      }

      const tx = await contract.mint(METADATA_URI);

      setStatus("Waiting for confirmation...");

await tx.wait();

      setStatus("NFT Minted Successfully");

      loadSupply();

    } catch (err) {
      console.error(err);
      setStatus("Mint Failed");
    }

    setMinting(false);
  }

  return (
    <main className="min-h-screen bg-[#dce3e7] text-white flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center shadow-2xl">

        <img
          src="/banner.png"
          className="rounded-2xl mb-6"
        />

        <h1 className="text-4xl font-light tracking-[0.4em] text-white mb-2">
          XENEA
        </h1>

        <p className="text-white/70 tracking-[0.3em] mb-8 text-sm">
          GENESIS NFT
        </p>

        <div className="mb-6 text-white/80">
          Minted: {supply}
        </div>

        {!wallet ? (
          <button
            onClick={connectWallet}
            className="w-full bg-white text-black py-3 rounded-2xl hover:opacity-90 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={mintNFT}
            disabled={minting}
            className="w-full bg-white text-black py-3 rounded-2xl hover:opacity-90 transition"
          >
            {minting ? "Minting..." : "Mint Genesis NFT"}
          </button>
        )}

        <div className="mt-6 text-sm text-white/60 break-all">
          {wallet}
        </div>

        <div className="mt-4 text-sm text-white/70">
          {status}
        </div>

      </div>

    </main>
  );
}
