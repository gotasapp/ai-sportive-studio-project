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

interface BatchMintDialogProps {
  trigger: React.ReactNode;
  to: string;
  metadataUri: string;
  nftName: string;
  collection?: 'jerseys' | 'stadiums' | 'badges';
  disabled?: boolean;
  isUserAdmin?: boolean;
}

export function BatchMintDialog({ 
  trigger, 
  to, 
  metadataUri, 
  nftName, 
  collection,
  disabled = false,
  isUserAdmin = false 
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
      // ETAPA 1: Preparar transação de deploy no backend
      console.log('🔄 ETAPA 1: Preparing contract deploy transaction...');
      const prepareResponse = await fetch('/api/prepare-collection-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${collection?.toUpperCase()} Collection`,
          symbol: collection?.toUpperCase(),
          description: `AI Collection of ${quantity} NFTs with shared metadata.`,
          recipient: to,
          supply: quantity,
        }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(`Deploy preparation failed: ${errorData.error}`);
      }
      
      const { transaction: deployTx } = await prepareResponse.json();
      console.log('✅ ETAPA 1 completed - Deploy transaction prepared.');

      // ETAPA 2: Usuário assina o deploy do contrato
      setDeployStep('signing-deploy');
      console.log('🔄 ETAPA 2: User signing contract deployment...');
      const { sendAndConfirmTransaction } = await import('thirdweb/transaction');
      const deployResult = await sendAndConfirmTransaction({ transaction: deployTx, account });
      
      const newContractAddress = deployResult.receipt.contractAddress;
      if (!newContractAddress) {
        throw new Error("Failed to get contract address from deploy receipt.");
      }
      setContractAddress(newContractAddress);
      console.log('✅ ETAPA 2 completed - Contract deployed:', newContractAddress);
      
      setDeployStep('completed'); // Foco no deploy
      console.log('🎉 Collection contract deployed successfully!');

    } catch (error) {
      console.error('❌ Collection deploy failed:', error);
      setDeployError(error instanceof Error ? error.message : 'Deploy failed during user signing or execution.');
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
              <Label className="text-[#FDFDFD]/70">Deploy Progress</Label>
              <div className="p-3 bg-[#0a0a0a] rounded border border-[#FDFDFD]/10 space-y-2">
                <div className={`flex items-center gap-2 text-xs ${deployStep === 'preparing' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {deployStep === 'preparing' ? '🔄' : '✅'}
                  <span>Step 1: Preparing contract deploy...</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${deployStep === 'signing-deploy' ? 'text-yellow-400' : deployStep !== 'preparing' ? 'text-green-400' : 'text-[#FDFDFD]/50'}`}>
                  {deployStep === 'preparing' ? '⏳' : deployStep === 'signing-deploy' ? '🔄' : '✅'}
                  <span>Step 2: Sign contract deploy in your wallet...</span>
                </div>
              </div>
              {contractAddress && (
                <div className="p-2 bg-[#0a0a0a] rounded border border-green-500/30">
                  <p className="text-xs text-green-400">Deployed to: {contractAddress}</p>
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
                      {quantity > 1 ? `Deploy & Mint ${quantity}` : `Mint ${quantity} NFT`}
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {deployStep === 'preparing' && 'Preparing...'}
                      {deployStep === 'signing-deploy' && 'Check Wallet...'}
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
