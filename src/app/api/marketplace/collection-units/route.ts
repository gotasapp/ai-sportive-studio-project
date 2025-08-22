import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';


/**
 * @swagger
 * /api/marketplace/collection-units:
 *   get:
 *     summary: Get individual units from a collection
 *     description: |
 *       Retrieves all individual NFT units from a specific collection with complete trading data.
 *       Supports both custom collections and launchpad collections.
 *       Includes real-time marketplace status (listings, auctions) from blockchain.
 *     tags: [Collections, Marketplace]
 *     parameters:
 *       - in: query
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID (MongoDB ObjectId for custom/launchpad collections, or category name for standard collections)
 *         example: "689e70b34341ccf79a223460"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [jersey, stadium, badge, launchpad, custom]
 *         description: Collection category
 *         example: "launchpad"
 *     responses:
 *       200:
 *         description: Successfully retrieved collection units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/NFT'
 *                       - type: object
 *                         properties:
 *                           contractAddress:
 *                             type: string
 *                             description: Smart contract address (added at root level)
 *                           marketplace:
 *                             type: object
 *                             properties:
 *                               isListed:
 *                                 type: boolean
 *                                 description: Whether NFT is currently listed for sale
 *                               isAuction:
 *                                 type: boolean
 *                                 description: Whether NFT is currently in auction
 *                               canTrade:
 *                                 type: boolean
 *                                 description: Whether NFT can be traded
 *                               verified:
 *                                 type: boolean
 *                                 description: Whether NFT is verified
 *                               price:
 *                                 type: string
 *                                 description: Current price (formatted)
 *                               listingId:
 *                                 type: string
 *                                 description: Blockchain listing ID
 *                               auctionId:
 *                                 type: string
 *                                 description: Blockchain auction ID
 *                               thirdwebData:
 *                                 type: object
 *                                 description: Raw Thirdweb marketplace data
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of units
 *                     listed:
 *                       type: number
 *                       description: Number of units listed for sale
 *                     auctions:
 *                       type: number
 *                       description: Number of units in auction
 *                     available:
 *                       type: number
 *                       description: Number of units available for trade
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export async function GET(request: NextRequest) {
  try {
    const collectionId = request.nextUrl.searchParams.get('collectionId');
    const category = request.nextUrl.searchParams.get('category');
    
    if (!collectionId) {
      return NextResponse.json({
        success: false,
        error: 'collectionId é obrigatório'
      }, { status: 400 });
    }

    console.log('🎯 Buscando unidades individuais para:', { collectionId, category });

    // 1. BUSCAR DADOS REAIS DO MARKETPLACE (mesma lógica do backup)
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Usar CHZ Mainnet ao invés de Polygon Amoy
    const chzChain = defineChain({
      id: 88888,
      name: 'Chiliz Chain',
      nativeCurrency: { name: 'CHZ', symbol: 'CHZ', decimals: 18 },
      rpc: process.env.NEXT_PUBLIC_CHZ_RPC_URL || 'https://rpc.ankr.com/chiliz',
      blockExplorers: [{ name: 'ChilizScan', url: 'https://scan.chiliz.com' }]
    });

    const marketplaceContract = getContract({
      client,
      chain: chzChain,
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '0x2403863b192b649448793dfbB6926Cdd0d7A14Ad',
    });

    // Buscar listings e auctions em paralelo
    const [validListings, validAuctions] = await Promise.all([
      getAllValidListings({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(500),
      }),
      getAllAuctions({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(500),
      })
    ]);

    console.log(`🔍 Marketplace data:`, {
      listings: validListings.length,
      auctions: validAuctions.length
    });

    // Criar mapas para lookup rápido
    const listingsByKey = new Map();
    const auctionsByKey = new Map();
    
    validListings.forEach(listing => {
      const key = `${listing.tokenId.toString()}_${listing.assetContractAddress.toLowerCase()}`;
      listingsByKey.set(key, listing);
    });

    // ✅ FILTRAR APENAS AUCTIONS ATIVOS (não cancelados)
    console.log('🔍 TODOS OS AUCTIONS ANTES DO FILTRO:', validAuctions.map(a => ({
      id: a.id?.toString(),
      tokenId: a.tokenId?.toString(),
      status: a.status,
      assetContract: a.assetContractAddress
    })));
    
    validAuctions.forEach(auction => {
      // Verificar se o auction não foi cancelado (status !== 3)
      if (auction.status?.toString() !== '3' && auction.status !== 'CANCELLED') {
        const key = `${auction.tokenId.toString()}_${auction.assetContractAddress.toLowerCase()}`;
        auctionsByKey.set(key, auction);
        console.log(`✅ Auction ativo detectado: ${auction.id} (tokenId: ${auction.tokenId}, contract: ${auction.assetContractAddress})`);
      } else {
        console.log(`⚠️ Auction cancelado filtrado: ${auction.id} (tokenId: ${auction.tokenId}, status: ${auction.status})`);
      }
    });

    // 2. CONECTAR MONGODB
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);

    let units = [];

    // 3. BUSCAR UNIDADES BASEADO NO TIPO DE COLEÇÃO
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(collectionId);
    
    if (isObjectId) {
      // É Custom/Launchpad Collection - buscar em custom_collection_mints (fallback launchpad)
      console.log('🎨 Buscando unidades de Custom/Launchpad Collection...');
      
      // ✅ CONVERTER STRING PARA OBJECTID
      const { ObjectId } = require('mongodb');
      const objectId = new ObjectId(collectionId);
      
      // 1) Custom Collections (caminho original)
      units = await db.collection('custom_collection_mints')
        .find({ customCollectionId: objectId })
        .sort({ mintedAt: -1 })
        .toArray();
      
      // 2) Fallback Launchpad: se nada foi encontrado, verificar se a collection é de launchpad
      if (units.length === 0) {
        const launchpadCollection = await db.collection('launchpad_collections').findOne({ _id: objectId });
        if (launchpadCollection) {
          console.log('🚀 Collection é Launchpad. Buscando unidades mintadas na tabela launchpad_collection_mints...');
          
          // Primeiro buscar na nova tabela de launchpad mints
          units = await db.collection('launchpad_collection_mints')
            .find({ launchpadCollectionId: objectId })
            .sort({ mintedAt: -1 })
            .toArray();
          
          console.log(`📋 Unidades encontradas na launchpad_collection_mints: ${units.length}`);
          
          // Se ainda não encontrou, buscar legacy pelo contractAddress (para compatibilidade)
          if (units.length === 0) {
            console.log('🔍 Fallback: Buscando unidades pelo contractAddress em coleções legacy...');
            const lpCategory = (launchpadCollection.category || 'jerseys').toLowerCase();
            const collectionName = lpCategory.includes('stadium') ? 'stadiums' : lpCategory.includes('badge') ? 'badges' : 'jerseys';
            const filters: any = {
              status: 'Approved',
              contractAddress: launchpadCollection.contractAddress,
              $or: [
                { transactionHash: { $exists: true, $nin: [null, ''] } },
                { isMinted: true },
                { mintStatus: { $in: ['minted', 'success'] } }
              ]
            };
            units = await db.collection(collectionName)
              .find(filters)
              .sort({ createdAt: -1 })
              .limit(100)
              .toArray();
            console.log(`📋 Unidades encontradas via contractAddress (${collectionName}): ${units.length}`);
          }
        }
      }
      
      console.log(`📋 Unidades encontradas (custom/launchpad): ${units.length}`);
      
      // 🔍 DEBUG: Se não encontrou, amostrar alguns documentos para investigar campos
      if (units.length === 0) {
        const sample = await db.collection('custom_collection_mints').find({}).limit(3).toArray();
        console.log('📋 Samples custom_collection_mints (debug):', sample.map((m: any) => ({
          customCollectionId: m.customCollectionId?.toString(), tokenId: m.tokenId, name: m.name
        })));
      }
      
    } else {
      // É Standard Collection - buscar na coleção específica (jerseys/stadiums/badges)
      console.log('⚽ Buscando unidades de Standard Collection...');
      
      const collectionName = category === 'jersey' ? 'jerseys' : 
                           category === 'stadium' ? 'stadiums' : 
                           category === 'badge' ? 'badges' : 'jerseys';
      
      units = await db.collection(collectionName)
        .find({ status: 'Approved' })
        .sort({ createdAt: -1 })
        .toArray();
        
      console.log(`📋 Encontradas ${units.length} unidades de ${collectionName}`);
    }

    // 4. APLICAR LÓGICA DE TRADING (EXATAMENTE COMO NO BACKUP!)
    const unitsWithTrading = units.map(unit => {
      const tokenId = unit.tokenId?.toString();
      // 🎯 CORREÇÃO: Para launchpad collections, o contractAddress está em marketplace.contractAddress
      const contractAddress = (unit.contractAddress || unit.marketplace?.contractAddress)?.toLowerCase();
      
      if (!tokenId || !contractAddress) {
        return {
          ...unit,
          marketplace: {
            isListed: false,
            isAuction: false,
            canTrade: false,
            error: 'Missing tokenId or contractAddress'
          }
        };
      }

      const key = `${tokenId}_${contractAddress}`;
      const listing = listingsByKey.get(key);
      const auction = auctionsByKey.get(key);

      // 🔍 DEBUG ESPECÍFICO PARA NFT #0
      if (tokenId === '0' && contractAddress.toLowerCase().includes('cd2ac8b9')) {
        console.log('🎯 DEBUG NFT #0:', {
          tokenId,
          contractAddress,
          hasListing: !!listing,
          hasAuction: !!auction,
          auctionId: auction?.id?.toString(),
          auctionStatus: auction?.status
        });
      }
      
      // Determinar estados
      const isListed = !!listing;
      const isAuction = !!auction;
      const canTrade = true;

      // Preço (priorizar auction)
      let price = 'Not for sale';
      let displayPrice = 'Not for sale';
      
      if (auction) {
        // Converter Wei para MATIC
        const bidInWei = auction.minimumBidAmount;
        const bidInMatic = bidInWei ? (Number(bidInWei) / 1e18).toFixed(4) : '0';
        price = `${bidInMatic} (Bid)`;
        displayPrice = `${bidInMatic} CHZ (Bid)`;
      } else if (listing) {
        // Converter Wei para CHZ
        const priceInWei = listing.pricePerToken || listing.currencyValuePerToken?.value;
        const priceInChz = priceInWei ? (Number(priceInWei) / 1e18).toFixed(4) : '0';
        price = priceInChz;
        displayPrice = `${priceInChz} CHZ`;
        
        // Debug de preço
        console.log('💰 PREÇO DEBUG:', {
          tokenId,
          priceInWei: priceInWei?.toString(),
          priceInMatic,
          displayValue: listing.currencyValuePerToken?.displayValue
        });
      }

      return {
        ...unit,
        id: unit._id.toString(),
        name: unit.name || `${unit.metadata?.name || 'NFT'} #${tokenId}`,
        imageUrl: unit.imageUrl || unit.metadata?.image || '',
        contractAddress: contractAddress, // 🎯 ADICIONAR contractAddress no nível raiz
        
        // 🎯 MARKETPLACE DATA (MESMA LÓGICA DO BACKUP)
        marketplace: {
          isListed,
          isAuction,
          canTrade,
          verified: true,
          price: displayPrice,
          
          // Dados do listing
          listingId: listing?.id?.toString(),
          listingPrice: listing?.pricePerToken?.toString(),
          listingCurrency: listing?.currencyValuePerToken?.symbol || 'CHZ',
          listingEndTime: listing?.endTimeInSeconds ? new Date(Number(listing.endTimeInSeconds) * 1000) : null,
          
          // Dados do auction
          auctionId: auction?.id?.toString() || auction?.auctionId?.toString(),
          auctionMinBid: auction?.minimumBidAmount?.toString(),
          auctionBuyout: auction?.buyoutBidAmount?.toString(),
          auctionEndTime: auction?.endTimestamp ? new Date(Number(auction.endTimestamp) * 1000) : null,
          auctionStartTime: auction?.startTimestamp ? new Date(Number(auction.startTimestamp) * 1000) : null,
          
          // Metadados para identificação
          thirdwebData: listing ? {
            listingId: listing.id.toString(),
            price: listing.pricePerToken?.toString(),
            currency: listing.currencyValuePerToken?.symbol || 'CHZ',
            endTime: listing.endTimeInSeconds ? listing.endTimeInSeconds.toString() : null
          } : null,
          
          thirdwebAuctionData: auction ? {
            auctionId: auction.id?.toString() || auction.auctionId?.toString(),
            minimumBidAmount: auction.minimumBidAmount?.toString(),
            buyoutBidAmount: auction.buyoutBidAmount?.toString(),
            currency: 'CHZ',
            endTime: auction.endTimestamp ? auction.endTimestamp.toString() : null,
            startTime: auction.startTimestamp ? auction.startTimestamp.toString() : null,
            creatorAddress: auction.creatorAddress || auction.creator
          } : null
        }
      };
    });

    // 5. ESTATÍSTICAS
    const stats = {
      total: unitsWithTrading.length,
      listed: unitsWithTrading.filter(u => u.marketplace.isListed).length,
      auctions: unitsWithTrading.filter(u => u.marketplace.isAuction).length,
      notForSale: unitsWithTrading.filter(u => !u.marketplace.isListed && !u.marketplace.isAuction).length
    };

    console.log('📊 Collection units stats:', stats);

    return NextResponse.json({
      success: true,
      data: unitsWithTrading,
      stats,
      collectionInfo: {
        id: collectionId,
        category,
        isCustomCollection: isObjectId
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar unidades da coleção:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}