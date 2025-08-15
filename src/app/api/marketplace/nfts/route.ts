import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';

const DB_NAME = 'chz-app-db';

// Thirdweb client to verify listings
const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

/**
 * 🔍 CRITICAL FUNCTION: Check if NFTs are listed OR in auction on Thirdweb
 * This is the SAME logic that works for legacy NFTs!
 */
async function getThirdwebMarketplaceData() {
  try {
    console.log('🔍 Searching for listings AND auctions on Thirdweb marketplace...');
    
    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    // Search for BOTH listings and auctions in parallel
    const [validListings, validAuctions] = await Promise.all([
      getAllValidListings({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(200),
      }),
      getAllAuctions({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(200),
      })
    ]);

    console.log(`✅ Thirdweb marketplace data:`, {
      listings: validListings.length,
      auctions: validAuctions.length,
      total: validListings.length + validAuctions.length
    });
    
    // Create separate maps for quick lookup
    const listingsByKey = new Map();
    const auctionsByKey = new Map();
    
    validListings.forEach(listing => {
      const key = `${listing.tokenId.toString()}_${listing.assetContractAddress.toLowerCase()}`;
      listingsByKey.set(key, { ...listing, type: 'listing' });
    });

    // ✅ FILTER ONLY ACTIVE AUCTIONS (not cancelled)
    validAuctions.forEach(auction => {
      // Check if auction was not cancelled (status !== 3)
      if (auction.status?.toString() !== '3') {
        const key = `${auction.tokenId.toString()}_${auction.assetContractAddress.toLowerCase()}`;
        auctionsByKey.set(key, { ...auction, type: 'auction' });
      } else {
        console.log(`⚠️ Cancelled auction filtered: ${auction.id} (tokenId: ${auction.tokenId})`);
      }
    });

    return { listingsByKey, auctionsByKey };
  } catch (error) {
    console.error('❌ Error fetching Thirdweb marketplace data:', error);
    return { listingsByKey: new Map(), auctionsByKey: new Map() };
  }
}

/**
 * Function to fetch minted Custom Collections
 */
