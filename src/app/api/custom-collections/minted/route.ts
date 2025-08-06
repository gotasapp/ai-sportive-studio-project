import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const customCollectionId = request.nextUrl.searchParams.get('customCollectionId');
    const category = request.nextUrl.searchParams.get('category'); // jersey, stadium, badge
    const subcategoryType = request.nextUrl.searchParams.get('subcategoryType'); // home, away, third
    const teamName = request.nextUrl.searchParams.get('teamName');
    const owner = request.nextUrl.searchParams.get('owner');
    const contractAddress = request.nextUrl.searchParams.get('contractAddress');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    // Conectar ao banco
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');

    // Construir query de filtros
    let query: any = {};
    
    if (customCollectionId) {
      query.customCollectionId = customCollectionId;
    }
    if (category) {
      query.category = category;
    }
    if (subcategoryType) {
      query.subcategoryType = subcategoryType;
    }
    if (teamName) {
      query.teamName = { $regex: teamName, $options: 'i' };
    }
    if (owner) {
      query.minterAddress = owner;
    }
    if (contractAddress) {
      query.contractAddress = contractAddress;
    }

    // Buscar mints de coleções personalizadas
    const mintedNFTs = await db.collection('custom_collection_mints')
      .find(query)
      .sort({ mintedAt: -1 })
      .limit(limit)
      .toArray();

    // Buscar informações das coleções para enriquecer os dados
    const customCollectionIds = Array.from(new Set(mintedNFTs.map(nft => nft.customCollectionId)));
    const customCollections = await db.collection('custom_collections')
      .find({ _id: { $in: customCollectionIds } })
      .toArray();

    // Criar mapa de coleções para lookup rápido
    const collectionMap = new Map(
      customCollections.map(col => [col._id.toString(), col])
    );

    // Enriquecer dados dos NFTs com informações da coleção
    const enrichedNFTs = mintedNFTs.map(nft => {
      const collection = collectionMap.get(nft.customCollectionId.toString());
      
      return {
        ...nft,
        // Dados da coleção
        collectionName: collection?.name || '',
        collectionDescription: collection?.description || '',
        collectionImage: collection?.imageUrl || '',
        
        // Dados formatados para marketplace
        id: nft._id.toString(),
        name: `${collection?.name || 'NFT'} #${nft.tokenId}`,
        description: collection?.description || '',
        image: nft.imageUrl,
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress, // Cada coleção tem seu contrato
        owner: nft.minterAddress,
        price: nft.price,
        currency: 'MATIC',
        
        // Metadados específicos
        metadata: {
          category: nft.category,
          subcategoryType: nft.subcategoryType,
          teamName: nft.teamName,
          season: nft.season,
          mintedAt: nft.mintedAt
        },
        
        // Compatibilidade com marketplace
        isListed: false,
        marketplace: {
          isListable: true,
          canTrade: true,
          verified: true
        }
      };
    });

    // Separar por categoria
    const jerseys = enrichedNFTs.filter(nft => nft.metadata.category === 'jersey');
    const stadiums = enrichedNFTs.filter(nft => nft.metadata.category === 'stadium');
    const badges = enrichedNFTs.filter(nft => nft.metadata.category === 'badge');

    console.log('📋 Mints de coleções personalizadas encontrados:', {
      total: enrichedNFTs.length,
      jerseys: jerseys.length,
      stadiums: stadiums.length,
      badges: badges.length,
      filters: { customCollectionId, category, subcategoryType, teamName, owner }
    });

    return NextResponse.json({
      success: true,
      data: enrichedNFTs,
      total: enrichedNFTs.length,
      categories: {
        jerseys,
        stadiums,
        badges
      },
      filters: {
        customCollectionId,
        category,
        subcategoryType,
        teamName,
        owner,
        contractAddress
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar mints de coleções personalizadas:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch custom collection mints'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customCollectionId, 
      tokenId, 
      transactionHash, 
      minterAddress,
      metadataUrl,
      imageUrl,
      price 
    } = body;
    
    console.log('🔄 Movendo NFT para coleção de personalizadas mintadas:', {
      customCollectionId,
      tokenId,
      transactionHash
    });

    if (!customCollectionId || !tokenId || !transactionHash || !minterAddress) {
      return NextResponse.json({ 
        success: false,
        error: 'customCollectionId, tokenId, transactionHash e minterAddress são obrigatórios'
      }, { status: 400 });
    }

    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');

    // Buscar dados da coleção personalizada
    const customCollection = await db.collection('custom_collections').findOne({ 
      _id: customCollectionId 
    });
    
    if (!customCollection) {
      return NextResponse.json({ 
        success: false,
        error: 'Coleção personalizada não encontrada'
      }, { status: 404 });
    }

    // Criar documento para coleção de mintados
    const mintedCustomNFT = {
      customCollectionId,
      contractAddress: customCollection.contractAddress,
      category: customCollection.category,
      teamName: customCollection.teamName,
      season: customCollection.season,
      subcategoryType: customCollection.subcategoryType,
      tokenId,
      metadataUrl: metadataUrl || '',
      imageUrl: imageUrl || '',
      transactionHash,
      minterAddress,
      price: price || "0",
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      status: 'Approved',
      type: 'custom_collection'
    };

    // Inserir na coleção de mintados
    await db.collection('custom_collection_mints').insertOne(mintedCustomNFT);

    // Atualizar contador na coleção
    await db.collection('custom_collections').updateOne(
      { _id: customCollectionId },
      { $inc: { minted: 1 } }
    );

    console.log('✅ NFT de coleção personalizada movido para mintados:', {
      customCollectionId,
      tokenId,
      category: customCollection.category,
      contractAddress: customCollection.contractAddress
    });

    return NextResponse.json({
      success: true,
      message: 'NFT moved to minted custom collections successfully',
      data: mintedCustomNFT
    });

  } catch (error: any) {
    console.error('❌ Erro ao mover NFT para coleções personalizadas mintadas:', error);
    return NextResponse.json({
      error: error.message || 'Failed to move NFT to minted custom collections'
    }, { status: 500 });
  }
}