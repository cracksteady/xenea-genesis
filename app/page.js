"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xFE5Ad1cCD650759C537e382e4B28d96D1D968633";

const ABI = [
  "function mint(string memory metadataURI) public",
  "function totalSupply() public view returns(uint256)",
  "function hasMinted(address) public view returns(bool)"
];

const METADATA_URI =
  "https://lime-used-bug-551.mypinata.cloud/ipfs/bafkreihgrqxn5zf7lglnl5v4lbu4bgo4tmzbepfvjo2qlpqjr2brxt7q7i";

/*
  REPLACE THIS WITH XENEA CHAIN ID
  Example:
  0x1 = Ethereum
  0x89 = Polygon
*/
const CHAIN_ID = "0x448";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [minting, setMinting] = useState(false);
  const [supply, setSupply] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    checkWalletConnection();
  }, []);

  async function checkWalletConnection() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);

      const accounts = await provider.send("eth_accounts", []);

      if (accounts.length > 0) {
        setWallet(accounts[0]);
        loadSupply();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function switchNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }]
      });

      return true;
    } catch (err) {
      console.error(err);
      setStatus("Wrong Network");
      return false;
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus("No Wallet Detected");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();

      const address = await signer.getAddress();

      setWallet(address);

      const switched = await switchNetwork();

      if (!switched) return;

      setStatus("Wallet Connected");

      loadSupply();
    } catch (err) {
      console.error(err);
      setStatus("Connection Failed");
    }
  }

  async function loadSupply() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        provider
      );

      const total = await contract.totalSupply();

      setSupply(Number(total));
    } catch (err) {
      console.error(err);
    }
  }

  async function mintNFT() {
    try {
      if (!window.ethereum) {
        setStatus("No Wallet Detected");
        return;
      }

      setMinting(true);

      const switched = await switchNetwork();

      if (!switched) {
        setMinting(false);
        return;
      }

      setStatus("Preparing Transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();

      const userAddress = await signer.getAddress();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const alreadyMinted = await contract.hasMinted(userAddress);

      if (alreadyMinted) {
        setStatus("Wallet Already Minted");
        setMinting(false);
        return;
      }

      const tx = await contract.mint(METADATA_URI);

      setStatus("Waiting For Confirmation...");

      await tx.wait();

      setStatus("NFT Minted Successfully");

      loadSupply();
    } catch (err) {
      console.error(err);

      if (err.code === 4001) {
        setStatus("Transaction Rejected");
      } else {
        setStatus("Mint Failed");
      }
    }

    setMinting(false);
  }

  return (
    <main className="min-h-screen bg-[#dce3e7] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center shadow-2xl">
        
        <img
          src="/banner.png"
          className="rounded-2xl mb-6"
          alt="Banner"
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
            className="w-full bg-white text-black py-3 rounded-2xl hover:opacity-90 transition disabled:opacity-50"
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
