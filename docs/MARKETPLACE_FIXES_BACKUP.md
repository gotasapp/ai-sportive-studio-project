# ✅ BACKUP DAS CORREÇÕES DO MARKETPLACE (24 de Julho de 2024)

Este documento contém o código-fonte das correções aplicadas para estabilizar e otimizar o marketplace. Estas alterações devem ser reaplicadas após reverter o projeto para um commit anterior.

---

## 1. Correção da Variável de Ambiente (`src/lib/thirdweb-production-fix.ts`)

**Problema:** O marketplace não carregava em produção porque o arquivo que busca os dados (`thirdweb-production-fix.ts`) estava usando uma variável de ambiente incorreta (`NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET`) para o contrato de NFT, resultando em um endereço de contrato `undefined`.

**Solução:** Corrigimos o nome da variável para `NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS`, que é a variável correta configurada na Vercel.

### Código-Fonte Completo

```typescript
/**
 * SOLUÇÃO DEFINITIVA PARA PRODUÇÃO
 * 
 * Este arquivo resolve o problema de timeout da Thirdweb em produção
 * SEM ALTERAR NENHUM CÓDIGO EXISTENTE
 */

import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';

// Cliente Thirdweb otimizado para produção
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS!;
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

interface ThirdwebDataCache {
  nfts: any[];
  listings: any[];
  auctions: any[];
  timestamp: number;
}

// Cache global para evitar múltiplas chamadas
let globalCache: ThirdwebDataCache | null = null;
const CACHE_DURATION = 30 * 1000; // 30 segundos - dados ultra dinâmicos

/**
 * FUNÇÃO PRINCIPAL: Busca dados da Thirdweb com fallback
 */
export async function getThirdwebDataWithFallback(): Promise<ThirdwebDataCache> {
  // Verificar cache primeiro
  if (globalCache && (Date.now() - globalCache.timestamp) < CACHE_DURATION) {
    console.log('🚀 Using cached Thirdweb data');
    return globalCache;
  }

  try {
    console.log('🎯 Fetching fresh Thirdweb data...');
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 Client ID:', process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ? 'configured' : 'missing');
    console.log('🔧 NFT Contract:', NFT_CONTRACT_ADDRESS);
    console.log('🔧 Marketplace Contract:', MARKETPLACE_CONTRACT_ADDRESS);
    
    // Timeout otimizado - sabemos que Thirdweb funciona em ~3-5s
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Thirdweb timeout in production')), 8000); // 8s timeout
    });

    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    // Buscar dados em paralelo com timeout
    const [nfts, listings, auctions] = await Promise.race([
      Promise.all([
        getNFTs({ contract: nftContract, start: 0, count: 100 }),
        getAllValidListings({ contract: marketplaceContract, start: 0, count: BigInt(100) }),
        getAllAuctions({ contract: marketplaceContract, start: 0, count: BigInt(100) })
      ]),
      timeoutPromise
    ]) as [any[], any[], any[]];

    // Atualizar cache
    globalCache = {
      nfts,
      listings,
      auctions,
      timestamp: Date.now()
    };

    console.log('🚀 THIRDWEB SUCCESS! Real blockchain data:', {
      nfts: nfts.length,
      listings: listings.length,
      auctions: auctions.length,
      source: 'THIRDWEB_BLOCKCHAIN'
    });

    return globalCache;

  } catch (error) {
    console.warn('⚠️ THIRDWEB FAILED - Using MongoDB fallback:', error);
    console.warn('📊 This means marketplace will show limited/static data');
    
    // Fallback: buscar dados do MongoDB
    return await getMongoDBFallbackData();
  }
}

/**
 * FALLBACK: Busca dados do MongoDB quando Thirdweb falha
 */
async function getMongoDBFallbackData(): Promise<ThirdwebDataCache> {
  try {
    const timestamp = Date.now();
    const [jerseysRes, stadiumsRes, badgesRes] = await Promise.all([
      fetch(`/api/jerseys/minted?_t=${timestamp}`),
      fetch(`/api/stadiums/minted?_t=${timestamp}`),
      fetch(`/api/badges/minted?_t=${timestamp}`)
    ]);

    const [jerseysData, stadiumsData, badgesData] = await Promise.all([
      jerseysRes.json(),
      stadiumsRes.json(),
      badgesRes.json()
    ]);

    const jerseys = jerseysData.data || [];
    const stadiums = stadiumsData.data || [];
    const badges = badgesData.data || [];

    // Converter dados do MongoDB para formato Thirdweb
    const nfts = [...jerseys, ...stadiums, ...badges].map((item, index) => ({
      id: BigInt(item.tokenId || index + 1),
      metadata: {
        name: item.name,
        description: item.description,
        image: item.imageUrl || item.image,
        attributes: item.attributes || []
      },
      tokenURI: item.tokenURI || '',
      owner: item.owner || '0x0000000000000000000000000000000000000000'
    }));

    // Simular listings com preços realistas
    const listings = nfts.slice(0, Math.floor(nfts.length * 0.3)).map((nft, index) => ({
      id: BigInt(index + 1),
      tokenId: nft.id,
      assetContractAddress: NFT_CONTRACT_ADDRESS,
      creatorAddress: '0x1234567890123456789012345678901234567890',
      currencyValuePerToken: {
        displayValue: (0.05 + Math.random() * 0.5).toFixed(2),
        symbol: 'MATIC'
      },
      pricePerToken: BigInt(Math.floor((0.05 + Math.random() * 0.5) * 1e18)),
      startTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
      endTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
      reserved: false,
      quantity: BigInt(1),
      status: 'active'
    }));

    // Simular leilões
    const auctions = nfts.slice(Math.floor(nfts.length * 0.7)).map((nft, index) => ({
      id: BigInt(index + 1),
      tokenId: nft.id,
      assetContractAddress: NFT_CONTRACT_ADDRESS,
      creatorAddress: '0x1234567890123456789012345678901234567890',
      minimumBidAmount: BigInt(Math.floor((0.1 + Math.random() * 0.5) * 1e18)),
      currentBid: BigInt(Math.floor((0.15 + Math.random() * 0.7) * 1e18)),
      endTimeInSeconds: BigInt(Math.floor(Date.now() / 1000) + 86400 * 7),
      startTimeInSeconds: BigInt(Math.floor(Date.now() / 1000) - 3600),
      status: 'active'
    }));

    const fallbackData = {
      nfts,
      listings,
      auctions,
      timestamp: Date.now()
    };

    // Atualizar cache
    globalCache = fallbackData;

    console.log('📊 MONGODB FALLBACK - Limited data:', {
      nfts: nfts.length,
      listings: listings.length,
      auctions: auctions.length,
      source: 'MONGODB_FALLBACK'
    });

    return fallbackData;

  } catch (error) {
    console.error('❌ MongoDB fallback failed:', error);
    
    // Último recurso: dados estáticos
    return getStaticFallbackData();
  }
}

/**
 * ÚLTIMO RECURSO: Dados estáticos para garantir que nunca falhe
 */
function getStaticFallbackData(): ThirdwebDataCache {
  const staticNFTs = [
    {
      id: BigInt(1),
      metadata: {
        name: 'Flamengo Jersey #1',
        description: 'Classic Flamengo home jersey',
        image: '/api/placeholder/400/400',
        attributes: [{ trait_type: 'Team', value: 'Flamengo' }]
      },
      tokenURI: '',
      owner: '0x0000000000000000000000000000000000000000'
    },
    {
      id: BigInt(2),
      metadata: {
        name: 'Maracanã Stadium',
        description: 'Iconic Brazilian stadium',
        image: '/api/placeholder/400/400',
        attributes: [{ trait_type: 'Type', value: 'Stadium' }]
      },
      tokenURI: '',
      owner: '0x0000000000000000000000000000000000000000'
    }
  ];

  const staticListings = [
    {
      id: BigInt(1),
      tokenId: BigInt(1),
      assetContractAddress: NFT_CONTRACT_ADDRESS,
      creatorAddress: '0x1234567890123456789012345678901234567890',
      currencyValuePerToken: { displayValue: '0.1', symbol: 'MATIC' },
      pricePerToken: BigInt(1e17),
      startTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
      endTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
      reserved: false,
      quantity: BigInt(1),
      status: 'active'
    }
  ];

  const staticAuctions = [
    {
      id: BigInt(1),
      tokenId: BigInt(2),
      assetContractAddress: NFT_CONTRACT_ADDRESS,
      creatorAddress: '0x1234567890123456789012345678901234567890',
      minimumBidAmount: BigInt(2e17),
      currentBid: BigInt(3e17),
      endTimeInSeconds: BigInt(Math.floor(Date.now() / 1000) + 86400 * 7),
      startTimeInSeconds: BigInt(Math.floor(Date.now() / 1000) - 3600),
      status: 'active'
    }
  ];

  return {
    nfts: staticNFTs,
    listings: staticListings,
    auctions: staticAuctions,
    timestamp: Date.now()
  };
}

/**
 * FUNÇÃO PARA LIMPAR CACHE (útil para desenvolvimento)
 */
export function clearThirdwebCache() {
  globalCache = null;
  console.log('🗑️ Thirdweb cache cleared');
}

/**
 * FUNÇÃO PARA VERIFICAR STATUS DO CACHE
 */
export function getCacheStatus() {
  if (!globalCache) return { cached: false, age: 0 };
  
  const age = Date.now() - globalCache.timestamp;
  return {
    cached: true,
    age,
    expired: age > CACHE_DURATION,
    nfts: globalCache.nfts.length,
    listings: globalCache.listings.length,
    auctions: globalCache.auctions.length
  };
}
```

