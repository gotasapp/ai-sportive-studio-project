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
 * 📋 API para listar NFTs com metadata incorreto de forma organizada
 * Retorna dados formatados para deleção manual
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 LISTING INCORRECT METADATA FORMATTED: Buscando informações...');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const results = {
      summary: {
        totalCollections: 0,
        totalMints: 0,
        totalItems: 0
      },
      formattedData: [] as any[]
    };

    // 1. 🔍 BUSCAR CUSTOM COLLECTIONS
    const customCollections = await db.collection('custom_collections')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();
    
    // 2. 🔍 BUSCAR CUSTOM MINTS
    const customMints = await db.collection('custom_collection_mints')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();

    // 3. 🔍 BUSCAR LAUNCHPAD COLLECTIONS
    const launchpadCollections = await db.collection('launchpad_collections')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();
    
    // 4. 🔍 BUSCAR LAUNCHPAD MINTS
    const launchpadMints = await db.collection('launchpad_collection_mints')
      .find({ contractAddress: { $in: INCORRECT_METADATA_CONTRACTS } })
      .toArray();

    // 5. 📊 ORGANIZAR POR CONTRATO
    const organizedByContract: any = {};
    
    INCORRECT_METADATA_CONTRACTS.forEach(contract => {
      organizedByContract[contract] = {
        collections: [],
        mints: []
      };
    });

    // Adicionar custom collections
    customCollections.forEach(collection => {
      const contract = collection.contractAddress;
      if (organizedByContract[contract]) {
        organizedByContract[contract].collections.push({
          _id: collection._id.toString(),
          name: collection.name,
          contractAddress: collection.contractAddress,
          type: 'custom_collection',
          table: 'custom_collections',
          minted: collection.minted,
          totalSupply: collection.totalSupply,
          createdAt: collection.createdAt,
          creatorWallet: collection.creatorWallet
        });
      }
    });

    // Adicionar custom mints
    customMints.forEach(mint => {
      const contract = mint.contractAddress;
      if (organizedByContract[contract]) {
        organizedByContract[contract].mints.push({
          _id: mint._id.toString(),
          tokenId: mint.tokenId,
          name: mint.name,
          contractAddress: mint.contractAddress,
          type: 'custom_mint',
          table: 'custom_collection_mints',
          owner: mint.owner,
          minterAddress: mint.minterAddress,
          transactionHash: mint.transactionHash,
          mintedAt: mint.mintedAt
        });
      }
    });

    // Adicionar launchpad collections
    launchpadCollections.forEach(collection => {
      const contract = collection.contractAddress;
      if (organizedByContract[contract]) {
        organizedByContract[contract].collections.push({
          _id: collection._id.toString(),
          name: collection.name,
          contractAddress: collection.contractAddress,
          type: 'launchpad_collection',
          table: 'launchpad_collections',
          minted: collection.minted,
          totalSupply: collection.totalSupply,
          createdAt: collection.createdAt,
          creatorWallet: collection.creatorWallet
        });
      }
    });

    // Adicionar launchpad mints
    launchpadMints.forEach(mint => {
      const contract = mint.contractAddress;
      if (organizedByContract[contract]) {
        organizedByContract[contract].mints.push({
          _id: mint._id.toString(),
          tokenId: mint.tokenId,
          name: mint.name,
          contractAddress: mint.contractAddress,
          type: 'launchpad_mint',
          table: 'launchpad_collection_mints',
          owner: mint.owner,
          minterAddress: mint.minterAddress,
          transactionHash: mint.transactionHash,
          mintedAt: mint.mintedAt
        });
      }
    });

    // 6. 📋 FORMATAR PARA DELEÇÃO
    Object.entries(organizedByContract).forEach(([contract, data]: [string, any]) => {
      const collections = data.collections;
      const mints = data.mints;
      
      if (collections.length > 0 || mints.length > 0) {
        results.formattedData.push({
          contract,
          collections: collections.map((col: any) => ({
            id: col._id,
            name: col.name,
            table: col.table,
            type: col.type,
            minted: col.minted,
            totalSupply: col.totalSupply,
            createdAt: col.createdAt,
            creatorWallet: col.creatorWallet
          })),
          mints: mints.map((mint: any) => ({
            id: mint._id,
            tokenId: mint.tokenId,
            name: mint.name,
            table: mint.table,
            type: mint.type,
            owner: mint.owner,
            minterAddress: mint.minterAddress,
            transactionHash: mint.transactionHash,
            mintedAt: mint.mintedAt
          }))
        });
        
        results.summary.totalCollections += collections.length;
        results.summary.totalMints += mints.length;
        results.summary.totalItems += collections.length + mints.length;
      }
    });

    // 7. 📝 CRIAR COMANDOS DE DELEÇÃO
    const deleteCommands = {
      mongoCommands: [] as string[],
      formattedCommands: [] as string[]
    };

    results.formattedData.forEach(contractData => {
      // Comandos para collections
      contractData.collections.forEach((collection: any) => {
        const mongoCmd = `db.${collection.table}.deleteOne({ "_id": ObjectId("${collection.id}") })`;
        const formattedCmd = `DELETE FROM ${collection.table} WHERE _id = "${collection.id}"`;
        
        deleteCommands.mongoCommands.push(mongoCmd);
        deleteCommands.formattedCommands.push(formattedCmd);
      });

      // Comandos para mints
      contractData.mints.forEach((mint: any) => {
        const mongoCmd = `db.${mint.table}.deleteOne({ "_id": ObjectId("${mint.id}") })`;
        const formattedCmd = `DELETE FROM ${mint.table} WHERE _id = "${mint.id}"`;
        
        deleteCommands.mongoCommands.push(mongoCmd);
        deleteCommands.formattedCommands.push(formattedCmd);
      });
    });

    return NextResponse.json({
      success: true,
      message: `📋 Encontrados ${results.summary.totalItems} itens com metadata incorreto`,
      summary: results.summary,
      contracts: INCORRECT_METADATA_CONTRACTS,
      formattedData: results.formattedData,
      deleteCommands,
      instructions: {
        title: "🗑️ INSTRUÇÕES PARA DELEÇÃO",
        steps: [
          "1. Revise os dados acima para confirmar que são os itens corretos",
          "2. Use os comandos MongoDB fornecidos para deletar os registros",
          "3. Execute os comandos no MongoDB Compass ou shell",
          "4. Confirme que os itens foram removidos do marketplace",
          "5. Faça backup antes de executar as deleções"
        ],
        warning: "⚠️ ATENÇÃO: Esta operação é irreversível. Faça backup antes de deletar!"
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar dados formatados:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno ao listar dados formatados'
    }, { status: 500 });
  }
}
