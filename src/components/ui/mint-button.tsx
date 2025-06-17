'use client'

import { useState } from 'react';
import { Button } from './button';
import { useWeb3 } from '@/lib/useWeb3';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

interface MintButtonProps {
  name: string;
  description: string;
  imageBlob?: Blob;
  attributes?: Array<{ trait_type: string; value: string }>;
  className?: string;
}

export function MintButton({ 
  name, 
  description, 
  imageBlob, 
  attributes = [],
  className = "" 
}: MintButtonProps) {
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  
  const { 
    isConnected, 
    address, 
    mintNFTWithMetadata, 
    switchToChzChain,
    connectionStatus 
  } = useWeb3();

  const handleMint = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!imageBlob) {
      setError('No image to mint');
      return;
    }

    setMintStatus('minting');
    setError('');

    try {
      // Switch to CHZ Chain if needed
      await switchToChzChain();
      
      // Convert blob to File
      const imageFile = new File([imageBlob], `${name}.png`, { type: 'image/png' });
      
      // Add default attributes if none provided
      const nftAttributes = attributes.length > 0 ? attributes : [
        { trait_type: 'Generator', value: 'AI Sports NFT' },
        { trait_type: 'Type', value: 'Sports Jersey' },
        { trait_type: 'Created', value: new Date().toISOString().split('T')[0] }
      ];
      
      // Mint NFT
      const result = await mintNFTWithMetadata(
        name,
        description,
        imageFile,
        nftAttributes,
        1
      );
      
      console.log('NFT minted successfully:', result);
      setMintStatus('success');
      
      // Reset after 3 seconds
      setTimeout(() => setMintStatus('idle'), 3000);
      
    } catch (err: any) {
      console.error('Minting failed:', err);
      setError(err.message || 'Failed to mint NFT');
      setMintStatus('error');
      
      // Reset after 5 seconds
      setTimeout(() => setMintStatus('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    switch (mintStatus) {
      case 'minting':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Minting NFT...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            NFT Minted!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Mint Failed
          </>
        );
      default:
        return (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Mint as NFT
          </>
        );
    }
  };

  const getButtonStyle = () => {
    switch (mintStatus) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 border-green-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 border-red-500';
      case 'minting':
        return 'bg-blue-600 hover:bg-blue-700 border-blue-500';
      default:
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 border-cyan-500';
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleMint}
        disabled={!isConnected || mintStatus === 'minting' || !imageBlob}
        className={`
          w-full transition-all duration-300 border-2 neon-border
          ${getButtonStyle()}
          ${className}
        `}
      >
        {getButtonContent()}
      </Button>
      
      {error && (
        <p className="text-red-400 text-sm text-center font-mono">
          {error}
        </p>
      )}
      
      {!isConnected && (
        <p className="text-cyan-400 text-sm text-center font-mono">
          Connect wallet to mint NFT
        </p>
      )}
      
      {isConnected && address && (
        <p className="text-cyan-400 text-xs text-center font-mono">
          Wallet: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      )}
    </div>
  );
} 