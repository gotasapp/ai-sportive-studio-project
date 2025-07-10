import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';

/**
 * API para buscar NFTs listados no marketplace da Thirdweb
 * Retorna apenas listagens ativas do nosso contrato
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('start') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log('🏪 Fetching marketplace listings...', { start, limit });

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET!,
    });

    console.log('📋 Marketplace contract:', process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET);

    // Buscar todas as listagens válidas
    const validListings = await getAllValidListings({
      contract: marketplaceContract,
      start,
      count: limit,
    });

    console.log(`✅ Found ${validListings.length} valid listings`);

    // Filtrar apenas NFTs do nosso contrato
    const ourContractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET?.toLowerCase();
    const filteredListings = validListings.filter(listing => 
      listing.assetContractAddress.toLowerCase() === ourContractAddress
    );

    console.log(`🎯 Found ${filteredListings.length} listings from our NFT contract`);

    // Processar listagens para formato padronizado
    const processedListings = filteredListings.map(listing => ({
      // IDs - converter BigInt para string
      id: listing.id.toString(),
      listingId: listing.id.toString(),
      tokenId: listing.tokenId.toString(),
      
      // Contrato e owner
      contractAddress: listing.assetContractAddress,
      assetContractAddress: listing.assetContractAddress,
      owner: listing.creatorAddress,
      creatorAddress: listing.creatorAddress,
      
      // Preços e moeda - converter BigInt para string
      pricePerToken: listing.pricePerToken.toString(),
      price: listing.pricePerToken.toString(),
      currency: listing.currencyContractAddress,
      currencyContractAddress: listing.currencyContractAddress,
      currencyValuePerToken: {
        value: listing.currencyValuePerToken?.value?.toString() || '0',
        displayValue: listing.currencyValuePerToken?.displayValue || '0',
        symbol: listing.currencyValuePerToken?.symbol || 'MATIC',
        decimals: listing.currencyValuePerToken?.decimals || 18
      },
      
      // Detalhes da listagem - converter BigInt para string/number
      quantity: listing.quantity.toString(),
      status: Number(listing.status),
      type: Number(listing.type),
      isReservedListing: listing.isReservedListing,
      
      // Timestamps - converter BigInt para string
      startTimeInSeconds: listing.startTimeInSeconds.toString(),
      endTimeInSeconds: listing.endTimeInSeconds.toString(),
      
      // Metadados de sync
      source: 'thirdweb-marketplace',
      fetchedAt: new Date().toISOString(),
      isListed: true,
      isActive: Number(listing.status) === 1, // 1 = CREATED/ACTIVE
      
      // Debug info - converter BigInt para string
      debug: {
        originalId: listing.id.toString(),
        originalTokenId: listing.tokenId.toString(),
        originalStatus: Number(listing.status),
        originalType: Number(listing.type)
      }
    }));

    const response = {
      success: true,
      listings: processedListings,
      total: processedListings.length,
      metadata: {
        start,
        limit,
        totalFound: validListings.length,
        fromOurContract: processedListings.length,
        ourContractAddress,
        marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Marketplace listings processed:', {
      total: processedListings.length,
      active: processedListings.filter(l => l.isActive).length,
      ourContract: ourContractAddress?.slice(0, 8) + '...'
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching marketplace listings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch marketplace listings',
      details: error instanceof Error ? error.message : 'Unknown error',
      listings: []
    }, { status: 500 });
  }
}

/**
 * POST para sincronizar listagens específicas
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userWallet, forceUpdate = false } = body;

    console.log('🔄 Syncing marketplace listings for user:', userWallet);

    // Reutilizar lógica do GET mas filtrar por usuário
    const { searchParams } = new URL(request.url);
    const listings = await GET(request);
    const data = await listings.json();

    if (!data.success) {
      return listings;
    }

    // Filtrar por usuário se especificado
    let filteredListings = data.listings;
    if (userWallet) {
      filteredListings = data.listings.filter((listing: any) => 
        listing.creatorAddress.toLowerCase() === userWallet.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      listings: filteredListings,
      total: filteredListings.length,
      userWallet,
      forceUpdate,
      metadata: {
        ...data.metadata,
        filteredByUser: !!userWallet,
        userListings: filteredListings.length
      }
    });

  } catch (error) {
    console.error('❌ Error syncing marketplace listings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync marketplace listings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 