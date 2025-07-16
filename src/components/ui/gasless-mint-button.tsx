'use client'

import React from 'react';
import { TransactionButton } from 'thirdweb/react';
import { getContract, createThirdwebClient } from 'thirdweb';
import { mintTo } from 'thirdweb/extensions/erc721';
import { defineChain } from 'thirdweb/chains';
import { Rocket, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define Polygon Amoy
const amoy = defineChain(80002);

interface GaslessMintButtonProps {
  address: string;
  metadataUri: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

export function GaslessMintButton({
  address,
  metadataUri,
  disabled,
  className,
  onSuccess,
  onError,
  children
}: GaslessMintButtonProps) {
  
  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
  });

  const contract = getContract({
    client,
    chain: amoy,
    address: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || '',
  });

  return (
    <TransactionButton
      transaction={() => mintTo({
        contract,
        to: address,
        nft: metadataUri
      })}
      gasless={{
        provider: "engine",
        relayerUrl: process.env.NEXT_PUBLIC_ENGINE_URL || ""
        // relayerForwarderAddress é gerenciado automaticamente pelo SDK para Polygon Amoy
      }}
      onTransactionSent={(tx) => {
        console.log("🚀 Gasless transaction sent via Engine!", tx);
        toast.success("Transaction sent! Waiting for confirmation...");
      }}
      onTransactionConfirmed={(receipt) => {
        console.log("✅ Gasless transaction confirmed!", receipt);
        toast.success(`NFT minted successfully! Hash: ${receipt.transactionHash}`);
        onSuccess?.(receipt.transactionHash);
      }}
      onError={(error) => {
        console.error("❌ Gasless transaction failed:", error);
        toast.error(error.message || "Failed to mint NFT");
        onError?.(error);
      }}
      disabled={disabled}
      unstyled
      className={className}
    >
      {children || (
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          <span>Mint (Gasless)</span>
        </div>
      )}
    </TransactionButton>
  );
} 