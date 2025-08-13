'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBatchMint } from '@/hooks/useBatchMint';
import { Copy, Hash, Zap, AlertCircle, CheckCircle, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
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
      // CORREÇÃO: SEMPRE criar novo contrato DropERC721 (gasless para admin, pago para user)
      console.log(`🚀 Creating new DropERC721 contract for ${quantity} NFT(s) - ${isUserAdmin ? 'GASLESS ADMIN' : 'PAID USER'}`);
      await handleDeployAndMintCollection();
      console.log('✅ New contract deployment completed successfully');
    } catch (error) {
      console.error('❌ Smart mint failed:', error);
      toast.error(error instanceof Error ? error.message : 'Mint failed');
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

      setDeployStep('signing-deploy');
      console.log('🔄 ETAPA 1: Backend deploying contract...');

      // Deploy via backend (sua wallet)
      const deployResponse = await fetch('/api/collection/backend-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${collection?.toUpperCase()} Collection #${Date.now()}`,
          description: `AI Collection of ${quantity} NFTs with shared metadata`,
          quantity: quantity,
          imageUri: 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle',
          userWallet: account.address, // Wallet do usuário para royalties
        }),
      });

      if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        throw new Error(`Backend deploy failed: ${deployResponse.status} ${errorText}`);
      }

      const deployResult = await deployResponse.json();
      if (!deployResult.success) {
        throw new Error(`Backend deploy failed: ${deployResult.error}`);
      }

      const newContractAddress = deployResult.contractAddress;
      setContractAddress(newContractAddress);
      console.log('✅ ETAPA 1 completed - Contract deployed by backend:', newContractAddress);
      
      // Define Polygon Amoy chain para usar no frontend
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

      setDeployStep('signing-mint');
      
      // Aguardar um pouco para o backend terminar setup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // ETAPA 2: Claim NFTs - GASLESS para admin, PAGO para usuário
      let mintResult: any;
      
      if (isUserAdmin) {
        console.log('🔄 ETAPA 2: Admin gasless claiming NFTs...');
        
        // Admin: Usar backend gasless claim
        const adminClaimResponse = await fetch('/api/collection/admin-claim', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-admin': 'true'
          },
          body: JSON.stringify({
            contractAddress: newContractAddress,
            to: account.address,
            quantity: quantity,
          }),
        });

        if (!adminClaimResponse.ok) {
          const errorText = await adminClaimResponse.text();
          throw new Error(`Admin gasless claim failed: ${adminClaimResponse.status} ${errorText}`);
        }

        const adminClaimResult = await adminClaimResponse.json();
        if (!adminClaimResult.success) {
          throw new Error(`Admin gasless claim failed: ${adminClaimResult.error}`);
        }

        console.log('✅ Admin gasless claim successful!', adminClaimResult.transactionHash);
        mintResult = { transactionHash: adminClaimResult.transactionHash };
        
      } else {
        console.log('🔄 ETAPA 2: User claiming NFTs (paid)...');
        
        // Usuário comum: Claim pago normal
        const { getContract, sendTransaction } = await import('thirdweb');
        const { claimTo } = await import('thirdweb/extensions/erc721');
        
        const contract = getContract({
          client,
          chain: amoyChain,
          address: newContractAddress,
        });
        
        // Retry logic para claim
        let claimAttempts = 0;
        const maxAttempts = 3;

        
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
      } // End while loop for retry logic
      } // End else block for regular user claim

      console.log('✅ ETAPA 3 completed - NFTs claimed:', mintResult?.transactionHash || 'No transaction hash');
      
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
            transactionHash: mintResult?.transactionHash || '',
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

          // 4. Salvar coleção e NFTs individuais no banco (para marketplace)
          console.log('💾 Saving custom collection and individual NFTs to database...');
          try {
            // Primeiro criar a custom collection
            const customCollectionResponse = await fetch('/api/custom-collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `${collection?.toUpperCase()} Collection #${Date.now()}`,
                description: `AI Generated ${collection} collection with ${quantity} NFTs`,
                imageUrl: cloudinaryUrl,
                category: collection || 'jersey', // jersey, stadium, badge
                contractAddress: newContractAddress,
                totalSupply: quantity,
                price: "0",
                creatorWallet: account.address,
                teamName: collection || '',
                season: new Date().getFullYear().toString(),
                subcategoryType: 'ai_generated'
              })
            });

            if (customCollectionResponse.ok) {
              const customCollectionResult = await customCollectionResponse.json();
              const customCollectionId = customCollectionResult.id;

              // Agora salvar cada NFT individual mintada
              for (let tokenId = 0; tokenId < quantity; tokenId++) {
                await fetch('/api/custom-collections/mint', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    customCollectionId: customCollectionId,
                    tokenId: tokenId.toString(),
                    metadataUrl: ipfsMetadataUrl,
                    imageUrl: cloudinaryUrl,
                    transactionHash: mintResult?.transactionHash || 'batch_mint_user_paid',
                    minterAddress: account.address,
                    price: "0"
                  })
                });
              }
              
              console.log(`✅ Saved custom collection and ${quantity} individual NFTs to marketplace database`);
            }
          } catch (nftSaveError) {
            console.error('❌ Error saving custom collection/NFTs:', nftSaveError);
            // Não falhar a operação por isso
          }
        } else {
          const errorText = await saveResponse.text();
          console.error('❌ Failed to save collection to database:', saveResponse.status, errorText);
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
      
      <DialogContent className="bg-[#14101e] border-gray-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#A20131]" />
            Mint NFTs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-white">NFT Name</Label>
            <div className="p-3 bg-[#0b0518] rounded-lg border border-gray-700">
              <p className="text-white text-sm">{nftName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Recipient</Label>
            <div className="p-3 bg-[#0b0518] rounded-lg border border-gray-700">
              <p className="text-white text-sm font-mono">{to.slice(0, 6)}...{to.slice(-4)}</p>
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-white">Quantity (1-100)</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={deployStep !== 'idle' || quantity <= 1}
                  className="bg-[#0b0518] border-gray-700 text-white hover:bg-gray-800 h-10 w-10 shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity(1);
                    } else {
                      const numVal = parseInt(val);
                      if (!isNaN(numVal)) {
                        setQuantity(Math.max(1, Math.min(100, numVal)));
                      }
                    }
                  }}
                  disabled={deployStep !== 'idle'}
                  className="bg-[#0b0518] border-gray-700 text-white text-center flex-1 min-w-0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(100, quantity + 1))}
                  disabled={deployStep !== 'idle' || quantity >= 100}
                  className="bg-[#0b0518] border-gray-700 text-white hover:bg-gray-800 h-10 w-10 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-400 text-center">
                Use os botões +/- ou digite diretamente
              </div>
            </div>

          {deployStep !== 'idle' && (
            <div className="space-y-3">
              <Label className="text-white">Collection Progress</Label>
              <div className="p-3 bg-[#0b0518] rounded border border-gray-700 space-y-2">
                <div className={`flex items-center gap-2 text-xs ${
                  deployStep === 'preparing' || deployStep === 'signing-deploy' ? 'text-yellow-400' : 
                  ['signing-mint', 'completed'].includes(deployStep) ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {['signing-mint', 'completed'].includes(deployStep) ? '✅' : 
                   deployStep === 'preparing' || deployStep === 'signing-deploy' ? '🔄' : '⏳'}
                  <span>Step 1: Backend deploying contract (no signature required)</span>
            </div>
              
                <div className={`flex items-center gap-2 text-xs ${
                  deployStep === 'signing-mint' ? 'text-yellow-400' : 
                  deployStep === 'completed' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {deployStep === 'completed' ? '✅' : 
                   deployStep === 'signing-mint' ? '🔄' : '⏳'}
                  <span>Step 2: User signs mint for {quantity} NFTs</span>
                </div>
              </div>

              {contractAddress && (
                <div className="p-2 bg-[#0b0518] rounded border border-green-500/30">
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

          <div className="flex space-x-3 pt-4">
            {deployStep !== 'completed' ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={deployStep !== 'idle'}
                  className="flex-1 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBatchMint}
                  disabled={deployStep !== 'idle' || !to}
                  className="flex-1 bg-[#A20131] hover:bg-[#8a0129]"
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
              </>
            ) : (
              <Button onClick={handleClose} className="w-full bg-[#A20131] hover:bg-[#8a0129]">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
