import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * GET handler para buscar todos os NFTs mintados em formato compatível com Thirdweb Marketplace V3
 * Retorna tokenId, contractAddress, owner, metadata, etc.
 */
export async function GET(request: Request) {
  try {
    console.log('🏪 GET Marketplace NFTs - Formato Thirdweb V3');
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const chainId = searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    const type = searchParams.get('type'); // jersey, stadium, badge
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar NFTs de todas as coleções
    const collections = ['jerseys', 'stadiums', 'badges'];
    const allNFTs = [];

    for (const collectionName of collections) {
      // Filtrar por tipo se especificado
      if (type && type !== collectionName.slice(0, -1)) continue; // Remove 's' do final
      
      const collection = db.collection(collectionName);
      
      // Filtros para NFTs mintados
      const filter: any = {
        status: 'Approved',
        $or: [
          { transactionHash: { $exists: true, $nin: [null, ''] } },
          { isMinted: true },
          { mintStatus: 'minted' },
          { mintStatus: 'success' }
        ]
      };

      // Filtrar por owner se especificado
      if (owner) {
        filter['creator.wallet'] = owner;
      }

      const nfts = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      // Processar NFTs para formato Marketplace V3
      const processedNFTs = nfts.map((nft, index) => {
        // Gerar tokenId baseado no _id do MongoDB se não existir
        const tokenId = nft.tokenId || nft._id.toString();
        
        return {
          // 🔑 DADOS OBRIGATÓRIOS PARA THIRDWEB MARKETPLACE V3
          tokenId: tokenId,
          contractAddress: chainId === '80002' 
            ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
            : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
          owner: nft.creator?.wallet || nft.creatorWallet,
          
          // 📋 METADADOS DO NFT
          metadata: {
            name: nft.name,
            description: nft.description || `AI-generated ${collectionName.slice(0, -1)}`,
            image: nft.imageUrl || nft.image_url,
            attributes: nft.attributes || [
              { trait_type: 'Type', value: collectionName.slice(0, -1) },
              { trait_type: 'Status', value: 'Minted' },
              { trait_type: 'Creator', value: nft.creator?.wallet?.slice(0, 6) + '...' || 'Unknown' }
            ]
          },
          
          // 🏪 DADOS PARA MARKETPLACE
          marketplace: {
            isListed: false, // Inicialmente não listado
            isListable: true, // Pode ser listado
            canTrade: true,
            verified: true,
            collection: collectionName,
            category: collectionName.slice(0, -1)
          },
          
          // ⛓️ DADOS DA BLOCKCHAIN
          blockchain: {
            chainId: parseInt(chainId),
            network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
            transactionHash: nft.transactionHash,
            explorerUrl: nft.transactionHash 
              ? `https://amoy.polygonscan.com/tx/${nft.transactionHash}`
              : null,
            mintedAt: nft.mintedAt || nft.createdAt
          },
          
          // 📊 DADOS EXTRAS
          stats: {
            views: 0,
            likes: 0,
            sales: 0
          },
          
          // 🗂️ IDENTIFICADORES
          _id: nft._id,
          mongoId: nft._id.toString(),
          type: collectionName.slice(0, -1),
          
          // 📅 TIMESTAMPS
          createdAt: nft.createdAt,
          updatedAt: nft.updatedAt || nft.createdAt
        };
      });

      allNFTs.push(...processedNFTs);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    allNFTs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limitar resultado final
    const finalNFTs = allNFTs.slice(0, limit);

    console.log(`✅ Found ${finalNFTs.length} minted NFTs for marketplace`);
    
    // Log detalhado para debug
    if (finalNFTs.length > 0) {
      console.log('🎯 Marketplace NFTs ready:');
      finalNFTs.forEach((nft, index) => {
        console.log(`${index + 1}. ${nft.metadata.name} (${nft.type}) - Token ID: ${nft.tokenId}`);
      });
    } else {
      console.log('⚠️ No minted NFTs found for marketplace');
    }

    // 📊 ESTATÍSTICAS
    const stats = {
      total: finalNFTs.length,
      byType: {
        jerseys: finalNFTs.filter(n => n.type === 'jersey').length,
        stadiums: finalNFTs.filter(n => n.type === 'stadium').length,
        badges: finalNFTs.filter(n => n.type === 'badge').length
      },
      chainId: parseInt(chainId),
      network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
      contractAddress: chainId === '80002' 
        ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
        : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ
    };

    return NextResponse.json({
      success: true,
      data: finalNFTs,
      stats,
      filters: {
        owner: owner || 'all',
        type: type || 'all',
        chainId: parseInt(chainId),
        onlyMinted: true,
        limit
      },
      thirdweb: {
        contractAddress: stats.contractAddress,
        chainId: parseInt(chainId),
        marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET,
        ready: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching marketplace NFTs:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch marketplace NFTs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 