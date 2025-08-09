import { NextResponse } from 'next/server';

/**
 * API para testar se a API marketplace/nfts está retornando isListed correto
 */
export async function GET() {
  try {
    console.log('🔍 Testando resposta da API /api/marketplace/nfts...');

    // Chamar nossa própria API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/marketplace/nfts`);
    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({
        success: false,
        error: 'API retornou erro',
        data: data
      });
    }

    console.log(`📊 API retornou ${data.data.length} NFTs`);

    // Analisar custom collections
    const customCollections = data.data.filter((nft: any) => nft.type === 'custom_collection');
    console.log(`🎨 ${customCollections.length} custom collections encontradas`);

    // Verificar marketplace.isListed para cada uma
    const listingAnalysis = customCollections.map((nft: any) => ({
      name: nft.metadata?.name || nft.name,
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      'marketplace.isListed': nft.marketplace?.isListed,
      'marketplace.price': nft.marketplace?.price,
      'marketplace.listedNFTs': nft.marketplace?.listedNFTs?.length || 0,
      isListedFromRoot: nft.isListed,
      priceFromRoot: nft.price
    }));

    console.log('📋 Análise de listagens:', listingAnalysis);

    return NextResponse.json({
      success: true,
      data: {
        totalNFTs: data.data.length,
        customCollections: customCollections.length,
        listingAnalysis,
        rawCustomCollections: customCollections.slice(0, 3) // Primeiras 3 para debug
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao testar API:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao testar API' },
      { status: 500 }
    );
  }
}