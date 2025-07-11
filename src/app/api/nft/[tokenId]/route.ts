import { NextRequest, NextResponse } from 'next/server'
import { getContract } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { client } from '@/lib/ThirdwebProvider'
import { connectToDatabase } from '@/lib/mongodb'
import { getNFT, ownerOf } from 'thirdweb/extensions/erc721'
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix'

// Cache TTL em minutos
const CACHE_TTL_MINUTES = 15
const METADATA_CACHE_TTL_MINUTES = 60 // Metadata muda menos

interface CachedNFT {
  tokenId: string
  name: string
  description: string
  image: string
  imageHttp: string // IPFS já convertido
  owner: string
  metadata: any
  attributes: any[]
  contractAddress: string
  chainId: number
  lastUpdated: Date
  createdAt: Date
}

function convertIpfsToHttp(ipfsUrl: string): string {
  if (!ipfsUrl) return ''
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  return ipfsUrl
}

function isStale(cachedData: CachedNFT, ttlMinutes: number): boolean {
  const now = new Date()
  const cacheTime = new Date(cachedData.lastUpdated)
  const diffMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60)
  return diffMinutes > ttlMinutes
}

// PRODUCTION-READY function using same logic as marketplace and profile
async function fetchNFTFromProductionSystem(tokenId: string): Promise<CachedNFT | null> {
  try {
    console.log(`🚀 Fetching NFT ${tokenId} using PRODUCTION system...`)
    
    // Use the same robust system as marketplace and profile
    const thirdwebData = await getThirdwebDataWithFallback();
    const { nfts } = thirdwebData;

    // Find the specific NFT by tokenId
    const targetNFT = nfts.find(nft => nft.id.toString() === tokenId);
    
    if (!targetNFT) {
      console.log(`❌ NFT ${tokenId} not found in production data`)
      return null;
    }

    const metadata = targetNFT.metadata || {};
    const contractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

    // Get owner using production contract
    const contract = getContract({
      client,
      address: contractAddress,
      chain: polygonAmoy,
    });

    let owner = 'Unknown';
    try {
      owner = await ownerOf({
        contract,
        tokenId: BigInt(tokenId)
      });
    } catch (error) {
      console.warn(`⚠️ Could not fetch owner for NFT ${tokenId}:`, error);
      owner = 'Unknown';
    }

    const nftCacheData: CachedNFT = {
      tokenId,
      name: metadata.name || `NFT #${tokenId}`,
      description: metadata.description || '',
      image: metadata.image || '',
      imageHttp: convertIpfsToHttp(metadata.image || ''),
      owner: owner.toString(),
      metadata,
      attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
      contractAddress,
      chainId: polygonAmoy.id,
      lastUpdated: new Date(),
      createdAt: new Date(),
    }

    console.log(`✅ NFT ${tokenId} fetched from PRODUCTION system:`, nftCacheData.name)
    return nftCacheData

  } catch (error) {
    console.error(`❌ Error fetching NFT ${tokenId} from production system:`, error)
    return null
  }
}

// Legacy function kept as fallback
async function fetchNFTFromThirdweb(tokenId: string): Promise<CachedNFT | null> {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
    
    const contract = getContract({
      client,
      address: contractAddress,
      chain: polygonAmoy,
    })

    console.log(`🔍 Fetching NFT ${tokenId} from Thirdweb (legacy)...`)

    // Buscar dados em paralelo usando extensões do Thirdweb v5
    const [nftData, owner] = await Promise.all([
      // NFT data (inclui metadata)
      getNFT({
        contract,
        tokenId: BigInt(tokenId)
      }).catch(() => null),
      // Owner
      ownerOf({
        contract,
        tokenId: BigInt(tokenId)
      }).catch(() => null),
    ])

    if (!nftData || !owner) {
      console.log(`❌ NFT ${tokenId} not found on blockchain`)
      return null
    }

    const metadata = nftData.metadata || {}

    const nftCacheData: CachedNFT = {
      tokenId,
      name: metadata.name || `NFT #${tokenId}`,
      description: metadata.description || '',
      image: metadata.image || '',
      imageHttp: convertIpfsToHttp(metadata.image || ''),
      owner: owner.toString(),
      metadata,
      attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
      contractAddress,
      chainId: polygonAmoy.id,
      lastUpdated: new Date(),
      createdAt: new Date(),
    }

    console.log(`✅ NFT ${tokenId} fetched from Thirdweb:`, nftCacheData.name)
    return nftCacheData

  } catch (error) {
    console.error(`❌ Error fetching NFT ${tokenId} from Thirdweb:`, error)
    return null
  }
}

