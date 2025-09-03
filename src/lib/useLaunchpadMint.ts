import { useState } from "react";
import { SmartContract } from "@thirdweb-dev/sdk";
import { toast } from "sonner";

export const useLaunchpadMint = () => {
  const [isMinting, setIsMinting] = useState(false);

  const mint = async ({
    contract,
    quantity,
  }: {
    contract: SmartContract;
    quantity: number;
  }) => {
    try {
      setIsMinting(true);
      console.log("🚀 Starting mint for", contract.getAddress(), "Quantity:", quantity);

      const tx = await contract.erc721.claim(quantity);
      console.log("✅ Mint completed:", tx);
      toast.success("NFT minted successfully!");
      return tx;
    } catch (err: any) {
      console.error("❌ Error minting:", err);
      toast.error("Error minting: " + (err?.message || "Unknown error"));
      throw err;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    mint,
    isMinting,
  };
};