async function getCustomCollections(db: any, marketplaceData: { listingsByKey: Map<string, any>, auctionsByKey: Map<string, any> }, limit: number = 50) {
  try {
    console.log('🎨 Fetching custom collections...');
    
    // Search for active custom collections with minted NFTs
    const customCollections = await db.collection('custom_collections').find({
      status: 'active'
    }).toArray();

    const customCollectionNFTs = [];

    for (const collection of customCollections) {
      // Search for minted NFTs from this collection
      const mintedNFTs = await db.collection('custom_collection_mints')
        .find({ customCollectionId: collection._id })
        .toArray();

      if (mintedNFTs.length === 0) continue;

      // Create entry for the collection (represented by the first NFT)
      const firstNFT = mintedNFTs[0];
      
      const collectionEntry = {
        // 🔑 MANDATORY DATA FOR MARKETPLACE
        tokenId: collection._id.toString(),
        contractAddress: collection.contractAddress || firstNFT.contractAddress,
        owner: collection.creatorWallet || firstNFT.minterAddress,
        
        // 🖼️ IMAGE DIRECTLY AT TOP LEVEL (for compatibility)
        image: collection.imageUrl,
        imageUrl: collection.imageUrl,
        
        // 📋 METADADOS DA COLEÇÃO
        metadata: {
          name: collection.name,
          description: collection.description,
          image: collection.imageUrl,
          attributes: [
            { trait_type: 'Type', value: 'custom_collection' },
            { trait_type: 'Category', value: collection.category },
            { trait_type: 'Team', value: collection.teamName },
            { trait_type: 'Season', value: collection.season },
            { trait_type: 'Total Supply', value: collection.totalSupply?.toString() },
            { trait_type: 'Minted', value: mintedNFTs.length.toString() },
            { trait_type: 'Unique Owners', value: Array.from(new Set(mintedNFTs.map((n: any) => n.minterAddress))).length.toString() },
            { trait_type: 'Contracts Used', value: Array.from(new Set(mintedNFTs.map((n: any) => n.contractAddress))).length.toString() }
          ]
        },
        
        // 🏪 DADOS PARA MARKETPLACE - VERIFICAR SE ESTÁ LISTADA
        marketplace: (() => {
          // 🔍 DOUBLE VERIFICATION: MongoDB + Thirdweb (SAME LOGIC AS LEGACY NFTs!)
          
          // 1. Check in MongoDB (local data)
          const mongoListedNFTs = mintedNFTs.filter((nft: any) => nft.marketplace?.isListed === true);
          
          // 2. Check in Thirdweb (real blockchain data) - LISTINGS AND AUCTIONS
          const thirdwebListedNFTs = mintedNFTs.filter((nft: any) => {
            if (!nft.tokenId || !nft.contractAddress) return false;
            const key = `${nft.tokenId}_${nft.contractAddress.toLowerCase()}`;
            return marketplaceData.listingsByKey.has(key);
          });

          const thirdwebAuctionNFTs = mintedNFTs.filter((nft: any) => {
            if (!nft.tokenId || !nft.contractAddress) return false;
            const key = `${nft.tokenId}_${nft.contractAddress.toLowerCase()}`;
            return marketplaceData.auctionsByKey.has(key);
          });
          
          // 3. Combine results (if ANY indicates listing/auction, it's active)
          const isListedMongo = mongoListedNFTs.length > 0;
          const isListedThirdweb = thirdwebListedNFTs.length > 0;
          const isAuctionThirdweb = thirdwebAuctionNFTs.length > 0;
          const isListedFinal = isListedMongo || isListedThirdweb;
          const isAuctionFinal = isAuctionThirdweb;
          
          console.log(`🔍 Verificação de marketplace para ${collection.name}:`, {
            mongoListed: mongoListedNFTs.length,
            thirdwebListed: thirdwebListedNFTs.length,
            thirdwebAuctions: thirdwebAuctionNFTs.length,
            finalListed: isListedFinal,
            finalAuction: isAuctionFinal
          });
          
          // 4. Marketplace data based on real verification
          const allListedNFTs = [...mongoListedNFTs, ...thirdwebListedNFTs];
          const allAuctionNFTs = [...thirdwebAuctionNFTs];
          const firstListedNFT = allListedNFTs[0];
          const firstAuctionNFT = allAuctionNFTs[0];
          
          const thirdwebListing = thirdwebListedNFTs.length > 0 ? 
            marketplaceData.listingsByKey.get(`${thirdwebListedNFTs[0].tokenId}_${thirdwebListedNFTs[0].contractAddress.toLowerCase()}`) : null;
          
          const thirdwebAuction = thirdwebAuctionNFTs.length > 0 ? 
            marketplaceData.auctionsByKey.get(`${thirdwebAuctionNFTs[0].tokenId}_${thirdwebAuctionNFTs[0].contractAddress.toLowerCase()}`) : null;
          
          return {
            isListed: isListedFinal, // ✅ RESULTADO FINAL DA VERIFICAÇÃO
            isAuction: isAuctionFinal, // ✅ NOVO: RESULTADO FINAL DE AUCTION
            isListable: true,
            canTrade: true,
            verified: true,
            collection: collection.name,
            category: 'launchpad', // Specific category for launchpad
            isCollection: true,
            isCustomCollection: true,
            type: 'launchpad_collection', // Mark as launchpad
            isLaunchpadCollection: true, // Explicit flag
            mintedUnits: mintedNFTs.length,
            totalUnits: collection.totalSupply || mintedNFTs.length,
            availableUnits: (collection.totalSupply || 0) - mintedNFTs.length,
            
            // Data from listed NFTs AND auction (combining sources)
            listedNFTs: allListedNFTs,
            auctionNFTs: allAuctionNFTs,
            mongoListedCount: mongoListedNFTs.length,
            thirdwebListedCount: thirdwebListedNFTs.length,
            thirdwebAuctionCount: thirdwebAuctionNFTs.length,
            
            // Price from listing or auction (prioritize auction then Thirdweb)
            price: thirdwebAuction ? 
              `${thirdwebAuction.minimumBidAmount?.toString()} (Bid)` :
              (thirdwebListing ? 
                thirdwebListing.currencyValuePerToken?.displayValue || thirdwebListing.pricePerToken?.toString() :
                (firstListedNFT?.marketplace?.priceFormatted || 'Not listed')),
            
            // Additional Thirdweb data (listing)
            thirdwebData: thirdwebListing ? {
              listingId: thirdwebListing.id.toString(),
              price: thirdwebListing.pricePerToken?.toString(),
              currency: thirdwebListing.currencyValuePerToken?.symbol || 'MATIC',
              endTime: thirdwebListing.endTimeInSeconds ? thirdwebListing.endTimeInSeconds.toString() : null
            } : null,

            // Additional Thirdweb data (auction)
            thirdwebAuctionData: thirdwebAuction ? {
              auctionId: thirdwebAuction.auctionId?.toString(),
              minimumBidAmount: thirdwebAuction.minimumBidAmount?.toString(),
              buyoutBidAmount: thirdwebAuction.buyoutBidAmount?.toString(),
              currency: thirdwebAuction.currencyContractAddress || 'MATIC',
              endTime: thirdwebAuction.endTimestamp ? thirdwebAuction.endTimestamp.toString() : null,
              startTime: thirdwebAuction.startTimestamp ? thirdwebAuction.startTimestamp.toString() : null
            } : null
          };
        })(),
        
        // ⛓️ DADOS DA BLOCKCHAIN
        blockchain: {
          chainId: 80002,
          network: 'Polygon Amoy',
          verified: true,
          tokenId: collection._id.toString(),
          owner: collection.creatorWallet,
          contractType: 'Custom Collection'
        },
        
        // 📊 DADOS EXTRAS
        stats: {
          views: 0,
          likes: 0,
          sales: 0,
          totalMints: mintedNFTs.length,
          uniqueOwners: Array.from(new Set(mintedNFTs.map((n: any) => n.minterAddress))).length
        },
        
        // 🗂️ IDENTIFICADORES
        _id: collection._id.toString(),
        mongoId: collection._id.toString(),
        customCollectionId: collection._id.toString(), // ✨ ID PARA DETECÇÃO
        type: 'custom_collection',
        category: collection.category,
        
        // 🎨 DADOS ESPECÍFICOS DE CUSTOM COLLECTION
        customCollection: {
          mintedNFTs: mintedNFTs.map((nft: any) => ({
            tokenId: nft.tokenId,
            contractAddress: nft.contractAddress,
            owner: nft.minterAddress,
            mintedAt: nft.mintedAt,
            transactionHash: nft.transactionHash
          }))
        },
        
        // 📅 TIMESTAMPS
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt || collection.createdAt
      };

      customCollectionNFTs.push(collectionEntry);
    }

    console.log(`🎨 Found ${customCollectionNFTs.length} custom collections`);
    return customCollectionNFTs.slice(0, limit);

  } catch (error) {
    console.error('❌ Error fetching custom collections:', error);
    return [];
  }
}