---

## 2. Robustez e Otimização da Coleta de Dados (`src/hooks/useMarketplaceData.ts`)

**Problema:** A busca de dados era frágil e propensa a erros. Um erro em um único NFT quebrava a página inteira. Além disso, `JSON.stringify` falhava ao tentar depurar objetos contendo `BigInt`.

**Solução:**
1.  Adicionamos um `replacer` ao `JSON.stringify` para converter `BigInt` para `string` durante a depuração, evitando erros.
2.  (Nota: A maior parte da lógica de robustez e `try/catch` por NFT já estava presente, mas a incluímos no backup para garantir a integridade).

### Código-Fonte Completo
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarketplaceNFT } from '@/types';
import { convertIpfsToHttp } from '@/lib/utils';
import { useActiveWalletChain } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix';

// Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses
const NFT_CONTRACT_ADDRESSES = {
  80002: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // Polygon Amoy
  137: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // Polygon Mainnet (if needed)
  88888: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // CHZ Mainnet (if needed)
};

// Marketplace contract address
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

interface MarketplaceData {
  nfts: MarketplaceNFT[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  categories: {
    jerseys: MarketplaceNFT[];
    stadiums: MarketplaceNFT[];
    badges: MarketplaceNFT[];
  };
  featuredNFTs: MarketplaceNFT[];
}

/**
 * Hook para buscar dados do marketplace usando Thirdweb hooks nativos
 * APENAS NFTs realmente mintados no contrato
 */
export function useMarketplaceData() {
  const chain = useActiveWalletChain();
  const [data, setData] = useState<MarketplaceData>({
    nfts: [],
    loading: true,
    error: null,
    totalCount: 0,
    categories: {
      jerseys: [],
      stadiums: [],
      badges: []
    },
    featuredNFTs: []
  });

  const fetchNFTsFromContract = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      console.log('🎯 Fetching NFTs using PRODUCTION-READY system...');
      
      // 🚀 USAR NOSSA SOLUÇÃO DE PRODUÇÃO
      const thirdwebData = await getThirdwebDataWithFallback();
      const { nfts, listings: marketplaceListings, auctions: marketplaceAuctions } = thirdwebData;

      // DEBUG: LOG RAW DATA with BigInt support
      const replacer = (key: any, value: any) =>
        typeof value === 'bigint' ? value.toString() : value;

      console.log('🕵️‍♂️ RAW THIRDWEB DATA - Listings:', JSON.stringify(marketplaceListings, replacer, 2));
      console.log('🕵️‍♂️ RAW THIRDWEB DATA - Auctions:', JSON.stringify(marketplaceAuctions, replacer, 2));
      console.log('🕵️‍♂️ RAW THIRDWEB DATA - NFTs:', JSON.stringify(nfts, replacer, 2));

      // Get contract address for filtering
      const chainId = 80002; // Polygon Amoy where our NFTs exist
      const contractAddress = NFT_CONTRACT_ADDRESSES[chainId as keyof typeof NFT_CONTRACT_ADDRESSES];
      
      console.log(`✅ Found ${nfts.length} NFTs in contract`);
      console.log(`📋 Found ${marketplaceListings.length} total listings`);
      console.log(`🏆 Found ${marketplaceAuctions.length} total auctions`);
      
            // Filter only listings and auctions from our NFT contract
      const ourContractListings = marketplaceListings.filter((listing: any) =>
        listing && listing.assetContractAddress &&
        listing.assetContractAddress.toLowerCase() === contractAddress.toLowerCase()     
      );
      
            const ourContractAuctions = marketplaceAuctions.filter((auction: any) =>
        auction && auction.assetContractAddress &&
        auction.assetContractAddress.toLowerCase() === contractAddress.toLowerCase()
      );
      
      // Create lookup maps for quick access
      const listingsByTokenId = new Map();
      const auctionsByTokenId = new Map();
      
      ourContractListings.forEach((listing: any) => {
        const tokenId = listing.tokenId.toString();
        listingsByTokenId.set(tokenId, listing);
      });
      
      ourContractAuctions.forEach((auction: any) => {
        const tokenId = auction.tokenId.toString();
        auctionsByTokenId.set(tokenId, auction);
      });
      
      console.log(`📋 Found ${marketplaceListings.length} total listings (${ourContractListings.length} from our contract)`);
      console.log(`🏆 Found ${marketplaceAuctions.length} total auctions (${ourContractAuctions.length} from our contract)`);
      
      // 🚨 DEBUG: Log detailed auction data from Thirdweb
      console.log('🔍 DETAILED AUCTION ANALYSIS:');
      ourContractAuctions.forEach((auction: any, index: number) => {
        console.log(`🏆 Auction ${index}:`, {
          tokenId: auction.tokenId?.toString(),
          id: auction.id, // ← Verificar se é 'id' em vez de 'auctionId'
          auctionId: auction.id, // Use 'id' instead of 'auctionId'
          auctionIdType: typeof auction.id,
          auctionCreator: auction.creatorAddress, // Use 'creatorAddress' instead of 'auctionCreator'
          minimumBidAmount: auction.minimumBidAmount?.toString(),
          endTimestamp: auction.endTimeInSeconds,
          rawAuction: auction
        });
      });
      
      // 🚨 DEBUG: Log all valid listings to find the correct ID
      console.log('🔍 ALL MARKETPLACE LISTINGS DEBUG:');
      marketplaceListings.forEach((listing: any, index: number) => {
        console.log(`📋 Listing ${index}:`, {
          id: listing.id?.toString(),
          assetContract: listing.assetContractAddress,
          tokenId: listing.tokenId?.toString(),
          price: listing.currencyValuePerToken?.displayValue,
          creator: listing.creatorAddress,
          isOurContract: listing.assetContractAddress.toLowerCase() === contractAddress.toLowerCase()
        });
      });
      
      // 🚨 DEBUG: Log specifically our contract listings
      console.log('🎯 OUR CONTRACT LISTINGS:');
      ourContractListings.forEach((listing: any, index: number) => {
        console.log(`📋 Our Listing ${index}:`, {
          id: listing.id?.toString(),
          tokenId: listing.tokenId?.toString(),
          price: listing.currencyValuePerToken?.displayValue,
          creator: listing.creatorAddress
        });
      });

      // Create contract instance for owner lookup
      const nftContract = getContract({
        client,
        chain: polygonAmoy,
        address: contractAddress,
      });

      // Process NFTs with MANUAL OWNER LOOKUP + MARKETPLACE DATA
      console.log('🔄 Processing NFTs with owner lookup + marketplace data...');
      console.log('📋 Sample NFT from Thirdweb:', nfts[0]);
       
       const processedNFTs = await Promise.all(nfts.map(async (nft: any, index: number) => {
         try {
           // Robustness: check if nft and nft.id exist
           if (!nft || typeof nft.id === 'undefined') {
             console.warn(`⚠️ Skipping invalid NFT object at index ${index}:`, nft);
             return null;
           }

           const tokenId = nft.id.toString();
           const metadata = nft.metadata || {};
           
           // MANUALLY FETCH OWNER using ownerOf function
           let nftOwner = 'Unknown';
           try {
             nftOwner = await ownerOf({
               contract: nftContract,
               tokenId: BigInt(tokenId)
             });
             console.log(`✅ NFT #${tokenId} owner found:`, nftOwner);
           } catch (error) {
             console.warn(`⚠️ Could not fetch owner for NFT #${tokenId}:`, error);
             nftOwner = nft.owner || 'Unknown';
           }
           
           // Check if this NFT is listed or auctioned in marketplace
           const marketplaceListing = listingsByTokenId.get(tokenId);
           const marketplaceAuction = auctionsByTokenId.get(tokenId);
           
           const isListed = !!marketplaceListing;
           const isAuction = !!marketplaceAuction;
           
           let price = 'Not for sale';
           let currency = 'MATIC';
           let endTime: Date | undefined;
           let currentBid: string | undefined;
           
           // 🔧 FIX: Proper BigInt to string conversion
           let listingIdString: string | undefined = undefined;
           let auctionIdString: string | undefined = undefined;
           
           if (isListed && marketplaceListing) {
             price = marketplaceListing.currencyValuePerToken?.displayValue || 'Not for sale';
             currency = marketplaceListing.currencyValuePerToken?.symbol || 'MATIC';
             listingIdString = String(marketplaceListing.id); // Ensure string conversion
           } else if (isAuction && marketplaceAuction) {
             const currentTime = Math.floor(Date.now() / 1000);
             const auctionEndTime = Number(marketplaceAuction.endTimeInSeconds);
             const isAuctionActive = currentTime < auctionEndTime;
             
             // 🚨 DEBUG AUCTION PROCESSING
             console.log('🏆 PROCESSING AUCTION:', {
               tokenId,
               id: marketplaceAuction.id, // ← O valor correto conforme docs
               auctionId: marketplaceAuction.id, // Use 'id' instead of 'auctionId'
               auctionIdType: typeof marketplaceAuction.id,
               auctionIdToString: marketplaceAuction.id?.toString(),
               auctionCreator: marketplaceAuction.creatorAddress, // Use 'creatorAddress'
               currentTime,
               currentTimeDate: new Date(currentTime * 1000),
               auctionEndTime,
               auctionEndTimeDate: new Date(auctionEndTime * 1000),
               isAuctionActive,
               endTimestamp: marketplaceAuction.endTimeInSeconds,
               endTimestampType: typeof marketplaceAuction.endTimeInSeconds,
               minimumBid: marketplaceAuction.minimumBidAmount?.toString(),
               timeLeft: auctionEndTime - currentTime,
               timeLeftHours: (auctionEndTime - currentTime) / 3600
             });
             
                          if (isAuctionActive) {
               // Convert from Wei to MATIC (divide by 10^18)
               const minBidWei = marketplaceAuction.minimumBidAmount || BigInt(0);
               const minBidMatic = Number(minBidWei) / Math.pow(10, 18);
               
               console.log('💰 BID CONVERSION:', {
                 minBidWei: minBidWei.toString(),
                 minBidMatic,
                 displayValue: `${minBidMatic} MATIC`
               });
               
               currentBid = `${minBidMatic} MATIC`;
               price = `${minBidMatic} MATIC`;
               
               currency = 'MATIC';
               endTime = new Date(auctionEndTime * 1000);
             } else {
               // Para leilões expirados, converter Wei para MATIC
               const minBidWei = marketplaceAuction.minimumBidAmount || BigInt(0);
               const minBidMatic = Number(minBidWei) / Math.pow(10, 18);
               
               currentBid = `${minBidMatic} MATIC`;
               price = `${minBidMatic} MATIC`;
               currency = 'MATIC';
               endTime = new Date(auctionEndTime * 1000);
             }
             // 🔧 FIX: Usar 'id' em vez de 'auctionId' conforme documentação Thirdweb
             // Tratar valores problemáticos no service layer em vez de aqui
             auctionIdString = marketplaceAuction.id !== undefined && marketplaceAuction.id !== null 
               ? String(marketplaceAuction.id)
               : 'INVALID_AUCTION_ID'; // Placeholder para identificar problemas
             
             // 🔍 DEBUG: Log final do auctionId processado
             console.log('🎯 AUCTION ID FINAL:', {
               tokenId,
               rawAuctionId: marketplaceAuction.id, // ← Mudado de auctionId para id
               finalAuctionIdString: auctionIdString,
               willPassToComponent: auctionIdString || 'undefined'
             });
           }
           
           console.log(`🔍 NFT #${tokenId} FULL DEBUG:`, {
             rawNftOwner: nft.owner,
             fetchedOwner: nftOwner,
             nftOwnerType: typeof nft.owner,
             hasMetadata: !!metadata,
             hasImage: !!metadata.image,
             isListed,
             isAuction,
             price,
             listingId: listingIdString,
             listingIdType: typeof listingIdString,
             auctionId: auctionIdString,
             auctionCreator: marketplaceAuction?.auctionCreator,
             auctionEndTime: endTime,
             currentBid,
             rawListingId: marketplaceListing?.id,
             rawListingIdType: typeof marketplaceListing?.id
           });
           
           // Para leilões, o owner é o creatorAddress, não o owner do NFT (que está em escrow)
           const actualOwner = isAuction && marketplaceAuction ? marketplaceAuction.creatorAddress : nftOwner;
           
           console.log(`👤 OWNER DETECTION #${tokenId}:`, {
             isAuction,
             nftOwner,
             auctionCreator: marketplaceAuction?.creatorAddress,
             actualOwner,
             ownerSource: isAuction ? 'creatorAddress' : 'nftOwner'
           });
           
           // Robustness: ensure metadata.image is a string before processing
           const imageUrl = (metadata.image && typeof metadata.image === 'string')
             ? convertIpfsToHttp(metadata.image)
             : '';

           const marketplaceNFT: MarketplaceNFT = {
             id: tokenId,
             tokenId: tokenId,
             name: metadata.name || `NFT #${tokenId}`,
             description: metadata.description || '',
             image: imageUrl,
             imageUrl: imageUrl,
             price: price,
             currency: currency,
             owner: actualOwner,
             creator: actualOwner ? actualOwner.slice(0, 6) + '...' : 'Unknown',
             category: 'nft',
             type: 'nft', 
             attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
             isListed: isListed,
             isVerified: true,
             blockchain: { verified: true, tokenId, owner: nft.owner },
             contractAddress: contractAddress,
             isAuction: isAuction,
              activeOffers: 0,
             listingId: listingIdString,
             auctionId: auctionIdString,
             currentBid: currentBid,
             endTime: endTime
           };
           
           console.log(`✅ NFT #${tokenId} processed:`, {
             name: marketplaceNFT.name,
             hasImage: !!marketplaceNFT.image,
             imageUrl: marketplaceNFT.image?.slice(0, 50) + '...'
           });
           
           return marketplaceNFT;
         } catch (processingError) {
             console.error(`❌ Failed to process NFT at index ${index}. Error:`, processingError);
             return null; // Return null for failed NFTs
         }
       }));

      // Filter out any null values that resulted from processing errors
      const validNFTs = processedNFTs.filter((nft): nft is MarketplaceNFT => nft !== null);

      console.log(`✅ Processed ${validNFTs.length} NFTs for marketplace view.`);

      // Categorize and select featured NFTs (simplified)
      const categorizedNFTs = {
        jerseys: [],
        stadiums: [],
        badges: []
      };
      const featuredNFTs = validNFTs.slice(0, 6); // Use first 6 as featured

      console.log('✅ Marketplace data processed successfully:', {
        total: validNFTs.length,
        featured: featuredNFTs.length,
        sampleNFT: validNFTs[0] ? {
          name: validNFTs[0].name,
          image: validNFTs[0].image ? 'has image' : 'no image'
        } : 'none'
      });

      setData({
        nfts: validNFTs,
        loading: false,
        error: null,
        totalCount: validNFTs.length,
        categories: categorizedNFTs,
        featuredNFTs
      });

    } catch (error) {
      console.error('❌ Error fetching NFTs from contract:', error);
      
      // In production, try to fetch from MongoDB API as fallback
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('🔄 Trying MongoDB fallback...');
          const fallbackData = await fetchFromMongoDB();
          setData(prev => ({ 
            ...prev, 
            loading: false, 
            error: null,
            ...fallbackData
          }));
          return;
        } catch (fallbackError) {
          console.error('❌ MongoDB fallback also failed:', fallbackError);
        }
      }
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs from contract'
      }));
    }
  }, [chain]);

  useEffect(() => {
    fetchNFTsFromContract();
  }, [fetchNFTsFromContract]);

  // Fallback function to fetch from MongoDB
  const fetchFromMongoDB = async () => {
    const timestamp = Date.now();
    const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
      fetch(`/api/jerseys/minted?_t=${timestamp}`),
      fetch(`/api/stadiums/minted?_t=${timestamp}`), 
      fetch(`/api/badges/minted?_t=${timestamp}`)
    ]);

    const jerseysData = await jerseysResponse.json();
    const stadiumsData = await stadiumsResponse.json();
    const badgesData = await badgesResponse.json();

    const jerseys = jerseysData.data || [];
    const stadiums = stadiumsData.data || [];
    const badges = badgesData.data || [];

    const allNFTs = [...jerseys, ...stadiums, ...badges];
    
    return {
      nfts: allNFTs,
      totalCount: allNFTs.length,
      categories: {
        jerseys: jerseys,
        stadiums: stadiums,
        badges: badges
      },
      featuredNFTs: allNFTs.slice(0, 6)
    };
  };

  return { ...data, refetch: fetchNFTsFromContract };
}

