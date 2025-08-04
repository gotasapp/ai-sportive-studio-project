import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customCollectionId,
      tokenId,
      metadataUrl,
      imageUrl,
      transactionHash,
      minterAddress,
      price
    } = body;

    // Validar campos obrigatórios
    if (!customCollectionId || !tokenId || !metadataUrl || !imageUrl || !transactionHash || !minterAddress) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Conectar ao banco
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');
    
    // Converter string ID para ObjectId
    let objectId;
    try {
      objectId = new ObjectId(customCollectionId);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid custom collection ID format'
      }, { status: 400 });
    }

    // Buscar dados da coleção personalizada
    const customCollection = await db.collection('custom_collections').findOne({ _id: objectId });
    
    if (!customCollection) {
      return NextResponse.json({
        error: 'Custom collection not found'
      }, { status: 404 });
    }

    // Criar documento do mint
    const mintData = {
      customCollectionId: objectId,
      contractAddress: customCollection.contractAddress,
      category: customCollection.category,
      teamName: customCollection.teamName,
      season: customCollection.season,
      subcategoryType: customCollection.subcategoryType,
      tokenId,
      metadataUrl,
      imageUrl,
      transactionHash,
      minterAddress,
      price: price || "0",
      mintedAt: new Date(),
      type: 'custom_collection_mint'
    };

    // Salvar mint no MongoDB
    await db.collection('custom_collection_mints').insertOne(mintData);

    // Atualizar contador de mints na coleção
    await db.collection('custom_collections').updateOne(
      { _id: objectId },
      { $inc: { minted: 1 } }
    );

    console.log('✅ Mint de coleção personalizada salvo:', {
      customCollectionId,
      tokenId,
      transactionHash,
      category: customCollection.category,
      contractAddress: customCollection.contractAddress
    });

    return NextResponse.json({
      success: true,
      message: 'Custom collection mint saved successfully',
      data: mintData
    });

  } catch (error: any) {
    console.error('❌ Erro ao salvar mint de coleção personalizada:', error);
    return NextResponse.json({
      error: error.message || 'Failed to save custom collection mint'
    }, { status: 500 });
  }
}