import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Buscando custom collection com ID:', params.id);
    
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db(DB_NAME);
    
    // Buscar coleção específica
    let customCollection: any = null;
    try {
      customCollection = await db.collection('custom_collections').findOne({
        _id: new ObjectId(params.id)
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (!customCollection) {
      console.log('❌ Custom collection não encontrada');
      return NextResponse.json(
        { success: false, error: 'Custom collection not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Custom collection encontrada:', customCollection.name);
    
    // Buscar NFTs mintadas desta coleção
    const mintedNFTs = await db.collection('custom_collection_mints')
      .find({ customCollectionId: new ObjectId(params.id) })
      .sort({ mintedAt: -1 })
      .toArray();
      
    console.log('📦 NFTs mintadas encontradas:', mintedNFTs.length);
    
    // Formatar dados para o frontend
    const formattedCollection = {
      _id: customCollection._id.toString(),
      name: customCollection.name,
      description: customCollection.description,
      image: customCollection.imageUrl,
      imageUrl: customCollection.imageUrl,
      category: customCollection.category,
      subcategoryType: customCollection.subcategoryType,
      teamName: customCollection.teamName,
      season: customCollection.season,
      totalSupply: customCollection.totalSupply,
      price: customCollection.price,
      contractAddress: customCollection.contractAddress,
      creatorWallet: customCollection.creatorWallet,
      status: customCollection.status,
      type: 'custom',
      createdAt: customCollection.createdAt,
      updatedAt: customCollection.updatedAt,
      
      // NFTs mintadas desta coleção
      mintedNFTs: mintedNFTs.map(nft => ({
        _id: nft._id.toString(),
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        owner: nft.minterAddress,
        imageUrl: nft.imageUrl,
        transactionHash: nft.transactionHash,
        mintedAt: nft.mintedAt,
        name: `${customCollection.name} #${nft.tokenId}`,
        description: customCollection.description,
        metadata: {
          category: customCollection.category,
          subcategoryType: customCollection.subcategoryType,
          teamName: customCollection.teamName,
          season: customCollection.season
        }
      })),
      
      // Estatísticas
      stats: {
        totalMinted: mintedNFTs.length,
        uniqueOwners: [...new Set(mintedNFTs.map(nft => nft.minterAddress))].length,
        contractsUsed: [...new Set(mintedNFTs.map(nft => nft.contractAddress))].length
      }
    };
    
    return NextResponse.json({
      success: true,
      collection: formattedCollection
    });
    
  } catch (error) {
    console.error('❌ Error fetching custom collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch custom collection' },
      { status: 500 }
    );
  }
}