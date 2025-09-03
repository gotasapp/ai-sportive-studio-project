import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Interface para contratos dinâmicos
interface DynamicContract {
  address: string;
  name: string;
  type: 'custom_collection' | 'launchpad_collection' | 'individual_nft';
  category: string | null;
  createdAt: string;
  creator: string;
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');

    console.log('🔍 Buscando contratos dinâmicos no banco de dados...');

    // 1. Buscar contratos das custom collections
    const customCollections = await db.collection('custom_collections')
      .find(
        { contractAddress: { $exists: true, $nin: [null, ''] } },
        { projection: { name: 1, contractAddress: 1, category: 1, createdAt: 1, creatorWallet: 1 } }
      )
      .toArray();

    // 2. Buscar contratos das launchpad collections
    const launchpadCollections = await db.collection('collections')
      .find(
        { 
          contractAddress: { $exists: true, $nin: [null, ''] },
          type: 'launchpad' 
        },
        { projection: { name: 1, contractAddress: 1, category: 1, createdAt: 1, creator: 1 } }
      )
      .toArray();

    // 3. Buscar contratos individuais de NFTs (caso tenham contratos próprios)
    const nftContracts = await db.collection('jerseys')
      .aggregate([
        {
          $match: { 
            contractAddress: { $exists: true, $nin: [null, ''] }
          }
        },
        {
          $group: {
            _id: '$contractAddress',
            name: { $first: '$name' },
            category: { $first: '$category' },
            createdAt: { $first: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            contractAddress: '$_id',
            name: 1,
            category: 1,
            createdAt: 1,
            nftCount: '$count',
            _id: 0
          }
        }
      ])
      .toArray();

    // Extrair apenas os endereços únicos
    const allContracts: DynamicContract[] = [
      ...customCollections.map(c => ({
        address: c.contractAddress,
        name: c.name,
        type: 'custom_collection' as const,
        category: c.category,
        createdAt: c.createdAt,
        creator: c.creatorWallet || 'Unknown'
      })),
      ...launchpadCollections.map(c => ({
        address: c.contractAddress,
        name: c.name,
        type: 'launchpad_collection' as const,
        category: c.category,
        createdAt: c.createdAt,
        creator: c.creator?.wallet || 'Unknown'
      })),
      ...nftContracts.map(c => ({
        address: c.contractAddress,
        name: `${c.name} (${c.nftCount} NFTs)`,
        type: 'individual_nft' as const,
        category: c.category,
        createdAt: c.createdAt,
        creator: 'Various'
      }))
    ];

    // Remover duplicatas por endereço
    const uniqueContracts = allContracts.reduce<DynamicContract[]>((acc, current) => {
      const existing = acc.find(item => item.address === current.address);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Extrair apenas os endereços para importação fácil
    const contractAddresses = uniqueContracts.map(c => c.address);

    console.log(`✅ Encontrados ${uniqueContracts.length} contratos dinâmicos únicos`);

    return NextResponse.json({
      success: true,
      total: uniqueContracts.length,
      contracts: uniqueContracts,
      addresses: contractAddresses,
      summary: {
        customCollections: customCollections.length,
        launchpadCollections: launchpadCollections.length,
        individualNFTs: nftContracts.length,
        uniqueTotal: uniqueContracts.length
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar contratos dinâmicos:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dynamic contracts'
    }, { status: 500 });
  }
}