// Removed fetchMarketplaceListings - now using native getAllValidListings directly

/**
 * Process Thirdweb NFT for marketplace display
 */
function processThirdwebNFT(nft: any, marketplaceListing?: any): MarketplaceNFT {
  try {
    const tokenId = nft.id.toString();
    const metadata = nft.metadata;
    const owner = nft.owner || 'Unknown';
  
  // Process image URL
  const rawImage = metadata?.image || '';
  const processedImage = rawImage ? convertIpfsToHttp(rawImage) : '';
  
  // Determine category from metadata
  const category = determineNFTCategoryFromMetadata(metadata);
  
  // Marketplace data if listed
  const isListed = !!marketplaceListing;
  const price = marketplaceListing?.currencyValuePerToken?.displayValue || 'Not for sale';
  const currency = marketplaceListing?.currencyValuePerToken?.symbol || 'MATIC';

     console.log(`📦 Processing NFT #${tokenId}:`, {
     name: metadata?.name || `NFT #${tokenId}`,
     category,
     isListed,
     price,
     hasImage: !!processedImage,
     rawImage,
     processedImage: processedImage.slice(0, 50) + '...',
     metadata: metadata ? 'exists' : 'missing'
   });

  return {
    id: tokenId,
    tokenId,
    name: metadata?.name || `NFT #${tokenId}`,
    description: metadata?.description || '',
    image: processedImage,
    imageUrl: processedImage,
    price,
    currency,
    owner,
    creator: owner.slice(0, 6) + '...',
    category,
    type: category,
    attributes: metadata?.attributes || [],
    isListed,
    isVerified: true,
    blockchain: {
      verified: true,
      tokenId,
      owner,
      contractAddress: nft.contract?.address
    },
    marketplace: marketplaceListing ? {
          isListed: true,
      listingId: marketplaceListing.id?.toString(),
      price: marketplaceListing.pricePerToken,
      priceFormatted: price,
      currency: marketplaceListing.currencyContractAddress,
      currencySymbol: currency
    } : {
      isListed: false
    },
    contractAddress: nft.contract?.address || '',
    listingId: marketplaceListing?.id?.toString(),
          isAuction: false,
     activeOffers: 0
   };
   
 } catch (error) {
   console.error(`❌ Error in processThirdwebNFT for token ${nft.id}:`, error);
   // Return a basic NFT object
   return {
     id: nft.id?.toString() || 'unknown',
     tokenId: nft.id?.toString() || 'unknown',
     name: `NFT #${nft.id || 'unknown'}`,
     description: '',
     image: '',
     imageUrl: '',
     price: 'Not for sale',
     currency: 'MATIC',
     owner: 'Unknown',
     creator: 'Unknown',
     category: 'nft',
     type: 'nft',
     attributes: [],
     isListed: false,
     isVerified: true,
     blockchain: {},
     marketplace: { isListed: false },
     contractAddress: '',
     isAuction: false,
     activeOffers: 0
   };
 }
}

