import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { mintWithSignature } from 'thirdweb/extensions/erc721';
import { useActiveAccount } from 'thirdweb/react';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

interface PublicMintProps {
  name: string;
  description: string;
  imageBlob: Blob;
  attributes?: Array<{ trait_type: string; value: string }>;
  disabled?: boolean;
  onSuccess?: (result: { transactionHash: string; tokenId?: string }) => void;
  onError?: (error: string) => void;
}

export function PublicMint({
  name,
  description,
  imageBlob,
  attributes = [],
  disabled = false,
  onSuccess,
  onError
}: PublicMintProps) {
  const account = useActiveAccount();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'signing' | 'minting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');

  const contract = getContract({
    client,
    chain: polygonAmoy,
    address: NFT_CONTRACT_ADDRESS,
  });

  const handleMint = async () => {
    if (!account?.address) {
      setError('Please connect your wallet first');
      onError?.('Please connect your wallet first');
      return;
    }

    if (!imageBlob) {
      setError('No image available for minting');
      onError?.('No image available for minting');
      return;
    }

    setStatus('uploading');
    setError('');

    try {
      console.log('🎯 PUBLIC MINT: Starting signature-based mint...');

      // 1. Upload image to IPFS via our API
      const formData = new FormData();
      formData.append('file', imageBlob, `${name.replace(/\s+/g, '_')}.png`);

      const uploadResponse = await fetch('/api/ipfs-upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to IPFS');
      }

      const uploadData = await uploadResponse.json();
      console.log('✅ Image uploaded to IPFS:', uploadData.ipfsUrl);

      // 2. Prepare metadata
      const metadata = {
        name,
        description,
        image: uploadData.ipfsUrl,
        attributes: attributes.length > 0 ? attributes : [
          { trait_type: 'Generator', value: 'AI Sports NFT' },
          { trait_type: 'Type', value: 'User Generated' },
          { trait_type: 'Created', value: new Date().toISOString().split('T')[0] }
        ]
      };

      setStatus('signing');
      console.log('📝 Requesting mint signature...');

      // 3. Get mint signature from our API
      const signatureResponse = await fetch('/api/generate-mint-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: account.address,
          metadata
        })
      });

      if (!signatureResponse.ok) {
        const errorData = await signatureResponse.json();
        throw new Error(errorData.details || 'Failed to generate mint signature');
      }

      const { payload, signature } = await signatureResponse.json();
      console.log('✅ Mint signature generated');

      setStatus('minting');
      console.log('🚀 Executing mint transaction...');

      // 4. Execute mint transaction with signature
      const transaction = mintWithSignature({
        contract,
        payload,
        signature,
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      console.log('✅ PUBLIC MINT successful:', result);
      setTransactionHash(result.transactionHash);
      setStatus('success');

      onSuccess?.({ 
        transactionHash: result.transactionHash,
        // tokenId will be extracted from transaction receipt if needed
      });

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setTransactionHash('');
      }, 5000);

    } catch (err: any) {
      console.error('❌ PUBLIC MINT failed:', err);
      const errorMessage = err?.message || 'Failed to mint NFT';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setError('');
      }, 5000);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'uploading': return 'Uploading to IPFS...';
      case 'signing': return 'Getting Signature...';
      case 'minting': return 'Minting NFT...';
      case 'success': return 'Minted Successfully!';
      case 'error': return 'Mint Failed';
      default: return 'Mint NFT (Public)';
    }
  };

  const getButtonIcon = () => {
    switch (status) {
      case 'uploading':
      case 'signing':
      case 'minting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isLoading = ['uploading', 'signing', 'minting'].includes(status);
  const isDisabled = disabled || isLoading || !account?.address;

  return (
    <div className="space-y-3">
      <Button
        onClick={handleMint}
        disabled={isDisabled}
        className={`w-full ${
          status === 'success' 
            ? 'bg-green-600 hover:bg-green-700' 
            : status === 'error'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-[#A20131] hover:bg-[#8a0129]'
        }`}
      >
        <div className="flex items-center gap-2">
          {getButtonIcon()}
          {getButtonText()}
        </div>
      </Button>

      {/* Status Messages */}
      {status === 'success' && transactionHash && (
        <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-lg">
          <div className="text-sm text-green-400 space-y-2">
            <div>✅ NFT minted successfully!</div>
            <a 
              href={`https://amoy.polygonscan.com/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              View on Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
          <div className="text-sm text-red-400">
            ❌ {error}
          </div>
        </div>
      )}

      {!account?.address && (
        <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded-lg">
          <div className="text-sm text-yellow-400">
            ⚠️ Please connect your wallet to mint NFTs
          </div>
        </div>
      )}

      {/* Info about public minting */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>🆓 <strong>Free Minting:</strong> No special permissions required</div>
        <div>💳 <strong>User Pays:</strong> You pay gas fees directly</div>
        <div>🔒 <strong>Secure:</strong> Server-signed mint authorization</div>
      </div>
    </div>
  );
} 