/**
 * Função para buscar NFTs do Launchpad mintados
 */
async function getLaunchpadNFTs(db: any, owner?: string | null, limit: number = 50) {
  try {
    // Search for active launchpad collections with minted NFTs
    console.log('🔍 Buscando launchpad_collections com minted > 0...');
    const launchpadCollections = await db.collection('launchpad_collections').find({
      status: { $in: ['active', 'upcoming', 'approved'] },
      minted: { $gt: 0 }
    }).toArray();
    console.log(`📋 Encontradas ${launchpadCollections.length} coleções launchpad com minted > 0:`, 
      launchpadCollections.map((c: any) => ({ name: c.name, minted: c.minted, status: c.status, _id: c._id })));

    const launchpadNFTs = [];

    for (const collection of launchpadCollections) {
      // Filter by owner if specified (for creator collections)
      if (owner && collection.creator?.wallet !== owner) continue;

      // ✅ CREATE ONLY ONE ENTRY PER COLLECTION (not per minted unit)
      const collectionNFT = {
        // 🔑 DADOS OBRIGATÓRIOS PARA THIRDWEB MARKETPLACE V3
        tokenId: "collection", // Identificador especial para coleções
        contractAddress: collection.contractAddress || "0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639",
        owner: collection.creator?.wallet || "0x0000000000000000000000000000000000000000",
        
        // 🖼️ IMAGE DIRECTLY AT TOP LEVEL (for compatibility)
        image: collection.image || collection.imageUrl,
        imageUrl: collection.image || collection.imageUrl,
        
        // 📋 METADADOS DA COLEÇÃO (uma imagem representa toda a coleção)
        metadata: {
          name: collection.name,
          description: collection.description || `${collection.name} Collection from Launchpad`,
          image: collection.image || collection.imageUrl,
          attributes: [
            { trait_type: 'Type', value: 'launchpad_collection' },
            { trait_type: 'Total Supply', value: collection.totalSupply?.toString() || 'Unknown' },
            { trait_type: 'Minted', value: collection.minted?.toString() || '0' },
            { trait_type: 'Available', value: ((collection.totalSupply || 0) - (collection.minted || 0)).toString() },
            { trait_type: 'Creator', value: collection.creator?.name || 'Unknown' },
            { trait_type: 'Status', value: collection.status || 'active' },
            { trait_type: 'Launch Date', value: collection.launchDate || 'Unknown' }
          ]
        },
        
        // 🏪 MARKETPLACE DATA (specific for collections)
        marketplace: {
          isListed: false, // Coleções não são "listadas" individualmente
          isListable: false, // Não pode ser listada (é uma coleção, não NFT individual)
          canTrade: false, // Coleção não é negociável (unidades sim)
          verified: true,
          collection: collection.name,
          category: 'launchpad_collection',
          isCollection: true, // ✨ NOVO: Marca como entrada de coleção
          mintedUnits: collection.minted || 0, // ✨ NOVO: Quantidade de unidades mintadas
          totalUnits: collection.totalSupply || 0, // ✨ NOVO: Total de unidades disponíveis
          availableUnits: (collection.totalSupply || 0) - (collection.minted || 0) // ✨ NOVO: Unidades disponíveis
        },
        
        // ⛓️ DADOS DA BLOCKCHAIN
        blockchain: {
          chainId: 80002, // Polygon Amoy
          network: 'Polygon Amoy',
          transactionHash: null,
          explorerUrl: null,
          mintedAt: collection.createdAt
        },
        
        // 📊 DADOS EXTRAS (específicos para coleções)
        stats: {
          views: 0,
          likes: 0,
          sales: 0,
          totalMints: collection.minted || 0, // ✨ NOVO: Total de mints da coleção
          uniqueOwners: 1 // Em produção, seria calculado dos eventos do contrato
        },
        
        // 🗂️ IDENTIFICADORES
        _id: `collection_${collection._id}`,
        mongoId: collection._id.toString(),
        type: 'launchpad_collection', // ✨ MUDANÇA: Tipo específico para coleções
        collectionData: collection,
        
        // 📅 TIMESTAMPS
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt || collection.createdAt
      };

      launchpadNFTs.push(collectionNFT);
    }

    console.log(`🚀 Found ${launchpadNFTs.length} launchpad NFTs from ${launchpadCollections.length} collections`);
    return launchpadNFTs.slice(0, limit);

  } catch (error) {
    console.error('❌ Error fetching launchpad NFTs:', error);
    return [];
  }
}

