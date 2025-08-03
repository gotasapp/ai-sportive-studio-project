'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBatchMint } from '@/hooks/useBatchMint';
import { Copy, Hash, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { deployERC721Contract } from 'thirdweb/deploys';
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { IPFSService } from '@/lib/services/ipfs-service';

interface BatchMintDialogProps {
  trigger: React.ReactNode;
  to: string;
  metadataUri: string;
  nftName: string;
  collection?: 'jerseys' | 'stadiums' | 'badges';
  disabled?: boolean;
  isUserAdmin?: boolean;
  generatedImageBlob?: Blob;
}

export function BatchMintDialog({ 
  trigger, 
  to, 
  metadataUri, 
  nftName, 
  collection,
  disabled = false,
  isUserAdmin = false,
  generatedImageBlob 
}: BatchMintDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(isUserAdmin ? 5 : 1);
  const [deployStep, setDeployStep] = useState<'idle' | 'preparing' | 'signing-deploy' | 'deployed' | 'setting-claims' | 'signing-mint' | 'completed'>('idle');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  
  const account = useActiveAccount();
  
  const {
    isBatchMinting,
    batchMintProgress,
    batchMintResult,
    batchMintError,
    batchMintGasless,
    resetBatchMint,
  } = useBatchMint();

  const handleBatchMint = async () => {
    console.log('🎯 SMART MINT called with:', { to, metadataUri, quantity, collection, isUserAdmin });
    
    try {
      if (quantity === 1) {
        console.log('🎯 Single NFT detected - using current contract');
        await batchMintGasless({ to, metadataUri, quantity: 1, collection });
        console.log('✅ Single NFT mint completed successfully');
      } else {
        console.log(`🚀 Collection detected (${quantity} units) - starting deploy + mint process`);
        await handleDeployAndMintCollection();
      }
    } catch (error) {
      console.error('❌ Smart mint failed:', error);
    }
  };

  const handleDeployAndMintCollection = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setDeployStep('preparing');
    setDeployError(null);
    setContractAddress(null);

    try {
      // ETAPA 1: Deploy novo contrato DropERC721
      console.log('🔄 ETAPA 1: Deploying new DropERC721 contract...');
      console.log('📋 Account address:', account.address);
      console.log('📋 Collection:', collection, 'Quantity:', quantity);
      
      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
      });

      // Define Polygon Amoy chain com RPC Ankr
      const amoyChain = defineChain({
        id: 80002,
        name: 'Polygon Amoy Testnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpc: 'https://rpc.ankr.com/polygon_amoy/5b2d60918c8135da4798d0d735c2b2d483d3e3d8992ab6cf34c53b0fd81803ef',
        blockExplorers: [
          {
            name: 'PolygonScan',
            url: 'https://amoy.polygonscan.com',
          },
        ],
      });

      setDeployStep('signing-deploy');
      console.log('🔄 ETAPA 1: User signing contract deployment...');

      const newContractAddress = await deployERC721Contract({
        client,
        chain: amoyChain,
        account,
        type: "DropERC721",
        params: {
          name: `${collection?.toUpperCase()} Collection #${Date.now()}`,
          symbol: `${collection?.toUpperCase()}${Date.now()}`,
          description: `AI Collection of ${quantity} NFTs with shared metadata`,
          image: 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle',
          primary_sale_recipient: account.address,
          royalty_recipient: account.address,
          royalty_bps: 500, // 5%
        },
      });

      setContractAddress(newContractAddress);
      console.log('✅ ETAPA 1 completed - Contract deployed:', newContractAddress);
      
      setDeployStep('setting-claims');
      console.log('🔄 ETAPA 2: Setting up claim conditions...');
      
      // ETAPA 2: Configurar claim conditions
      const { getContract } = await import('thirdweb');
      const { setClaimConditions } = await import('thirdweb/extensions/erc721');
      const { sendTransaction } = await import('thirdweb');
      
      const contract = getContract({
        client,
        chain: amoyChain,
        address: newContractAddress,
      });

      const claimConditionTx = setClaimConditions({
        contract,
        phases: [{
          startTime: new Date(),
          maxClaimableSupply: BigInt(quantity),
          maxClaimablePerWallet: BigInt(quantity),
          price: "0", // Free
          currency: "0x0000000000000000000000000000000000000000", // Native token
        }],
      });

      await sendTransaction({
        transaction: claimConditionTx,
        account,
      });

      console.log('✅ ETAPA 2 completed - Claim conditions configured');
      
      setDeployStep('signing-mint');
      console.log('🔄 ETAPA 3: Lazy minting tokens...');
      
      // ETAPA 3A: Lazy mint tokens primeiro
      const { lazyMint } = await import('thirdweb/extensions/erc721');
      
      const lazyMintTx = lazyMint({
        contract,
        nfts: Array(quantity).fill({
          name: `${collection?.toUpperCase()} #`,
          description: `AI Generated ${collection} NFT`,
          image: 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle',
        }),
      });

      await sendTransaction({
        transaction: lazyMintTx,
        account,
      });

      console.log('✅ ETAPA 3A completed - Tokens lazy minted');
      
      console.log('🔄 ETAPA 3B: User claiming NFTs...');
      
      // Aguardar um pouco para lazy mint propagar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ETAPA 3B: Claim NFTs no novo contrato
      const { claimTo } = await import('thirdweb/extensions/erc721');
      
      // Retry logic para claim
      let claimAttempts = 0;
      const maxAttempts = 3;
      let mintResult;
      
      while (claimAttempts < maxAttempts) {
        try {
          console.log(`🔄 Claim attempt ${claimAttempts + 1}/${maxAttempts}...`);
          
          const mintTransaction = claimTo({
            contract,
            to: account.address,
            quantity: BigInt(quantity),
          });

          mintResult = await sendTransaction({
            transaction: mintTransaction,
            account,
          });
          
          console.log('✅ Claim successful!');
          break; // Sucesso, sair do loop
          
        } catch (claimError: any) {
          claimAttempts++;
          console.log(`❌ Claim attempt ${claimAttempts} failed:`, claimError.message);
          
          if (claimAttempts >= maxAttempts) {
            throw claimError; // Último attempt falhou
          }
          
          console.log('⏳ Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre attempts
        }
      }

      console.log('✅ ETAPA 3 completed - NFTs claimed:', mintResult.transactionHash);
      
      // ETAPA 4: Upload para IPFS + Cloudinary + Salvar no banco
      console.log('💾 Uploading and saving collection...');
      try {
        let cloudinaryUrl = 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle';
        let cloudinaryPublicId = null;
        let ipfsImageUrl = 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle';
        let ipfsMetadataUrl = 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle';

        // 1. Upload para Cloudinary (se temos a imagem)
        if (generatedImageBlob) {
          console.log('📤 Uploading image to Cloudinary...');
          const formData = new FormData();
          formData.append('file', generatedImageBlob, `${collection}_collection_${Date.now()}.png`);
          formData.append('fileName', `collection_${collection}_${quantity}_${Date.now()}`);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            cloudinaryUrl = uploadResult.url;
            cloudinaryPublicId = uploadResult.publicId;
            console.log('✅ Image uploaded to Cloudinary:', cloudinaryUrl);

            // 2. Upload para IPFS
            console.log('📤 Uploading to IPFS...');
            const collectionName = `${collection?.toUpperCase()} Collection #${Date.now()}`;
            const collectionDescription = `AI Generated ${collection} collection with ${quantity} NFTs. Each NFT shares the same metadata and artwork.`;
            
            const ipfsResult = await IPFSService.uploadComplete(
              generatedImageBlob,
              collectionName,
              collectionDescription,
              collection || 'AI Collection',
              'DropERC721',
              'Collection',
              quantity.toString()
            );

            ipfsImageUrl = ipfsResult.imageUrl;
            ipfsMetadataUrl = ipfsResult.metadataUrl;
            console.log('✅ IPFS upload completed:', ipfsMetadataUrl);
          }
        }

        // 3. Salvar no banco de dados
        console.log('💾 Saving collection to database...');
        const saveResponse = await fetch('/api/jerseys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${collection?.toUpperCase()} Collection #${Date.now()}`,
            description: `AI Generated ${collection} collection with ${quantity} NFTs`,
            imageUrl: cloudinaryUrl, // Cloudinary URL for database
            cloudinaryPublicId: cloudinaryPublicId,
            prompt: JSON.stringify({ 
              type: 'batch_collection',
              collection: collection,
              quantity: quantity,
              contractAddress: newContractAddress,
              ipfsImageUrl: ipfsImageUrl,
              ipfsMetadataUrl: ipfsMetadataUrl
            }),
            creatorWallet: account.address,
            transactionHash: mintResult.transactionHash,
            metadataUri: ipfsMetadataUrl, // IPFS metadata URL
            attributes: [
              { trait_type: 'Type', value: 'AI Collection' },
              { trait_type: 'Quantity', value: quantity.toString() },
              { trait_type: 'Collection', value: collection || 'Unknown' },
              { trait_type: 'Contract Type', value: 'DropERC721' }
            ],
            tags: ['ai_generated', 'batch_collection', 'drop_erc721'],
            metadata: {
              generationMode: 'batch_collection',
              quantity: quantity,
              chainId: 80002,
              contractAddress: newContractAddress,
              tokenId: 0, // Collection usa token ID 0
              collectionType: 'DropERC721',
              deployedAt: new Date().toISOString(),
              ipfsImageUrl: ipfsImageUrl,
              ipfsMetadataUrl: ipfsMetadataUrl,
              cloudinaryUrl: cloudinaryUrl
            }
          })
        });

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log('✅ Collection saved to database:', saveResult);
        } else {
          console.error('❌ Failed to save collection to database');
        }
      } catch (saveError) {
        console.error('❌ Error uploading/saving collection:', saveError);
        // Não falhar o mint por isso
      }
      
      setDeployStep('completed');
      console.log('🎉 Collection deployed, minted and saved successfully!');

    } catch (error) {
      console.error('❌ Collection deploy failed:', error);
      setDeployError(error instanceof Error ? error.message : 'Deploy failed');
      setDeployStep('idle');
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetBatchMint();
    setDeployStep('idle');
    setDeployError(null);
    setContractAddress(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-[#030303] border border-[#FDFDFD]/10">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#A20131]" />
            Mint NFTs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[#FDFDFD]/70">NFT Name</Label>
            <div className="p-3 bg-[#14101e] rounded-lg border border-[#FDFDFD]/10">
              <p className="text-[#FDFDFD] text-sm">{nftName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#FDFDFD]/70">Recipient</Label>
            <div className="p-3 bg-[#14101e] rounded-lg border border-[#FDFDFD]/10">
              <p className="text-[#FDFDFD] text-sm font-mono">{to.slice(0, 6)}...{to.slice(-4)}</p>
            </div>
          </div>

            <div className="space-y-2">
            <Label htmlFor="quantity" className="text-[#FDFDFD]/70">Quantity (1-100)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              disabled={deployStep !== 'idle'}
                className="bg-[#14101e] border-[#FDFDFD]/10 text-[#FDFDFD]"
              />
            </div>

          {deployStep !== 'idle' && (
            <div className="space-y-3">
              <Label className="text-[#FDFDFD]/70">Collection Progress</Label>
              <div className="p-3 bg-[#0a0a0a] rounded border border-[#FDFDFD]/10 space-y-2">
                <div className={`flex items-center gap-2 text-xs ${
                  deployStep === 'preparing' || deployStep === 'signing-deploy' ? 'text-yellow-400' : 
                  ['setting-claims', 'signing-mint', 'completed'].includes(deployStep) ? 'text-green-400' : 'text-[#FDFDFD]/50'
                }`}>
                  {['setting-claims', 'signing-mint', 'completed'].includes(deployStep) ? '✅' : 
                   deployStep === 'preparing' || deployStep === 'signing-deploy' ? '🔄' : '⏳'}
                  <span>Step 1: Deploy collection contract</span>
            </div>
                
                <div className={`flex items-center gap-2 text-xs ${
                  deployStep === 'setting-claims' ? 'text-yellow-400' : 
                  ['signing-mint', 'completed'].includes(deployStep) ? 'text-green-400' : 'text-[#FDFDFD]/50'
                }`}>
                  {['signing-mint', 'completed'].includes(deployStep) ? '✅' : 
                   deployStep === 'setting-claims' ? '🔄' : '⏳'}
                  <span>Step 2: Configure collection settings</span>
              </div>
              
                <div className={`flex items-center gap-2 text-xs ${
                  deployStep === 'signing-mint' ? 'text-yellow-400' : 
                  deployStep === 'completed' ? 'text-green-400' : 'text-[#FDFDFD]/50'
                }`}>
                  {deployStep === 'completed' ? '✅' : 
                   deployStep === 'signing-mint' ? '🔄' : '⏳'}
                  <span>Step 3: Prepare & claim {quantity} NFTs</span>
                </div>
              </div>

              {contractAddress && (
                <div className="p-2 bg-[#0a0a0a] rounded border border-green-500/30">
                  <p className="text-xs text-green-400">Collection Contract: {contractAddress}</p>
                </div>
              )}
            </div>
          )}

          {deployError && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
              <p className="text-xs text-red-400">{deployError}</p>
            </div>
          )}

          <div className="flex gap-3">
            {deployStep !== 'completed' ? (
              <>
                <Button
                  onClick={handleBatchMint}
                  disabled={deployStep !== 'idle' || !to}
                  className="flex-1 bg-[#A20131] hover:bg-[#A20131]/80 text-white"
                >
                  {deployStep === 'idle' ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {quantity > 1 ? `Create Collection & Mint ${quantity} NFTs` : `Mint ${quantity} NFT`}
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {deployStep === 'preparing' && 'Preparing deploy...'}
                      {deployStep === 'signing-deploy' && 'Sign contract deploy...'}
                      {deployStep === 'setting-claims' && 'Configuring collection...'}
                      {deployStep === 'signing-mint' && 'Preparing & claiming NFTs...'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={deployStep !== 'idle' && deployStep !== 'completed'}
                  className="border-[#FDFDFD]/10 text-[#FDFDFD]"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full bg-[#A20131] hover:bg-[#A20131]/80 text-white">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
