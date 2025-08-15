'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, AlertTriangle, Check, Minus, Plus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RequireWallet } from '@/components/RequireWallet';
import { getTransactionUrl } from '@/lib/utils';
import { useWeb3 } from '@/lib/useWeb3';
import { useEngine } from '@/lib/useEngine';
import { IPFSService } from '@/lib/services/ipfs-service';
import { toast } from 'sonner';

interface Props {
  contractAddress: string;
  collectionId?: string;
}

interface ClaimCondition {
  startTimestamp: bigint;
  maxClaimableSupply: bigint;
  supplyClaimed: bigint;
  quantityLimitPerWallet: bigint;
  merkleRoot: string;
  pricePerToken: bigint;
  currency: string;
  metadata: string;
}

export default function LaunchpadMintBox({ contractAddress, collectionId }: Props) {
  // Hooks do Web3 para mint público
  const { 
    isConnected, 
    address, 
    claimLaunchpadNFT,
    getLaunchpadClaimCondition
  } = useWeb3();

  // Hook do Engine para mint gasless (admin)
  const { mintGasless, isLoading: isGaslessMinting } = useEngine();

  // Estados locais
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [mintError, setMintError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [claimCondition, setClaimCondition] = useState<ClaimCondition | null>(null);
  const [isLoadingCondition, setIsLoadingCondition] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Carregar claim condition na inicialização
  useEffect(() => {
    loadClaimCondition();
    checkAdminStatus();
  }, []);

  const loadClaimCondition = async () => {
    try {
      setIsLoadingCondition(true);
      const condition = await getLaunchpadClaimCondition();
      setClaimCondition(condition);
    } catch (error) {
      console.error('❌ Failed to load claim condition:', error);
      setClaimCondition(null);
    } finally {
      setIsLoadingCondition(false);
    }
  };

  const checkAdminStatus = () => {
    // Simples verificação de admin - pode ser expandida
    const adminAddresses = [
      '0x742d35Cc6634C0532925a3b8d98bf4f3fb0b1C4F', // Adicione endereços de admin aqui
    ];
    setIsUserAdmin(adminAddresses.includes(address || ''));
  };

  // Mint público usando claim conditions
  const handlePublicMint = async () => {
    if (!isConnected) {
      toast.error('Conecte a carteira');
      return;
    }
    
    setIsMinting(true);
    setMintStatus('pending');
    setMintError(null);
    
    try {
      const result = await claimLaunchpadNFT(qty);
      console.log('✅ Public mint successful:', result);
      
      setTransactionHash(result.transactionHash);
      setMintStatus('success');
      toast.success(`Mint successful`);

      // Atualizar claim condition após mint
      await loadClaimCondition();

    } catch (err: any) {
      console.error('❌ Public mint failed:', err);
      setMintError(err.message || 'Mint failed');
      setMintStatus('error');
      toast.error(err?.reason || err?.message || 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  };

  // Mint gasless para admin
  const handleGaslessMint = async () => {
    if (!isConnected || !address) {
      toast.error('Conecte a carteira');
      return;
    }

    if (!isUserAdmin) {
      toast.error('Acesso negado: apenas admins podem usar mint gasless');
      return;
    }

    try {
      // Criar metadados básicos para o admin mint
      const metadata = {
        name: `Launchpad NFT #${Date.now()}`,
        description: 'NFT mintado via admin gasless mint',
        image: 'https://via.placeholder.com/300x300.png?text=Launchpad+NFT',
        attributes: [
          { trait_type: 'Type', value: 'Admin Mint' },
          { trait_type: 'Method', value: 'Gasless' },
          { trait_type: 'Timestamp', value: new Date().toISOString() }
        ]
      };

      // Upload metadata para IPFS
      const ipfsResult = await IPFSService.uploadMetadata(metadata);

      // Mint gasless usando Engine
      const result = await mintGasless({
        to: address,
        metadataUri: ipfsResult,
        collectionId: collectionId,
        chainId: 80002,
      });

      console.log('✅ Gasless mint successful:', result);
      toast.success('Admin mint successful');

      // Atualizar claim condition após mint
      await loadClaimCondition();

    } catch (err: any) {
      console.error('❌ Gasless mint failed:', err);
      toast.error(err?.message || 'Gasless mint failed');
    }
  };

  // Helper para formatar preço
  const formatPrice = (priceWei: bigint | string | number) => {
    let priceValue: bigint;
    
    // Handle different input types
    if (typeof priceWei === 'string') {
      priceValue = BigInt(priceWei);
    } else if (typeof priceWei === 'number') {
      priceValue = BigInt(priceWei);
    } else {
      priceValue = priceWei;
    }
    
    if (priceValue === BigInt(0)) return '0 MATIC';
    
    // Converter de wei para MATIC (18 decimais)
    const priceInMatic = Number(priceValue) / Math.pow(10, 18);
    
    // Format with appropriate decimal places
    if (priceInMatic < 0.0001) {
      return `${priceInMatic.toFixed(6)} MATIC`;
    } else if (priceInMatic < 1) {
      return `${priceInMatic.toFixed(4)} MATIC`;
    } else {
      return `${priceInMatic.toFixed(2)} MATIC`;
    }
  };

  // Helper para calcular limite máximo por transação
  const getMaxPerTransaction = () => {
    if (!claimCondition) return 1;
    
    const limitPerWallet = Number(claimCondition.quantityLimitPerWallet);
    const remaining = Number(claimCondition.maxClaimableSupply - claimCondition.supplyClaimed);
    
    return Math.min(limitPerWallet, remaining, 10); // Máximo de 10 por transação
  };

  // Elemento de status de rede
  const NetworkStatus = () => {
    if (!isConnected) return null;
    return (
      <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4 mb-4">
        <div className="text-xs text-gray-500 truncate">{address}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-400">Network</span>
          <span className="text-xs text-green-400">Polygon Amoy</span>
        </div>
        {isUserAdmin && (
          <div className="flex items-center gap-1 mt-1">
            <Crown className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">Admin</span>
          </div>
        )}
      </div>
    );
  };

  // Elemento de informações das claim conditions
  const ClaimConditionInfo = () => {
    if (isLoadingCondition) {
      return (
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading claim conditions...</p>
        </div>
      );
    }

    if (!claimCondition) {
      return (
        <div className="text-center">
          <p className="text-lg text-white font-semibold">Claim conditions não disponíveis</p>
          <p className="text-sm text-gray-400">Tente novamente mais tarde</p>
        </div>
      );
    }

    const totalCost = claimCondition.pricePerToken * BigInt(qty);
    const remaining = Number(claimCondition.maxClaimableSupply - claimCondition.supplyClaimed);
    const maxPerTx = getMaxPerTransaction();

    return (
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-lg text-white font-semibold">Preço por NFT</p>
          <p className="text-2xl font-bold text-[#FF0052]">
            {formatPrice(claimCondition.pricePerToken)}
          </p>
          {qty > 1 && (
            <p className="text-sm text-gray-400 mt-1">
              Total: {formatPrice(totalCost)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center">
            <p className="text-gray-400">Restantes</p>
            <p className="text-white font-medium">{remaining}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Máx por wallet</p>
            <p className="text-white font-medium">{Number(claimCondition.quantityLimitPerWallet)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 bg-[#14101e] border border-gray-700 p-6 rounded-lg">
      <RequireWallet
        title="Connect your Wallet"
        message="Connect your wallet to mint the Launchpad NFT."
        feature="Launchpad Mint"
      >
        <NetworkStatus />
        
        <ClaimConditionInfo />

        {/* Controles de quantidade */}
        {claimCondition && (
          <div className="flex items-center justify-center gap-3">
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => setQty(q => Math.max(1, q - 1))} 
              disabled={qty === 1 || isMinting}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center text-white font-medium">{qty}</span>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => setQty(q => Math.min(getMaxPerTransaction(), q + 1))} 
              disabled={qty >= getMaxPerTransaction() || isMinting}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Botão de mint público */}
        <Button 
          onClick={handlePublicMint} 
          disabled={isMinting || !claimCondition || getMaxPerTransaction() <= 0} 
          className="w-full bg-[#FF0052] hover:bg-[#FF0052]/80 text-white"
        >
          {isMinting ? 'Mintando...' : `Mint ${qty} NFT${qty > 1 ? 's' : ''}`}
        </Button>

        {/* Botão de mint gasless para admin */}
        {isUserAdmin && (
          <>
            <Separator />
            <Button
              onClick={handleGaslessMint}
              disabled={isGaslessMinting || !isConnected}
              className="w-full bg-yellow-600 hover:bg-yellow-600/80 text-white"
              variant="outline"
            >
              <Crown className="w-4 h-4 mr-2" />
              {isGaslessMinting ? 'Mint Gasless...' : 'Mint as Admin (Gasless)'}
            </Button>
          </>
        )}

        {/* Status de mint (feedback visual) */}
        {mintStatus !== 'idle' && (
          <div className="mt-2 space-y-2">
            <div className={`flex items-center space-x-2 ${mintStatus === 'success' ? 'text-green-400' : mintStatus === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
              {mintStatus === 'success' && <Check className="w-4 h-4" />}
              {mintStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
              {mintStatus === 'pending' && (
                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-sm font-medium">
                {mintStatus === 'pending' && 'Mint em andamento...'}
                {mintStatus === 'success' && 'NFT mintado com sucesso!'}
                {mintStatus === 'error' && 'Falha no mint.'}
              </span>
            </div>
            {mintError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                <span className="text-red-400 text-xs">{mintError}</span>
              </div>
            )}
            {mintStatus === 'success' && transactionHash && (
              <div className="text-xs text-gray-400">
                Verifique a transação: <a href={getTransactionUrl(transactionHash)} target="_blank" rel="noopener" className="underline text-cyan-400">Explorer</a>
              </div>
            )}
          </div>
        )}
      </RequireWallet>
    </div>
  );
} 