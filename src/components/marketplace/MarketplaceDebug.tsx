'use client';

import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { polygonAmoy } from 'thirdweb/chains';
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
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const handleSwitchToAmoy = async () => {
    try {
      await switchChain(polygonAmoy);
      console.log('✅ Network switched to Polygon Amoy');
    } catch (error) {
      console.error('❌ Error switching network:', error);
    }
  };

  const chainId = activeChain?.id || 0;
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

  const [showDebug, setShowDebug] = useState(false);

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

  const testPriceValidation = () => {
    console.log('🧪 TESTE DE VALIDAÇÃO DE PREÇOS:');
    
    const testPrices = [
      '1.234 MATIC',
      '0.5 MATIC', 
      'Not for sale',
      'Not listed',
      '0 MATIC',
      '999 MATIC',
      '1000000 MATIC', // Should be invalid
      '',
      undefined,
      null
    ];
    
    testPrices.forEach(price => {
      const isValid = isValidPrice(price as any);
      console.log(`📋 Price: "${price}" -> Valid: ${isValid}`);
    });
  };

  const checkBlockchainListings = async () => {
    try {
      console.log('🔍 VERIFICANDO LISTAGENS NO BLOCKCHAIN...');
      
      if (!activeChain) {
        console.error('❌ Chain não conectada');
        return;
      }
      
      // 1. Verificar total de listagens
      const { MarketplaceService } = await import('@/lib/services/marketplace-service');
      const totalListings = await MarketplaceService.getTotalListings(activeChain.id);
      console.log('📊 Total de listagens no contrato:', totalListings.toString());
      
      // 2. Buscar todas as listagens válidas
      const validListings = await MarketplaceService.getAllValidListings(activeChain.id);
      console.log('📋 Listagens válidas encontradas:', validListings.length);
      
      // 3. Verificar cada listagem individualmente
      if (validListings.length > 0) {
        console.log('🔍 DETALHES DAS LISTAGENS:');
        validListings.forEach((listing, index) => {
          const priceInEther = Number(listing.pricePerToken) / Math.pow(10, 18);
          console.log(`📋 Listagem ${index + 1}:`, {
            listingId: listing.listingId.toString(),
            creator: listing.listingCreator,
            tokenId: listing.tokenId.toString(),
            priceInWei: listing.pricePerToken.toString(),
            priceInEther: priceInEther.toFixed(6),
            status: listing.status,
            assetContract: listing.assetContract
          });
        });
      } else {
        console.log('📭 Nenhuma listagem válida encontrada no blockchain');
      }
      
      // 4. Se há total mas não há válidas, investigar listagens específicas
      if (Number(totalListings) > 0 && validListings.length === 0) {
        console.log('🔍 INVESTIGANDO LISTAGENS INDIVIDUAIS...');
        for (let i = 0; i < Math.min(Number(totalListings), 5); i++) {
          try {
            const listing = await MarketplaceService.getListing(activeChain.id, i.toString());
            console.log(`📋 Listagem ${i}:`, listing);
          } catch (error) {
            console.log(`❌ Erro na listagem ${i}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar blockchain:', error);
    }
  };

  const investigateSpecificListing = async (listingId: string) => {
    try {
      console.log(`🔍 INVESTIGANDO LISTAGEM ESPECÍFICA: ${listingId}`);
      
      if (!activeChain) {
        console.error('❌ Chain não conectada');
        return;
      }
      
      const { MarketplaceService } = await import('@/lib/services/marketplace-service');
      
      try {
        const listing = await MarketplaceService.getListing(activeChain.id, listingId);
        console.log('📋 DADOS COMPLETOS DA LISTAGEM:', listing);
        
        const priceInWei = listing.pricePerToken;
        const priceInEther = Number(priceInWei) / Math.pow(10, 18);
        
        console.log('💰 ANÁLISE DETALHADA DO PREÇO:', {
          priceInWei: priceInWei.toString(),
          priceInEther: priceInEther,
          priceFormatted: `${priceInEther.toFixed(6)} MATIC`,
          isAstronomical: priceInEther > 1000,
          hexValue: '0x' + priceInWei.toString(16),
          binaryLength: priceInWei.toString(2).length
        });
        
      } catch (error) {
        console.error(`❌ Erro ao buscar listagem ${listingId}:`, error);
      }
      
    } catch (error) {
      console.error('❌ Erro geral:', error);
    }
  };

  const testPriceConversion = () => {
    console.log('🧪 TESTE DE CONVERSÃO DE PREÇOS:');
    
    const testPrices = [
      '0.001',
      '0.1', 
      '1',
      '10',
      '100',
      '999',
      '1000',
      '1001', // Should fail
      '0.000000001', // Very small
      '-1', // Should fail
      'abc', // Should fail
      ''
    ];
    
    testPrices.forEach(price => {
      try {
        const { priceToWei } = require('@/lib/marketplace-config');
        const weiValue = priceToWei(price);
        const backToEther = Number(weiValue) / 1e18;
        console.log(`✅ Price: "${price}" -> ${weiValue.toString()} wei -> ${backToEther.toFixed(6)} MATIC`);
      } catch (error: any) {
        console.log(`❌ Price: "${price}" -> ERROR: ${error.message}`);
      }
    });
  };

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
                <span className="text-[#FDFDFD]/70">Connected:</span>
                <Badge className={account ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {account ? 'Yes' : 'No'}
                </Badge>
              </div>
              {account && (
                <div className="flex items-center justify-between">
                  <span className="text-[#FDFDFD]/70">Address:</span>
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
                <span className="text-[#FDFDFD]/70">Current Network:</span>
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

          {/* Listing Debug Section */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3">Listing Debug</h3>
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  if (!activeChain) {
                    console.error('❌ No network connected');
                    return;
                  }
                  
                  try {
                    console.log('🔍 INVESTIGATING LISTING ID 0...');
                    
                    // Import service
                    const { MarketplaceService } = await import('@/lib/services/marketplace-service');
                    
                    // Fetch listing 0
                    const listing = await MarketplaceService.getListing(activeChain.id, '0');
                    console.log('✅ Listing 0 found:', listing);
                    
                    // Calculate price in ether
                    const priceInEther = Number(listing.pricePerToken) / Math.pow(10, 18);
                    console.log('💰 Listing 0 price:', {
                      wei: listing.pricePerToken.toString(),
                      ether: priceInEther,
                      formatted: `${priceInEther.toFixed(6)} MATIC`
                    });
                    
                  } catch (error: any) {
                    console.error('❌ Error investigating listing 0:', error);
                  }
                }}
                size="sm"
                className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
              >
                🔍 Debug Listing ID 0
              </Button>
              
              <Button
                onClick={async () => {
                  if (!activeChain) {
                    console.error('❌ No network connected');
                    return;
                  }
                  
                  try {
                    console.log('📊 FETCHING TOTAL LISTINGS...');
                    
                    const { MarketplaceService } = await import('@/lib/services/marketplace-service');
                    
                    const totalListings = await MarketplaceService.getTotalListings(activeChain.id);
                    console.log('📊 Total listings:', totalListings.toString());
                    
                    // Fetch some valid listings
                    if (Number(totalListings) > 0) {
                      console.log('🔍 Fetching valid listings...');
                      const validListings = await MarketplaceService.getAllValidListings(
                        activeChain.id, 
                        0, 
                        Math.min(Number(totalListings) - 1, 4)
                      );
                      
                      console.log('📋 Valid listings found:', validListings.length);
                      validListings.forEach((listing, index) => {
                        const priceInEther = Number(listing.pricePerToken) / Math.pow(10, 18);
                        console.log(`📋 Listing ${index}:`, {
                          id: listing.listingId.toString(),
                          creator: listing.listingCreator,
                          price: `${priceInEther.toFixed(6)} MATIC`,
                          status: listing.status
                        });
                      });
                    }
                    
                  } catch (error: any) {
                    console.error('❌ Error fetching listings:', error);
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
              >
                📊 Check All Listings
              </Button>
              
              <Button
                onClick={async () => {
                  if (!activeChain || !account) {
                    console.error('❌ Wallet not connected');
                    return;
                  }
                  
                  try {
                    console.log('💰 CHECKING WALLET BALANCE...');
                    
                    // Fetch native balance
                    const balance = await activeChain.rpc.eth_getBalance([account.address, 'latest']);
                    const balanceInEther = Number(balance) / Math.pow(10, 18);
                    
                    console.log('💰 Wallet balance:', {
                      wei: balance.toString(),
                      ether: balanceInEther,
                      formatted: `${balanceInEther.toFixed(6)} ${activeChain.nativeCurrency?.symbol || 'ETH'}`
                    });
                    
                    // Check if has enough balance for gas
                    if (balanceInEther < 0.01) {
                      console.warn('⚠️ Low balance for gas fees');
                    }
                    
                  } catch (error: any) {
                    console.error('❌ Error checking balance:', error);
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
              >
                💰 Check Wallet Balance
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    console.log('🧪 TESTING PRICE VALIDATION...');
                    
                    // Import validation functions
                    const { isValidPrice, debugPrice } = await import('@/lib/marketplace-config');
                    
                    // Test different price formats
                    const testPrices = [
                      '0.001 MATIC',
                      '1.5 MATIC', 
                      '0.5',
                      '2.3',
                      'Not for sale',
                      'N/A',
                      '1000000 MATIC',
                      '0.0001',
                      '50'
                    ];
                    
                    console.log('🧪 Testing price validation:');
                    testPrices.forEach(price => {
                      const isValid = isValidPrice(price);
                      console.log(`Price: "${price}" -> Valid: ${isValid}`);
                      debugPrice(price, `Test Price "${price}"`);
                    });
                    
                  } catch (error: any) {
                    console.error('❌ Error testing price validation:', error);
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
              >
                🧪 Test Price Validation
              </Button>

              <Button onClick={checkBlockchainListings} className="w-full bg-blue-600 hover:bg-blue-700">
                Check Blockchain Listings
              </Button>

              <Button onClick={() => investigateSpecificListing('0')} className="w-full bg-yellow-600 hover:bg-yellow-700">
                Investigate Jersey Listing
              </Button>

              <Button onClick={testPriceConversion} className="w-full bg-green-600 hover:bg-green-700">
                Test Price Conversion
              </Button>
            </div>
          </div>

          <Separator className="bg-[#FDFDFD]/10" />

          {/* Test Actions */}
          <div>
            <h3 className="text-[#FDFDFD] font-medium mb-3">Test Actions</h3>
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
                Open Marketplace
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

              {activeChain?.id !== polygonAmoy.id && account && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/5"
                  onClick={handleSwitchToAmoy}
                >
                  Switch to Amoy
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 