/**
 * GET handler para buscar todos os NFTs mintados em formato compatível com Thirdweb Marketplace V3
 * Retorna tokenId, contractAddress, owner, metadata, etc.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏪 GET Marketplace NFTs - Formato Thirdweb V3');
    
    const owner = request.nextUrl.searchParams.get('owner');
    const chainId = request.nextUrl.searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    const type = request.nextUrl.searchParams.get('type'); // jersey, stadium, badge
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 🔍 BUSCAR LISTAGENS E AUCTIONS DO THIRDWEB (MESMA LÓGICA DAS NFTs LEGACY!)
    console.log('🚀 Iniciando verificação do marketplace Thirdweb...');
    const marketplaceData = await getThirdwebMarketplaceData();
    console.log(`✅ Thirdweb marketplace carregado:`, {
      listings: marketplaceData.listingsByKey.size,
      auctions: marketplaceData.auctionsByKey.size,
      total: marketplaceData.listingsByKey.size + marketplaceData.auctionsByKey.size
    });
    
    // Buscar NFTs de todas as coleções (incluindo launchpad)
    const collections = ['jerseys', 'stadiums', 'badges'];
    const allNFTs = [];
    
    // Adicionar NFTs do launchpad de coleções ativas
    const launchpadNFTs = await getLaunchpadNFTs(db, owner, limit);
    console.log('🚀 Launchpad NFTs encontradas:', launchpadNFTs.length);

    for (const collectionName of collections) {
      // Filtrar por tipo se especificado
      if (type && type !== collectionName.slice(0, -1)) continue; // Remove 's' do final
      
      const collection = db.collection(collectionName);
      
      // Filtros para NFTs mintados
      const filter: any = {
        status: 'Approved',
        $or: [
          { transactionHash: { $exists: true, $nin: [null, ''] } },
          { isMinted: true },
          { mintStatus: 'minted' },
          { mintStatus: 'success' }
        ],
        // 🚫 EXCLUIR NFTs que pertencem a Custom Collections (evitar duplicatas)
        // Verificar se a imagem não é de uma custom collection
        $nor: [
          { 'metadata.image': { $regex: 'collection_jerseys' } },
          { name: { $regex: 'Collection #' } }
        ]
      };

      // Filtrar por owner se especificado
      if (owner) {
        filter['creator.wallet'] = owner;
      }

      const nfts = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      // Processar NFTs para formato Marketplace V3
      const processedNFTs = nfts.map((nft, index) => {
        // Gerar tokenId baseado no _id do MongoDB se não existir
        const tokenId = nft.tokenId || nft._id.toString();
        
        return {
          // 🔑 DADOS OBRIGATÓRIOS PARA THIRDWEB MARKETPLACE V3
          tokenId: tokenId,
          contractAddress: chainId === '80002' 
            ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
            : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
          owner: nft.creator?.wallet || nft.creatorWallet,
          
          // 📋 METADADOS DO NFT
          metadata: {
            name: nft.name,
            description: nft.description || `AI-generated ${collectionName.slice(0, -1)}`,
            image: nft.imageUrl || nft.image_url,
            attributes: nft.attributes || [
              { trait_type: 'Type', value: collectionName.slice(0, -1) },
              { trait_type: 'Status', value: 'Minted' },
              { trait_type: 'Creator', value: nft.creator?.wallet?.slice(0, 6) + '...' || 'Unknown' }
            ]
          },
          
          // 🏪 DADOS PARA MARKETPLACE
          marketplace: {
            isListed: false, // Inicialmente não listado
            isListable: true, // Pode ser listado
            canTrade: true,
            verified: true,
            collection: collectionName,
            category: collectionName.slice(0, -1)
          },
          
          // ⛓️ DADOS DA BLOCKCHAIN
          blockchain: {
            chainId: parseInt(chainId),
            network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
            transactionHash: nft.transactionHash,
            explorerUrl: nft.transactionHash 
              ? `https://amoy.polygonscan.com/tx/${nft.transactionHash}`
              : null,
            mintedAt: nft.mintedAt || nft.createdAt
          },
          
          // 📊 DADOS EXTRAS
          stats: {
            views: 0,
            likes: 0,
            sales: 0
          },
          
          // 🗂️ IDENTIFICADORES
          _id: nft._id,
          mongoId: nft._id.toString(),
          type: collectionName.slice(0, -1),
          
          // 📅 TIMESTAMPS
          createdAt: nft.createdAt,
          updatedAt: nft.updatedAt || nft.createdAt
        };
      });

      allNFTs.push(...processedNFTs);
    }

    // Adicionar NFTs do launchpad aos resultados
    allNFTs.push(...launchpadNFTs);

    // Buscar e adicionar custom collections (COM VERIFICAÇÃO DO THIRDWEB!)
    const customCollections = await getCustomCollections(db, marketplaceData, limit);
    allNFTs.push(...customCollections);

    // Ordenar por data de criação (mais recentes primeiro)
    allNFTs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limitar resultado final
    const finalNFTs = allNFTs.slice(0, limit);

    console.log(`✅ Found ${finalNFTs.length} minted NFTs for marketplace`);
    
    // Log detalhado para debug
    if (finalNFTs.length > 0) {
      console.log('🎯 Marketplace NFTs ready:');
      finalNFTs.forEach((nft, index) => {
        console.log(`${index + 1}. ${nft.metadata.name} (${nft.type}) - Token ID: ${nft.tokenId}`);
      });
    } else {
      console.log('⚠️ No minted NFTs found for marketplace');
    }

    // 📊 ESTATÍSTICAS
    const stats = {
      total: finalNFTs.length,
      byType: {
        jerseys: finalNFTs.filter(n => n.type === 'jersey').length,
        stadiums: finalNFTs.filter(n => n.type === 'stadium').length,
        badges: finalNFTs.filter(n => n.type === 'badge').length,
        launchpad_collections: finalNFTs.filter(n => n.type === 'launchpad_collection').length,
        custom_collections: finalNFTs.filter(n => n.type === 'custom_collection').length,
        launchpad_total_units: finalNFTs.filter(n => n.type === 'launchpad_collection').reduce((total, nft) => total + ((nft.marketplace as any)?.mintedUnits || 0), 0),
        custom_total_units: finalNFTs.filter(n => n.type === 'custom_collection').reduce((total, nft) => total + ((nft.marketplace as any)?.mintedUnits || 0), 0)
      },
      chainId: parseInt(chainId),
      network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
      contractAddress: chainId === '80002' 
        ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
        : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ
    };

    return NextResponse.json({
      success: true,
      data: finalNFTs,
      stats,
      filters: {
        owner: owner || 'all',
        type: type || 'all',
        chainId: parseInt(chainId),
        onlyMinted: true,
        limit
      },
      thirdweb: {
        contractAddress: stats.contractAddress,
        chainId: parseInt(chainId),
        marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET,
        ready: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching marketplace NFTs:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch marketplace NFTs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 