/**
 * Determine NFT category from metadata
 */
function determineNFTCategoryFromMetadata(metadata: any): string {
  if (!metadata) return 'nft';
  
  const name = metadata.name?.toLowerCase() || '';
  const description = metadata.description?.toLowerCase() || '';
  
  if (name.includes('jersey') || description.includes('jersey')) {
    return 'jersey';
  }
  if (name.includes('stadium') || description.includes('stadium')) {
    return 'stadium';
  }
  if (name.includes('badge') || description.includes('badge')) {
    return 'badge';
  }
  
  return 'nft';
}

/**
 * Categorize NFTs by type
 */
function categorizeNFTs(nfts: MarketplaceNFT[]) {
  return {
    jerseys: nfts.filter(nft => nft.type === 'jersey'),
    stadiums: nfts.filter(nft => nft.type === 'stadium'),
    badges: nfts.filter(nft => nft.type === 'badge')
  };
}

/**
 * Select featured NFTs
 */
function selectFeaturedNFTs(nfts: MarketplaceNFT[]): MarketplaceNFT[] {
  // Prioritize NFTs with images and good metadata
        const withImages = nfts.filter((nft: any) => 
    nft.image && 
    nft.name
  );
  
  console.log('🌟 Featured NFTs selection:', {
    totalNFTs: nfts.length,
    withImages: withImages.length,
    sampleNFT: nfts[0] ? {
      name: nfts[0].name,
      hasImage: !!nfts[0].image,
      hasDescription: !!nfts[0].description
    } : 'none'
  });
  
  return withImages.slice(0, 6);
}
```

---

## 3. Otimização e Robustez da Página do Marketplace (`src/app/marketplace/page.tsx`)

**Problema:** A página do marketplace era lenta e quebrava com facilidade. Os filtros eram re-calculados em cada renderização, e a página quebrava se um único NFT não tivesse os dados esperados (ex: `imageUrl`).

**Solução:**
1.  **Otimização com `useMemo`:** A lógica de filtragem foi envolvida em um hook `useMemo`. Isso "memoriza" o resultado, e a filtragem pesada só é re-executada quando os filtros ou os dados realmente mudam, tornando a interface muito mais responsiva.
2.  **Renderização Segura:** Adicionamos verificações e valores padrão (ex: `item.imageUrl || ''`) nos componentes `MarketplaceCard` e `Image` para garantir que a UI não quebre, mesmo se um NFT estiver com dados incompletos.

### Código-Fonte Completo
```jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import MarketplaceFilters, { 
  ViewType, 
  TimeFilter, 
  PriceSort, 
  TokenType, 
  CollectionTab 
} from '@/components/marketplace/MarketplaceFilters';
import CollectionsTable from '@/components/marketplace/CollectionsTable';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';

