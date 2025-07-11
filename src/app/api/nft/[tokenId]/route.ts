import { NextRequest, NextResponse } from 'next/server'
import { getContract } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { client } from '@/lib/ThirdwebProvider'
import { connectToDatabase } from '@/lib/mongodb'

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

async function fetchNFTFromThirdweb(tokenId: string): Promise<CachedNFT | null> {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
    
    const contract = getContract({
      client,
      address: contractAddress,
      chain: polygonAmoy,
    })

    console.log(`🔍 Fetching NFT ${tokenId} from Thirdweb...`)

    // Buscar dados em paralelo
    const [tokenURI, owner] = await Promise.all([
      // Token URI
      contract.call('tokenURI', [BigInt(tokenId)]).catch(() => null),
      // Owner
      contract.call('ownerOf', [BigInt(tokenId)]).catch(() => null),
    ])

    if (!tokenURI || !owner) {
      console.log(`❌ NFT ${tokenId} not found on blockchain`)
      return null
    }

    // Fetch metadata
    const metadataUrl = convertIpfsToHttp(tokenURI)
    const metadataResponse = await fetch(metadataUrl)
    const metadata = await metadataResponse.json()

    const nftData: CachedNFT = {
      tokenId,
      name: metadata.name || `NFT #${tokenId}`,
      description: metadata.description || '',
      image: metadata.image || '',
      imageHttp: convertIpfsToHttp(metadata.image || ''),
      owner: owner.toString(),
      metadata,
      attributes: metadata.attributes || [],
      contractAddress,
      chainId: polygonAmoy.id,
      lastUpdated: new Date(),
      createdAt: new Date(),
    }

    console.log(`✅ NFT ${tokenId} fetched from Thirdweb:`, nftData.name)
    return nftData

  } catch (error) {
    console.error(`❌ Error fetching NFT ${tokenId} from Thirdweb:`, error)
    return null
  }
}

async function getCachedNFT(tokenId: string): Promise<CachedNFT | null> {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('nft_cache')
    
    const cached = await collection.findOne({ tokenId })
    
    if (cached) {
      console.log(`📦 Found cached NFT ${tokenId}:`, cached.name)
      return cached as CachedNFT
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error getting cached NFT ${tokenId}:`, error)
    return null
  }
}

async function saveCachedNFT(nftData: CachedNFT): Promise<void> {
  try {
    const { db } = await connectToDatabase()
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

    // 2. Se não tem cache ou está desatualizado, buscar da Thirdweb
    console.log(`🔄 Cache miss or stale for NFT ${tokenId}, fetching from Thirdweb...`)
    
    const freshData = await fetchNFTFromThirdweb(tokenId)
    
    if (!freshData) {
      // Se não conseguiu buscar da Thirdweb, retornar cache desatualizado se existir
      if (cached) {
        console.log(`⚠️ Thirdweb failed, returning stale cache for NFT ${tokenId}`)
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

    // 3. Salvar no cache
    await saveCachedNFT(freshData)

    console.log(`✅ Returning fresh NFT ${tokenId} (${freshData.name})`)
    return NextResponse.json({
      success: true,
      data: freshData,
      source: 'thirdweb',
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