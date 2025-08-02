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
      console.log("✅ Mint realizado:", tx);
      toast.success("NFT mintado com sucesso!");
      return tx;
    } catch (err: any) {
      console.error("❌ Erro ao mintar:", err);
      toast.error("Erro ao mintar: " + (err?.message || "Erro desconhecido"));
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