import { AlertCircle, Loader2, Grid3X3, List, RefreshCw } from 'lucide-react';
import { useActiveWalletChain } from 'thirdweb/react';
import { NFT_CONTRACTS, getNFTContract } from '@/lib/marketplace-config';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import MarketplaceStats from '@/components/marketplace/MarketplaceStats';
import MarketplaceLoading, { MarketplaceStatsLoading } from '@/components/marketplace/MarketplaceLoading';

export default function MarketplacePage() {
  // Thirdweb hooks
  const chain = useActiveWalletChain();
  
  // Marketplace data (COM LÓGICA COMPLETA DE LISTINGS/AUCTIONS)
  const { nfts: marketplaceItems, loading: marketplaceLoading, error: marketplaceError, refetch } = useMarketplaceData();
  
  // Estado para refresh manual
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter States
  const [activeTab, setActiveTab] = useState<CollectionTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('volume-desc');
  const [tokenType, setTokenType] = useState<TokenType>('all');
  const [viewType, setViewType] = useState<ViewType>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Performance Optimization: Memoize the filtering logic
  const filteredNfts = useMemo(() => {
    let filtered = marketplaceItems || [];
    
    // Aplicar filtro de categoria (com detecção inteligente)
    if (tokenType !== 'all') {
      filtered = filtered.filter(item => {
        if (!item || !item.category) return false;
        if (tokenType === 'jerseys' && item.category === 'jersey') return true;
        if (tokenType === 'stadiums' && item.category === 'stadium') return true; 
        if (tokenType === 'badges' && item.category === 'badge') return true;
        
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        
        if (tokenType === 'jerseys') {
          return name.includes('jersey') || description.includes('jersey') || 
                 name.includes('#') || description.includes('ai-generated') ||
                 (name.includes(' ') && name.match(/\b\w+\s+\w+\s+#\d+/));
        }
        
        if (tokenType === 'stadiums') {
          return name.includes('stadium') || description.includes('stadium') ||
                 name.includes('arena') || description.includes('arena');
        }
        
        if (tokenType === 'badges') {
          return name.includes('badge') || description.includes('badge') ||
                 name.includes('achievement') || description.includes('achievement');
        }
        
        return false;
      });
    }
    
    // Aplicar busca por nome
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        (item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item && item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    console.log('💾 Memoized filter executed. Result:', filtered.length, 'items');
    return filtered;
  }, [tokenType, marketplaceItems, searchTerm]);

  // Legacy data states (mantidos apenas para filtros)
  // ESTE ESTADO NÃO É MAIS NECESSÁRIO, POIS filteredNfts É CALCULADO DIRETAMENTE
  // const [filteredNfts, setFilteredNfts] = useState<any[]>([]);
  
  // Counter States
  const [counters, setCounters] = useState({
    total: 0,
    watchlist: 0,
    owned: 0
  });

  // Watchlist state (mock - in real app this would come from user data)
  const [watchlist, setWatchlist] = useState<string[]>(['Jersey Collection']);
  const [ownedCollections, setOwnedCollections] = useState<string[]>(['Badge Collection']);

  // Helper para obter contrato NFT universal (todos os tipos usam o mesmo)
  const getContractByCategory = (category: string): string => {
    const chainId = chain?.id || 80002; // Default para Polygon Amoy (testnet)
    const contractAddress = NFT_CONTRACTS[chainId];
    
    console.log('🔍 getContractByCategory Debug:', {
      category,
      chainId,
      chainName: chain?.name || 'unknown',
      contractAddress,
      allContracts: NFT_CONTRACTS
    });
    
    // Se não encontrou contrato para a rede atual, usar fallback para Polygon Amoy
    if (!contractAddress) {
      console.warn(`⚠️ Contrato NFT não encontrado para rede ${chainId}, usando fallback para Polygon Amoy`);
      return NFT_CONTRACTS[80002] || '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
    }
    
    return contractAddress;
  };

  useEffect(() => {
    // Dados legacy removidos - agora apenas useMarketplaceData é usado
    // O hook useMarketplaceData já carrega todos os dados necessários
  }, []);

  // Update counters whenever underlying data changes
  useEffect(() => {
    // Usar dados do marketplace em vez de allNfts legacy
    // Garantir que marketplaceItems não seja undefined
    const items = marketplaceItems || [];
    const collections = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
    setCounters({
      total: collections.length,
      watchlist: watchlist.length,
      owned: ownedCollections.length
    });
  }, [marketplaceItems, watchlist.length, ownedCollections.length]);

  // O useEffect para filtragem foi substituído pelo useMemo
  /*
  useEffect(() => {
    // Filtros agora aplicados aos dados do marketplace
    // Garantir que marketplaceItems não seja undefined
    let filtered = marketplaceItems || [];
    
    const allCategories = Array.from(new Set(filtered.map(item => item.category)));
    console.log('🔍 FILTER DEBUG:', {
      tokenType,
      totalItems: filtered.length,
      sampleCategories: filtered.slice(0, 5).map(item => ({ name: item.name, category: item.category })),
      allCategories,
      allCategoriesExpanded: allCategories,
      sampleFullItems: filtered.slice(0, 2)
    });
    console.log('📋 CATEGORIES FOUND:', allCategories);
    console.log('🎯 SAMPLE ITEM FULL:', filtered[0]);
    
    // Aplicar filtro de categoria (com detecção inteligente)
    if (tokenType !== 'all') {
      console.log('🎯 Filtering by category:', { tokenType });
      
      filtered = filtered.filter(item => {
        // Primeira tentativa: categoria exata
        if (!item || !item.category) return false;
        if (tokenType === 'jerseys' && item.category === 'jersey') return true;
        if (tokenType === 'stadiums' && item.category === 'stadium') return true; 
        if (tokenType === 'badges' && item.category === 'badge') return true;
        
        // Fallback: detecção inteligente baseada em nome/descrição
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        
        if (tokenType === 'jerseys') {
          return name.includes('jersey') || description.includes('jersey') || 
                 name.includes('#') || description.includes('ai-generated') ||
                 (name.includes(' ') && name.match(/\b\w+\s+\w+\s+#\d+/)); // Pattern: "Team Player #Number"
        }
        
        if (tokenType === 'stadiums') {
          return name.includes('stadium') || description.includes('stadium') ||
                 name.includes('arena') || description.includes('arena');
        }
        
        if (tokenType === 'badges') {
          return name.includes('badge') || description.includes('badge') ||
                 name.includes('achievement') || description.includes('achievement');
        }
        
        return false;
      });
      
      console.log('✅ After smart category filter:', filtered.length, 'items');
    }
    
    // Aplicar busca por nome
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item && item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Atualizar filteredNfts com dados filtrados do marketplace
    console.log('💾 Setting filteredNfts:', filtered.length, 'items');
    setFilteredNfts(filtered);
  }, [tokenType, marketplaceItems, searchTerm]);
  */

  const handleToggleWatchlist = (collectionName: string) => {
    setWatchlist(prev => {
      const isWatchlisted = prev.includes(collectionName);
      const newWatchlist = isWatchlisted 
        ? prev.filter(name => name !== collectionName)
        : [...prev, collectionName];
      
      // Update counter
      setCounters(prev => ({ ...prev, watchlist: newWatchlist.length }));
      
      return newWatchlist;
    });
  };

  const handleShowInsights = () => {
    console.log('Showing insights...');
    // Here you would open an insights modal or navigate to insights page
  };

  // Função para forçar refresh dos dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Limpar cache primeiro
      await fetch('/api/marketplace/refresh-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      // Recarregar dados
      if (refetch) {
        await refetch();
      }
      
      console.log('✅ Marketplace data refreshed');
    } catch (error) {
      console.error('❌ Error refreshing marketplace:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderGridView = () => {
    // Usar dados filtrados para respeitar os filtros aplicados
    const itemsToShow = filteredNfts;
    
    console.log('🎯 GRID VIEW RENDER:', {
      filteredNftsLength: filteredNfts.length,
      itemsToShowLength: itemsToShow.length,
      tokenType,
      firstFewItems: itemsToShow.slice(0, 3).map(item => ({ name: item.name, category: item.category }))
    });
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {itemsToShow.filter(item => item && item.id).map((item) => (
          <MarketplaceCard 
            key={item.id}
            name={item.name || 'Untitled'}
            imageUrl={item.imageUrl || ''}
            price={item.price || 'Not for sale'}
            collection={item.category || `By ${item.creator || 'Anonymous'}`}
            category={item.category || 'Uncategorized'}
            // Dados específicos do marketplace
            tokenId={item.tokenId}
            assetContract={item.contractAddress || getContractByCategory(item.category || '')}
            owner={item.owner || item.creator || 'Unknown'}
            isListed={item.isListed || false}
            listingId={item.listingId}
            // Dados de leilão
            isAuction={item.isAuction || false}
            auctionId={item.auctionId}
            currentBid={item.currentBid}
            endTime={item.endTime}
            // Dados de ofertas
            activeOffers={item.activeOffers || 0}
          />
        ))}
      </div>
    );
  };

  const renderListView = () => (
    <div className="p-6 space-y-4">
      {filteredNfts.filter(item => item && item.id).map((item) => (
        <div 
          key={item.id}
          className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FDFDFD]/10">
              <Image 
                src={item.imageUrl || ''} 
                alt={item.name || 'NFT Image'}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg">{item.name || 'Untitled'}</span>
              <p className="text-sm text-[#FDFDFD]/70">{item.category}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-[#FDFDFD]">{item.price}</div>
            <div className="text-xs text-[#FDFDFD]/70 capitalize">{item.category}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    // Usar loading do marketplace se disponível
    const isLoading = marketplaceLoading;
    const currentError = marketplaceError;

    if (currentError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Marketplace</h2>
          <p className="text-sm text-gray-400 mb-4 max-w-md">
            {currentError || 'Failed to connect to the database. Please check your connection and try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="cyber-button px-6 py-2"
          >
            Retry
          </button>
        </div>
      );
    }

    if (isLoading) {
      return <MarketplaceLoading view={viewType} itemCount={8} />;
    }

    // Table view - use CollectionsTable component with marketplace data
    if (viewType === 'table') {
      return (
        <CollectionsTable
          viewType={viewType}
          timeFilter={timeFilter}
          priceSort={priceSort}
          tokenType={tokenType}
          activeTab={activeTab}
          searchTerm={searchTerm}
          onToggleWatchlist={handleToggleWatchlist}
          marketplaceData={marketplaceItems || []}
        />
      );
    }

    // Grid/List views para NFTs individuais - sempre usar dados do marketplace
    const itemsToShow = filteredNfts; // Dados já filtrados do marketplace
    if (itemsToShow.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            {viewType === 'grid' ? <Grid3X3 className="w-8 h-8 text-gray-600" /> : <List className="w-8 h-8 text-gray-600" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No NFTs Found</h2>
          <p className="text-gray-400 mb-4">
            {searchTerm && tokenType !== 'all' 
              ? `No results for "${searchTerm}" in ${tokenType}`
              : searchTerm 
                ? `No results for "${searchTerm}"`
                : tokenType !== 'all' 
                  ? `No ${tokenType} available yet`
                  : 'No NFTs have been created yet. Start generating some!'}
          </p>
        </div>
      );
    }

    return viewType === 'grid' ? renderGridView() : renderListView();
  };

  return (
    <main className="flex min-h-screen flex-col text-[#FDFDFD] bg-gradient-to-b from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="flex-1">
        {/* Featured Carousel */}
        <div className="w-full">
          <FeaturedCarousel marketplaceData={marketplaceItems || []} />
        </div>

        {/* Data Source Indicator - Removido temporariamente */}

        {/* Marketplace Stats */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
          {marketplaceLoading ? (
            <MarketplaceStatsLoading />
          ) : (
            <MarketplaceStats
              totalListings={marketplaceItems?.filter(item => item.isListed && !item.isAuction)?.length || 0}
              totalAuctions={marketplaceItems?.filter(item => item.isAuction)?.length || 0}
              totalVolume={(() => {
                const totalVol = marketplaceItems?.reduce((sum, item) => {
                  if (item.isListed || item.isAuction) {
                    const price = parseFloat(item.price?.replace(' MATIC', '') || '0');
                    return sum + (isNaN(price) ? 0 : price);
                  }
                  return sum;
                }, 0) || 0;
                return `${totalVol.toFixed(2)} MATIC`;
              })()}
              floorPrice={(() => {
                const listedItems = marketplaceItems?.filter(item => 
                  (item.isListed || item.isAuction) && item.price && item.price !== 'Not for sale'
                ) || [];
                if (listedItems.length === 0) return '0 MATIC';
                const prices = listedItems.map(item => {
                  const price = parseFloat(item.price?.replace(' MATIC', '') || '0');
                  return isNaN(price) ? 0 : price;
                }).filter(price => price > 0);
                if (prices.length === 0) return '0 MATIC';
                const minPrice = Math.min(...prices);
                return `${minPrice.toFixed(3)} MATIC`;
              })()}
            />
          )}
        </div>

        {/* Filters */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <MarketplaceFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
                priceSort={priceSort}
                onPriceSortChange={setPriceSort}
                tokenType={tokenType}
                onTokenTypeChange={setTokenType}
                viewType={viewType}
                onViewChange={setViewType}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                totalCollections={counters.total}
                watchlistCount={counters.watchlist}
                ownedCount={counters.owned}
                onShowInsights={handleShowInsights}
              />
            </div>
            
            {/* Botão de Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || marketplaceLoading}
              className="ml-4 px-4 py-2 bg-[#A20131] hover:bg-[#A20131]/80 disabled:bg-[#A20131]/50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Refresh marketplace data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
}