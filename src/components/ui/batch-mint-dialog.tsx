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

interface BatchMintDialogProps {
  trigger: React.ReactNode;
  to: string;
  metadataUri: string;
  nftName: string;
  collection?: 'jerseys' | 'stadiums' | 'badges';
  disabled?: boolean;
}

export function BatchMintDialog({ 
  trigger, 
  to, 
  metadataUri, 
  nftName, 
  collection,
  disabled = false 
}: BatchMintDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(5);
  
  const {
    isBatchMinting,
    batchMintProgress,
    batchMintResult,
    batchMintError,
    batchMintGasless,
    resetBatchMint,
  } = useBatchMint();

  const handleBatchMint = async () => {
    console.log('🎯 handleBatchMint called with:', { to, metadataUri, quantity, collection });
    try {
      console.log('🚀 Calling batchMintGasless...');
      await batchMintGasless({
        to,
        metadataUri,
        quantity,
        collection,
      });
      console.log('✅ batchMintGasless completed successfully');
    } catch (error) {
      console.error('❌ Batch mint failed:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetBatchMint();
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
            Batch Mint NFTs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Info */}
          <div className="space-y-2">
            <Label className="text-[#FDFDFD]/70">NFT Name</Label>
            <div className="p-3 bg-[#14101e] rounded-lg border border-[#FDFDFD]/10">
              <p className="text-[#FDFDFD] text-sm">{nftName}</p>
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <Label className="text-[#FDFDFD]/70">Recipient</Label>
            <div className="p-3 bg-[#14101e] rounded-lg border border-[#FDFDFD]/10">
              <p className="text-[#FDFDFD] text-sm font-mono">
                {to.slice(0, 6)}...{to.slice(-4)}
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          {!batchMintResult && (
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-[#FDFDFD]/70">
                Quantity (1-100)
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                disabled={isBatchMinting}
                className="bg-[#14101e] border-[#FDFDFD]/10 text-[#FDFDFD]"
              />
              <p className="text-xs text-[#FDFDFD]/50">
                Each NFT will be minted with the same metadata
              </p>
            </div>
          )}

          {/* Progress */}
          {batchMintProgress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#FDFDFD]/70">Progress</Label>
                <Badge variant="outline" className="text-[#A20131] border-[#A20131]">
                  {batchMintProgress.current}/{batchMintProgress.total}
                </Badge>
              </div>
              <Progress 
                value={batchMintProgress.percentage} 
                className="h-2"
              />
              <p className="text-xs text-[#FDFDFD]/50 text-center">
                {batchMintProgress.percentage.toFixed(1)}% completed
              </p>
            </div>
          )}

          {/* Results */}
          {batchMintResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <Label className="text-green-400">Batch Mint Completed</Label>
              </div>
              
              <div className="p-4 bg-[#14101e] rounded-lg border border-[#FDFDFD]/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#FDFDFD]/70">Successful:</span>
                  <span className="text-green-400 font-semibold">
                    {batchMintResult.successfulMints}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FDFDFD]/70">Failed:</span>
                  <span className="text-red-400 font-semibold">
                    {batchMintResult.failedMints}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FDFDFD]/70">Total Requested:</span>
                  <span className="text-[#FDFDFD] font-semibold">
                    {batchMintResult.totalRequested}
                  </span>
                </div>
              </div>

              {/* Queue IDs */}
              {batchMintResult.results.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[#FDFDFD]/70">Queue IDs</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {batchMintResult.results.map((result) => (
                      <div 
                        key={result.queueId}
                        className="flex items-center justify-between p-2 bg-[#14101e]/50 rounded text-xs"
                      >
                        <span className="text-[#FDFDFD]/70">#{result.mintNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#FDFDFD] font-mono">
                            {result.queueId.slice(0, 8)}...
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(result.queueId)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {batchMintError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-400 text-sm">{batchMintError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!batchMintResult ? (
              <>
                <Button
                  onClick={handleBatchMint}
                  disabled={isBatchMinting || !to}
                  className="flex-1 bg-[#A20131] hover:bg-[#A20131]/80 text-white"
                >
                  {isBatchMinting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Mint {quantity} NFTs
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isBatchMinting}
                  className="border-[#FDFDFD]/10 text-[#FDFDFD]"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleClose}
                className="w-full bg-[#A20131] hover:bg-[#A20131]/80 text-white"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 