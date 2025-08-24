import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 GET Launchpad Collection Mints for ID:', params.id);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleção específica
    let collection;
    try {
      // Buscar primeiro na tabela launchpad_collections (novo formato)
      collection = await db.collection('launchpad_collections').findOne({
        _id: new ObjectId(params.id)
      });
      
      // Fallback: buscar na tabela collections (formato antigo)
      if (!collection) {
        collection = await db.collection('collections').findOne({
          _id: new ObjectId(params.id),
          type: 'launchpad'
        });
      }
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (!collection) {
      console.log('❌ Coleção não encontrada');
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Coleção encontrada:', collection.name);
    
    // Buscar NFTs mintadas desta coleção
    let mintedNFTs = [];
    
    // 1. Buscar na tabela launchpad_collection_mints (novo formato)
    mintedNFTs = await db.collection('launchpad_collection_mints').find({
      contractAddress: collection.contractAddress
    }).toArray();
    
    console.log(`📋 NFTs encontradas na launchpad_collection_mints: ${mintedNFTs.length}`);
    
    // 2. Se não encontrou, buscar na tabela legacy (para compatibilidade)
    if (mintedNFTs.length === 0) {
      console.log('🔍 Fallback: Buscando NFTs na tabela legacy...');
      
      const category = (collection.category || 'jerseys').toLowerCase();
      const collectionName = category.includes('stadium') ? 'stadiums' : 
                           category.includes('badge') ? 'badges' : 'jerseys';
      
      mintedNFTs = await db.collection(collectionName).find({
        contractAddress: collection.contractAddress,
        status: 'Approved',
        $or: [
          { transactionHash: { $exists: true, $nin: [null, ''] } },
          { isMinted: true },
          { mintStatus: { $in: ['minted', 'success'] } }
        ]
      }).toArray();
      
      console.log(`📋 NFTs encontradas na tabela legacy (${collectionName}): ${mintedNFTs.length}`);
    }
    
    // 3. Se ainda não encontrou, buscar por collectionId
    if (mintedNFTs.length === 0) {
      console.log('🔍 Fallback: Buscando NFTs por collectionId...');
      
      mintedNFTs = await db.collection('launchpad_collection_mints').find({
        collectionId: collection._id
      }).toArray();
      
      console.log(`📋 NFTs encontradas por collectionId: ${mintedNFTs.length}`);
    }
    
    // 4. Se ainda não encontrou, buscar por collectionId como string
    if (mintedNFTs.length === 0) {
      console.log('🔍 Fallback: Buscando NFTs por collectionId (string)...');
      
      mintedNFTs = await db.collection('launchpad_collection_mints').find({
        collectionId: collection._id.toString()
      }).toArray();
      
      console.log(`📋 NFTs encontradas por collectionId (string): ${mintedNFTs.length}`);
    }
    
    // Formatar dados das NFTs mintadas
    const formattedMints = mintedNFTs.map((mint: any) => ({
      _id: mint._id.toString(),
      tokenId: mint.tokenId,
      contractAddress: mint.contractAddress,
      owner: mint.owner || mint.minterAddress,
      minterAddress: mint.minterAddress,
      metadataUrl: mint.metadataUrl,
      imageUrl: mint.imageUrl,
      transactionHash: mint.transactionHash,
      price: mint.price || '0',
      mintedAt: mint.mintedAt,
      collectionId: mint.collectionId,
      collectionName: mint.collectionName
    }));
    
    // Calcular estatísticas
    const totalMinted = formattedMints.length;
    const totalSupply = collection.totalSupply || collection.maxSupply || 0;
    const mintedPercentage = totalSupply > 0 ? Math.round((totalMinted / totalSupply) * 100) : 0;
    
    // Atualizar o campo minted na coleção se estiver desatualizado
    if (collection.minted !== totalMinted) {
      console.log(`🔄 Atualizando campo minted da coleção: ${collection.minted} → ${totalMinted}`);
      
      await db.collection('launchpad_collections').updateOne(
        { _id: collection._id },
        { 
          $set: { 
            minted: totalMinted,
            updatedAt: new Date()
          }
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        collectionId: params.id,
        collectionName: collection.name,
        totalMinted,
        totalSupply,
        mintedPercentage,
        mints: formattedMints
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching collection mints:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection mints' },
      { status: 500 }
    );
  }
}
