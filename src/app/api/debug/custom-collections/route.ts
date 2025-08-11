import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');
    
    // Buscar todas as custom collections
    const customCollections = await db.collection('custom_collections').find().toArray();
    
    console.log('🔍 Debug: Found custom collections:', customCollections.length);
    
    const debugData = [];
    
    for (const collection of customCollections) {
      // Buscar NFTs mintadas desta coleção
      const mintedNFTs = await db.collection('custom_collection_mints')
        .find({ customCollectionId: collection._id })
        .toArray();
      
      debugData.push({
        id: collection._id.toString(),
        name: collection.name,
        description: collection.description,
        imageUrl: collection.imageUrl,
        category: collection.category,
        contractAddress: collection.contractAddress,
        totalSupply: collection.totalSupply,
        minted: collection.minted,
        mintedActual: mintedNFTs.length,
        price: collection.price,
        creatorWallet: collection.creatorWallet,
        teamName: collection.teamName,
        season: collection.season,
        subcategoryType: collection.subcategoryType,
        status: collection.status,
        type: collection.type,
        createdAt: collection.createdAt,
        mintedNFTsCount: mintedNFTs.length,
        mintedNFTsPreview: mintedNFTs.slice(0, 3).map(nft => ({
          tokenId: nft.tokenId,
          name: nft.name,
          imageUrl: nft.imageUrl,
          minterAddress: nft.minterAddress,
          transactionHash: nft.transactionHash
        })),
        // Verificar se a imagem está acessível
        imageStatus: collection.imageUrl ? 'has_url' : 'no_url',
        imageType: collection.imageUrl?.includes('cloudinary') ? 'cloudinary' : 
                   collection.imageUrl?.includes('ipfs') ? 'ipfs' : 
                   collection.imageUrl?.startsWith('http') ? 'http' : 'unknown'
      });
    }
    
    // Estatísticas gerais
    const stats = {
      totalCollections: customCollections.length,
      activeCollections: customCollections.filter(c => c.status === 'active').length,
      collectionsWithImages: customCollections.filter(c => c.imageUrl).length,
      cloudinaryImages: customCollections.filter(c => c.imageUrl?.includes('cloudinary')).length,
      ipfsImages: customCollections.filter(c => c.imageUrl?.includes('ipfs')).length,
      httpImages: customCollections.filter(c => c.imageUrl?.startsWith('http') && !c.imageUrl.includes('cloudinary') && !c.imageUrl.includes('ipfs')).length,
      collectionsWithMints: debugData.filter(c => c.mintedNFTsCount > 0).length
    };
    
    return NextResponse.json({
      success: true,
      stats,
      collections: debugData
    });
    
  } catch (error) {
    console.error('❌ Debug custom collections error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