async function getCachedNFT(tokenId: string): Promise<CachedNFT | null> {
  try {
    const client = await connectToDatabase()
    const db = client.db(process.env.MONGODB_DB_NAME || 'chz-app-db')
    const collection = db.collection('nft_cache')
    
    const cached = await collection.findOne({ tokenId })
    
    if (cached) {
      console.log(`📦 Found cached NFT ${tokenId}:`, cached.name)
      return {
        tokenId: cached.tokenId,
        name: cached.name,
        description: cached.description,
        image: cached.image,
        imageHttp: cached.imageHttp,
        owner: cached.owner,
        metadata: cached.metadata,
        attributes: cached.attributes,
        contractAddress: cached.contractAddress,
        chainId: cached.chainId,
        lastUpdated: cached.lastUpdated,
        createdAt: cached.createdAt
      } as CachedNFT
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error getting cached NFT ${tokenId}:`, error)
    return null
  }
}

async function saveCachedNFT(nftData: CachedNFT): Promise<void> {
  try {
    const client = await connectToDatabase()
    const db = client.db(process.env.MONGODB_DB_NAME || 'chz-app-db')
    const collection = db.collection('nft_cache')
    
    await collection.updateOne(
      { tokenId: nftData.tokenId },
      { $set: nftData },
      { upsert: true }
    )
    
    console.log(`💾 Cached NFT ${nftData.tokenId} saved to MongoDB`)
  } catch (error) {
    console.error(`❌ Error saving cached NFT ${nftData.tokenId}:`, error)
  }
}

async function getNFTFromMongoDB(tokenId: string): Promise<CachedNFT | null> {
  try {
    const client = await connectToDatabase()
    const db = client.db(process.env.MONGODB_DB_NAME || 'chz-app-db')
    
    // Buscar em todas as coleções de NFT
    const collections = ['jerseys', 'stadiums', 'badges']
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName)
      
      // Try multiple ways to find the NFT
      const searches = [
        { tokenId: parseInt(tokenId) },
        { tokenId: tokenId },
        { blockchainTokenId: parseInt(tokenId) },
        { blockchainTokenId: tokenId }
      ];
      
      let nft = null;
      for (const searchQuery of searches) {
        nft = await collection.findOne(searchQuery);
        if (nft) break;
      }
      
      if (nft) {
        console.log(`📦 Found NFT ${tokenId} in MongoDB collection: ${collectionName}`)
        
        return {
          tokenId,
          name: nft.metadata?.name || nft.name || `NFT #${tokenId}`,
          description: nft.metadata?.description || nft.description || '',
          image: nft.metadata?.image || nft.imageUrl || '',
          imageHttp: convertIpfsToHttp(nft.metadata?.image || nft.imageUrl || ''),
          owner: nft.owner || nft.minter || '',
          metadata: nft.metadata || {},
          attributes: nft.metadata?.attributes || [],
          contractAddress: nft.contractAddress || process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
          chainId: 80002, // Polygon Amoy
          lastUpdated: new Date(),
          createdAt: nft.createdAt ? new Date(nft.createdAt) : new Date(),
        }
      }
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error getting NFT ${tokenId} from MongoDB:`, error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = params.tokenId
    
    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid token ID' },
        { status: 400 }
      )
    }

    console.log(`🎯 API Request for NFT ${tokenId}`)

    // 1. Tentar buscar do cache primeiro
    const cached = await getCachedNFT(tokenId)
    
    if (cached && !isStale(cached, CACHE_TTL_MINUTES)) {
      console.log(`⚡ Returning cached NFT ${tokenId} (${cached.name})`)
      return NextResponse.json({
        success: true,
        data: cached,
        source: 'cache',
        cached_at: cached.lastUpdated
      })
    }

    // 2. Tentar buscar do MongoDB (dados confiáveis) - PRIORIDADE para NFTs sincronizados
    console.log(`🔄 Cache miss, trying MongoDB for NFT ${tokenId}...`)
    const mongoData = await getNFTFromMongoDB(tokenId)
    
    if (mongoData) {
      // Se encontrou no MongoDB mas não tem imagem, tentar buscar imagem da blockchain
      if (!mongoData.image && !mongoData.imageHttp) {
        try {
          console.log(`🔄 MongoDB NFT ${tokenId} missing image, checking production system...`);
          const productionData = await fetchNFTFromProductionSystem(tokenId);
          
          if (productionData && (productionData.image || productionData.imageHttp)) {
            // Mesclar dados do MongoDB com imagem da production
            mongoData.image = productionData.image;
            mongoData.imageHttp = productionData.imageHttp;
            console.log(`✅ Enhanced MongoDB NFT ${tokenId} with production image`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not enhance MongoDB NFT ${tokenId} with production image:`, error);
        }
      }
      
      // Salvar no cache
      await saveCachedNFT(mongoData)
      
      console.log(`✅ Returning MongoDB NFT ${tokenId} (${mongoData.name})`)
      return NextResponse.json({
        success: true,
        data: mongoData,
        source: 'mongodb',
        cached_at: mongoData.lastUpdated
      })
    }

    // 3. Use PRODUCTION system (same as marketplace/profile)
    console.log(`🚀 MongoDB miss, trying PRODUCTION system for NFT ${tokenId}...`)
    const freshData = await fetchNFTFromProductionSystem(tokenId)
    
    if (!freshData) {
      // Se não conseguiu buscar de lugar nenhum, retornar cache expirado se existir
      if (cached) {
        console.log(`⚠️ All sources failed, returning stale cache for NFT ${tokenId}`)
        return NextResponse.json({
          success: true,
          data: cached,
          source: 'stale_cache',
          cached_at: cached.lastUpdated,
          warning: 'Data may be outdated'
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'NFT not found' },
        { status: 404 }
      )
    }

    // 4. Salvar no cache
    await saveCachedNFT(freshData)

    console.log(`✅ Returning fresh PRODUCTION NFT ${tokenId} (${freshData.name})`)
    return NextResponse.json({
      success: true,
      data: freshData,
      source: 'production',
      cached_at: freshData.lastUpdated
    })

  } catch (error) {
    console.error('❌ Error in NFT API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 