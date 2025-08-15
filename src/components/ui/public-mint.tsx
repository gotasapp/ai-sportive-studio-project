'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { claimTo } from 'thirdweb/extensions/erc1155';
import { IPFSService } from '@/lib/services/ipfs-service';
import { Users } from 'lucide-react';

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
    address: process.env.NEXT_PUBLIC_NFT_EDITION_CONTRACT_POLYGON_TESTNET || '0xdFE746c26D3a7d222E89469C8dcb033fbBc75236',
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
        attributes: metadata.attributes || [
          { trait_type: 'Generator', value: 'AI Sports NFT' },
          { trait_type: 'Type', value: 'Public Mint' }
        ],
      });
      console.log('✅ Metadata uploaded:', metadataUri);

      // Armazenar metadataUri para uso posterior
      const currentMetadataUri = metadataUri;

      setStep('minting');
      console.log('🚀 Preparing batch mint transaction...');

      // Use claimTo for Edition Drop (ERC1155) with tokenId and quantity
      const transaction = claimTo({
        contract,
        to: account.address, // receiver
        tokenId: BigInt(0), // Token ID 0 (first edition in the drop)
        quantity: BigInt(quantity), // quantity - creates internal collection of same NFTs
      });

      console.log(`🚀 Minting ${quantity} NFTs to create internal collection...`);

      sendTransaction(transaction, {
        onSuccess: async (result) => {
          console.log('✅ Batch mint successful:', result.transactionHash);
          setTxHash(result.transactionHash);
          
          // Após mint bem-sucedido, fazer uploads seguindo padrão dos outros editores
          try {
            console.log('📤 Starting post-mint uploads...');
            
            // 1. Upload para Cloudinary (mesmo fluxo do Jersey)
            const formData = new FormData();
            formData.append('file', imageBlob, `${metadata.name.replace(/\s+/g, '_')}.png`);
            formData.append('fileName', `public_mint_${Date.now()}`);
            
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error('Failed to upload image to Cloudinary');
            }

            const uploadResult = await uploadResponse.json();
            console.log('✅ Image uploaded to Cloudinary:', uploadResult.url);

            // 2. Save no MongoDB (mesmo padrão do Jersey)
            const nftData = {
              name: metadata.name,
              description: metadata.description,
              imageUrl: uploadResult.url, // Cloudinary URL
              cloudinaryPublicId: uploadResult.publicId,
              prompt: JSON.stringify({ type: 'public_mint', metadata }),
              creatorWallet: account.address,
              transactionHash: result.transactionHash,
              metadataUri: currentMetadataUri,
              attributes: metadata.attributes || [],
              tags: ['public_mint', 'ai_generated', 'edition_drop'],
              metadata: {
                generationMode: 'public_mint',
                quantity: quantity,
                chainId: 80002,
                contractAddress: contract.address,
                tokenId: 0 // Edition Drop usa token ID 0
              }
            };

            const saveResponse = await fetch('/api/jerseys', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(nftData),
            });

            if (!saveResponse.ok) {
              console.error('❌ Failed to save to MongoDB:', await saveResponse.text());
            } else {
              const saveResult = await saveResponse.json();
              console.log('✅ NFT saved to MongoDB:', saveResult);
            }
            
          } catch (uploadError) {
            console.error('❌ Post-mint upload failed:', uploadError);
            // Não falha o mint, apenas loga o erro
          }
          
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
          onClick={() => setIsModalOpen(true)}
          disabled={!imageBlob || !account}
          className="h-12 px-6 text-base font-medium transition-all duration-200 bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052] hover:bg-[#FF0052]/20 disabled:opacity-50 disabled:cursor-not-allowed max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
        >
          <div className="flex items-center gap-2 max-lg:gap-1.5">
            <Users className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
            <span>Mint Batch</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#14101e] border-gray-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Batch Mint NFTs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {step === 'idle' && (
            <>
              <div className="space-y-2">
                <label className="text-white font-medium">
                  Quantity (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 bg-[#0b0518] border border-gray-700 rounded-md text-white"
                />
                <p className="text-xs text-gray-400">
                  Creates an internal collection of {quantity} identical NFTs
                </p>
              </div>
              
              <Button 
                onClick={handleMint}
                disabled={!account || !imageBlob}
                className="w-full bg-[#FF0052] hover:bg-[#8a0129]"
              >
                Mint {quantity} NFT{quantity > 1 ? 's' : ''}
              </Button>
            </>
          )}

          {(step === 'uploading' || step === 'minting') && (
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-b-2 border-[#FF0052] mx-auto"></div>
              <p className="text-sm text-white">{getStepText()}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-400">{getStepText()}</p>
                <p className="text-sm text-gray-400">
                  Created internal collection of {quantity} NFTs
                </p>
              </div>
              {txHash && (
                <a
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm"
                >
                  View on Explorer →
                </a>
              )}
              <Button onClick={handleClose} className="w-full bg-[#FF0052] hover:bg-[#8a0129]">
                Close
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-red-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-red-400">{getStepText()}</p>
                <p className="text-sm text-gray-400 break-words">{error}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleMint} variant="outline" className="w-full border-gray-600">
                  Try Again
                </Button>
                <Button onClick={handleClose} className="w-full bg-[#FF0052] hover:bg-[#8a0129]">
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