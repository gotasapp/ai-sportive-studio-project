'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { claimTo } from 'thirdweb/extensions/erc721';
import { IPFSService } from '@/lib/services/ipfs-service';

interface PublicMintProps {
  imageBlob: Blob | null;
  metadata: {
    name: string;
    description: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}

type MintStep = 'idle' | 'uploading' | 'minting' | 'success' | 'error';

export function PublicMint({ imageBlob, metadata }: PublicMintProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<MintStep>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
  });

  const contract = getContract({
    client,
    address: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
    chain: polygonAmoy,
  });

  const handleMint = async () => {
    if (!account || !imageBlob) return;

    try {
      setStep('uploading');
      setError('');

      console.log('📤 Uploading image to IPFS...');
      const filename = `${metadata.name.replace(/\s+/g, '_')}_${Date.now()}.png`;
      const imageUrl = await IPFSService.uploadImage(imageBlob, filename);
      console.log('✅ Image uploaded:', imageUrl);

      console.log('📤 Uploading metadata to IPFS...');
      const metadataUri = await IPFSService.uploadMetadata({
        ...metadata,
        image: imageUrl,
      });
      console.log('✅ Metadata uploaded:', metadataUri);

      setStep('minting');
      console.log('🚀 Preparing batch mint transaction...');

      // Use claimTo for NFT Drop with quantity to create internal collection
      const transaction = prepareContractCall({
        contract,
        method: claimTo,
        params: [
          account.address, // receiver
          BigInt(quantity), // quantity - creates internal collection of same NFTs
          { currency: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', pricePerToken: 0n, allowlistProof: undefined }
        ],
      });

      console.log(`🚀 Minting ${quantity} NFTs to create internal collection...`);

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('✅ Batch mint successful:', result.transactionHash);
          setTxHash(result.transactionHash);
          setStep('success');
        },
        onError: (error) => {
          console.error('❌ Batch mint failed:', error);
          setError(error.message);
          setStep('error');
        },
      });
    } catch (error) {
      console.error('❌ Error during batch mint process:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setStep('error');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setStep('idle');
    setQuantity(1);
    setError('');
    setTxHash('');
  };

  const getStepText = () => {
    switch (step) {
      case 'uploading': return 'Uploading to IPFS...';
      case 'minting': return `Minting ${quantity} NFTs...`;
      case 'success': return 'Batch mint successful!';
      case 'error': return 'Mint failed';
      default: return 'Ready to mint';
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={!imageBlob || !account}
        >
          Mint Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Mint NFTs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {step === 'idle' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Quantity (1-20)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500">
                  Creates an internal collection of {quantity} identical NFTs
                </p>
              </div>
              
              <Button 
                onClick={handleMint}
                disabled={!account || !imageBlob}
                className="w-full"
              >
                Mint {quantity} NFT{quantity > 1 ? 's' : ''}
              </Button>
            </>
          )}

          {(step === 'uploading' || step === 'minting') && (
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm">{getStepText()}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-600">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-600">{getStepText()}</p>
                <p className="text-sm text-gray-600">
                  Created internal collection of {quantity} NFTs
                </p>
              </div>
              {txHash && (
                <a
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  View on Explorer →
                </a>
              )}
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-red-600">{getStepText()}</p>
                <p className="text-sm text-gray-600 break-words">{error}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleMint} variant="outline" className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 