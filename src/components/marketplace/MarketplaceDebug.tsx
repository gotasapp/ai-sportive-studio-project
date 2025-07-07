'use client';

import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MARKETPLACE_CONTRACTS, NFT_CONTRACTS } from '@/lib/marketplace-config';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy,
  ExternalLink,
  Wallet,
  Network
} from 'lucide-react';

export default function MarketplaceDebug() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const [showDebug, setShowDebug] = useState(false);

  const chainId = chain?.id || 0;
  const marketplaceContract = MARKETPLACE_CONTRACTS[chainId];
  const nftContract = NFT_CONTRACTS[chainId];

  const getChainName = (id: number) => {
    switch (id) {
      case 88888: return 'CHZ Mainnet';
      case 88882: return 'CHZ Testnet';
      case 137: return 'Polygon Mainnet';
      case 80002: return 'Polygon Amoy';
      default: return `Chain ${id}`;
    }
  };

  const getExplorerUrl = (chainId: number, address: string) => {
    switch (chainId) {
      case 88888:
      case 88882:
        return `https://scan.chiliz.com/address/${address}`;
      case 137:
        return `https://polygonscan.com/address/${address}`;
      case 80002:
        return `https://amoy.polygonscan.com/address/${address}`;
      default:
        return '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowDebug(true)}
          size="sm"
          variant="outline"
          className="bg-[#333333]/80 border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#333333]"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="cyber-card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Marketplace Debug
            </CardTitle>
            <Button
              onClick={() => setShowDebug(false)}
              size="sm"
              variant="ghost"
              className="text-[#FDFDFD]/70 hover:text-[#FDFDFD]"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#FDFDFD]/70">Conectado:</span>
                <Badge className={account ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {account ? 'Sim' : 'Não'}
                </Badge>
              </div>
              {account && (
                <div className="flex items-center justify-between">
                  <span className="text-[#FDFDFD]/70">Endereço:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-[#A20131] bg-[#333333]/20 px-2 py-1 rounded">
                      {account.address.slice(0, 6)}...{account.address.slice(-4)}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(account.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-[#FDFDFD]/10" />

          {/* Network Info */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3 flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#FDFDFD]/70">Rede Atual:</span>
                <Badge className="bg-blue-500/20 text-blue-400">
                  {getChainName(chainId)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#FDFDFD]/70">Chain ID:</span>
                <code className="text-xs text-[#A20131] bg-[#333333]/20 px-2 py-1 rounded">
                  {chainId}
                </code>
              </div>
            </div>
          </div>

          <Separator className="bg-[#FDFDFD]/10" />

          {/* Contract Status */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3">Contract Status</h3>
            
            {/* Marketplace Contract */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#FDFDFD]/70">Marketplace V3:</span>
                    {marketplaceContract ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  {marketplaceContract ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-[#A20131] bg-[#333333]/20 px-2 py-1 rounded">
                        {marketplaceContract.slice(0, 10)}...{marketplaceContract.slice(-8)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(marketplaceContract)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {getExplorerUrl(chainId, marketplaceContract) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => window.open(getExplorerUrl(chainId, marketplaceContract), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400">
                      Contrato não configurado para esta rede
                    </p>
                  )}
                </div>
              </div>

              {/* NFT Contract */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                     <span className="text-[#FDFDFD]/70">NFT Collection Universal:</span>
                     {nftContract ? (
                       <CheckCircle className="h-4 w-4 text-green-400" />
                     ) : (
                       <XCircle className="h-4 w-4 text-red-400" />
                     )}
                   </div>
                   {nftContract ? (
                     <div className="flex items-center gap-2">
                       <code className="text-xs text-[#A20131] bg-[#333333]/20 px-2 py-1 rounded">
                         {nftContract.slice(0, 10)}...{nftContract.slice(-8)}
                       </code>
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-6 w-6"
                         onClick={() => copyToClipboard(nftContract)}
                       >
                         <Copy className="h-3 w-3" />
                       </Button>
                       {getExplorerUrl(chainId, nftContract) && (
                         <Button
                           size="icon"
                           variant="ghost"
                           className="h-6 w-6"
                           onClick={() => window.open(getExplorerUrl(chainId, nftContract), '_blank')}
                         >
                           <ExternalLink className="h-3 w-3" />
                         </Button>
                       )}
                     </div>
                  ) : (
                    <p className="text-xs text-red-400">
                      Contrato não configurado para esta rede
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-[#FDFDFD]/10" />

          {/* Configuration Guide */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Configuração Necessária
            </h3>
            
            {!marketplaceContract && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                <p className="text-red-400 text-sm mb-2">
                  ⚠️ Contrato Marketplace não configurado
                </p>
                <p className="text-[#FDFDFD]/70 text-xs">
                  Adicione no seu .env.local:
                </p>
                <code className="text-xs text-[#A20131] bg-[#333333]/20 px-2 py-1 rounded block mt-1">
                  NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET=0xSEU_ENDERECO_AQUI
                </code>
              </div>
            )}

                         {marketplaceContract && nftContract && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-400 text-sm mb-1">
                  ✅ Configuração Completa!
                </p>
                <p className="text-[#FDFDFD]/70 text-xs">
                  Marketplace pronto para testes na {getChainName(chainId)}
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-[#FDFDFD]/10" />

          {/* Test Actions */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3">Ações de Teste</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                size="sm" 
                variant="outline"
                className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/5"
                onClick={() => {
                  console.log('🔍 Marketplace Debug Info:', {
                    account: account?.address,
                    chainId,
                                         contracts: {
                       marketplace: marketplaceContract,
                       nft: nftContract
                     },
                    envVars: {
                      clientId: !!process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
                      walletConnect: !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
                    }
                  });
                }}
              >
                Console Log
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/5"
                onClick={() => window.open('/marketplace', '_blank')}
              >
                Abrir Marketplace
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/5"
                onClick={() => window.open('/marketplace/dashboard', '_blank')}
              >
                Dashboard
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/5"
                onClick={() => window.open('https://faucet.polygon.technology/', '_blank')}
              >
                MATIC Faucet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 