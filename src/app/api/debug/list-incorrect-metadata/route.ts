import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

// Contratos com metadata incorreto identificados na Thirdweb
const INCORRECT_METADATA_CONTRACTS = [
  '0x3a2BA522A6E391A0B8322a7a2549aE23EA9857A3',
  '0x605F7671bd8F57B74c5bc4056da58d9B1207f356',
  '0xaD3c7497dF13c433db96b66Fb7bac6DADeDA7bE2',
  '0x8C0BA49D100E55a6744e5d25161EbF7261613C67',
  '0x650546274B9253f8bdA63C362DD412d61a5c1654',
  '0xc13D9f695Ff93620244ce3D6e1816569043836E2',
  '0x556A1961762c962dC41EC80343369cb933F3Ed3B',
  '0x4bd63944CB364A0f8a3F8534A82dD97051F2aA01'
];

/**
 * 📋 API para listar todas as informações das NFTs com metadata incorreto
 * Retorna dados detalhados para deleção manual
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 LISTING INCORRECT METADATA: Buscando informações detalhadas...');
    console.log('📋 Contratos com metadata incorreto:', INCORRECT_METADATA_CONTRACTS);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const results: {
      launchpadCollections: any[];
      launchpadMints: any[];
      customCollections: any[];
      customMints: any[];
      summary: {
        totalCollections: number;
        totalMints: number;
        totalItems: number;
      };
    } = {
      launchpadCollections: [],
      launchpadMints: [],
      customCollections: [],
      customMints: [],
      summary: {
        totalCollections: 0,
        totalMints: 0,
        totalItems: 0
      }
    };

    // 1. 🔍 BUSCAR LAUNCHPAD COLLECTIONS
    console.log('🔍 Buscando launchpad_collections...');
    const launchpadCollections = await db.collection('launchpad_collections')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();
    
    results.launchpadCollections = launchpadCollections.map(collection => ({
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      contractAddress: collection.contractAddress,
      status: collection.status,
      minted: collection.minted || 0,
      totalSupply: collection.totalSupply,
      price: collection.price,
      imageUrl: collection.imageUrl,
      creator: collection.creator,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      type: 'launchpad_collection',
      table: 'launchpad_collections'
    }));

    // 2. 🔍 BUSCAR LAUNCHPAD MINTS
    console.log('🔍 Buscando launchpad_collection_mints...');
    const launchpadMints = await db.collection('launchpad_collection_mints')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();
    
    results.launchpadMints = launchpadMints.map(mint => ({
      _id: mint._id.toString(),
      tokenId: mint.tokenId,
      name: mint.name,
      description: mint.description,
      contractAddress: mint.contractAddress,
      collectionId: mint.collectionId?.toString(),
      collectionName: mint.collectionName,
      imageUrl: mint.imageUrl,
      metadataUrl: mint.metadataUrl,
      minterAddress: mint.minterAddress,
      owner: mint.owner,
      transactionHash: mint.transactionHash,
      price: mint.price,
      mintedAt: mint.mintedAt,
      createdAt: mint.createdAt,
      type: 'launchpad_mint',
      table: 'launchpad_collection_mints'
    }));

    // 3. 🔍 BUSCAR CUSTOM COLLECTIONS
    console.log('🔍 Buscando custom_collections...');
    const customCollections = await db.collection('custom_collections')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();
    
    results.customCollections = customCollections.map(collection => ({
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      contractAddress: collection.contractAddress,
      status: collection.status,
      minted: collection.minted || 0,
      totalSupply: collection.totalSupply,
      price: collection.price,
      imageUrl: collection.imageUrl,
      creatorWallet: collection.creatorWallet,
      teamName: collection.teamName,
      season: collection.season,
      category: collection.category,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      type: 'custom_collection',
      table: 'custom_collections'
    }));

    // 4. 🔍 BUSCAR CUSTOM MINTS
    console.log('🔍 Buscando custom_collection_mints...');
    const customMints = await db.collection('custom_collection_mints')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();
    
    results.customMints = customMints.map(mint => ({
      _id: mint._id.toString(),
      tokenId: mint.tokenId,
      name: mint.name,
      description: mint.description,
      contractAddress: mint.contractAddress,
      customCollectionId: mint.customCollectionId?.toString(),
      imageUrl: mint.imageUrl,
      metadataUrl: mint.metadataUrl,
      minterAddress: mint.minterAddress,
      owner: mint.owner,
      transactionHash: mint.transactionHash,
      price: mint.price,
      mintedAt: mint.mintedAt,
      createdAt: mint.createdAt,
      type: 'custom_mint',
      table: 'custom_collection_mints'
    }));

    // 5. 📊 CALCULAR RESUMO
    results.summary.totalCollections = 
      results.launchpadCollections.length + results.customCollections.length;
    results.summary.totalMints = 
      results.launchpadMints.length + results.customMints.length;
    results.summary.totalItems = 
      results.summary.totalCollections + results.summary.totalMints;

    console.log('🎯 RESUMO DOS DADOS ENCONTRADOS:', {
      totalCollections: results.summary.totalCollections,
      totalMints: results.summary.totalMints,
      totalItems: results.summary.totalItems,
      contracts: INCORRECT_METADATA_CONTRACTS
    });

    // 6. 📋 ORGANIZAR POR CONTRATO PARA FACILITAR A DELEÇÃO
    const organizedByContract: { [key: string]: { collections: any[]; mints: any[] } } = {};
    
    INCORRECT_METADATA_CONTRACTS.forEach(contract => {
      organizedByContract[contract] = {
        collections: [],
        mints: []
      };
      
      // Adicionar coleções launchpad
      results.launchpadCollections.forEach(collection => {
        if (collection.contractAddress === contract) {
          organizedByContract[contract].collections.push(collection);
        }
      });
      
      // Adicionar mints launchpad
      results.launchpadMints.forEach(mint => {
        if (mint.contractAddress === contract) {
          organizedByContract[contract].mints.push(mint);
        }
      });
      
      // Adicionar coleções customizadas
      results.customCollections.forEach(collection => {
        if (collection.contractAddress === contract) {
          organizedByContract[contract].collections.push(collection);
        }
      });
      
      // Adicionar mints customizados
      results.customMints.forEach(mint => {
        if (mint.contractAddress === contract) {
          organizedByContract[contract].mints.push(mint);
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Encontrados ${results.summary.totalItems} itens com metadata incorreto`,
      summary: results.summary,
      contracts: INCORRECT_METADATA_CONTRACTS,
      organizedByContract,
      allData: results
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar dados:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno ao listar dados'
    }, { status: 500 });
  }
}
