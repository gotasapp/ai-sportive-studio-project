import { NextRequest, NextResponse } from 'next/server'
import { getContract } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { client } from '@/lib/ThirdwebProvider'
import { connectToDatabase } from '@/lib/mongodb'

// Cache TTL mais curto para owner (muda mais frequentemente)
const OWNER_CACHE_TTL_MINUTES = 5

interface CachedOwner {
  tokenId: string
  owner: string
  lastUpdated: Date
}

function isStale(cachedData: CachedOwner, ttlMinutes: number): boolean {
  const now = new Date()
  const cacheTime = new Date(cachedData.lastUpdated)
  const diffMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60)
  return diffMinutes > ttlMinutes
}

async function fetchOwnerFromThirdweb(tokenId: string): Promise<string | null> {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
    
    const contract = getContract({
      client,
      address: contractAddress,
      chain: polygonAmoy,
    })

    console.log(`🔍 Fetching owner for NFT ${tokenId} from Thirdweb...`)

    const owner = await contract.call('ownerOf', [BigInt(tokenId)])
    
    if (!owner) {
      console.log(`❌ Owner not found for NFT ${tokenId}`)
      return null
    }

    console.log(`✅ Owner for NFT ${tokenId}:`, owner.toString())
    return owner.toString()

  } catch (error) {
    console.error(`❌ Error fetching owner for NFT ${tokenId}:`, error)
    return null
  }
}

async function getCachedOwner(tokenId: string): Promise<CachedOwner | null> {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('nft_owners_cache')
    
    const cached = await collection.findOne({ tokenId })
    
    if (cached) {
      console.log(`📦 Found cached owner for NFT ${tokenId}:`, cached.owner)
      return cached as CachedOwner
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error getting cached owner for NFT ${tokenId}:`, error)
    return null
  }
}

async function saveCachedOwner(tokenId: string, owner: string): Promise<void> {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('nft_owners_cache')
    
    const ownerData: CachedOwner = {
      tokenId,
      owner,
      lastUpdated: new Date()
    }
    
    await collection.updateOne(
      { tokenId },
      { $set: ownerData },
      { upsert: true }
    )
    
    console.log(`💾 Cached owner for NFT ${tokenId} saved to MongoDB`)
  } catch (error) {
    console.error(`❌ Error saving cached owner for NFT ${tokenId}:`, error)
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

    console.log(`🎯 API Request for NFT ${tokenId} owner`)

    // 1. Tentar buscar do cache primeiro
    const cached = await getCachedOwner(tokenId)
    
    if (cached && !isStale(cached, OWNER_CACHE_TTL_MINUTES)) {
      console.log(`⚡ Returning cached owner for NFT ${tokenId}`)
      return NextResponse.json({
        success: true,
        data: {
          tokenId,
          owner: cached.owner
        },
        source: 'cache',
        cached_at: cached.lastUpdated
      })
    }

    // 2. Se não tem cache ou está desatualizado, buscar da Thirdweb
    console.log(`🔄 Cache miss or stale for NFT ${tokenId} owner, fetching from Thirdweb...`)
    
    const freshOwner = await fetchOwnerFromThirdweb(tokenId)
    
    if (!freshOwner) {
      // Se não conseguiu buscar da Thirdweb, retornar cache desatualizado se existir
      if (cached) {
        console.log(`⚠️ Thirdweb failed, returning stale cache for NFT ${tokenId} owner`)
        return NextResponse.json({
          success: true,
          data: {
            tokenId,
            owner: cached.owner
          },
          source: 'stale_cache',
          cached_at: cached.lastUpdated,
          warning: 'Data may be outdated'
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'NFT owner not found' },
        { status: 404 }
      )
    }

    // 3. Salvar no cache
    await saveCachedOwner(tokenId, freshOwner)

    console.log(`✅ Returning fresh owner for NFT ${tokenId}`)
    return NextResponse.json({
      success: true,
      data: {
        tokenId,
        owner: freshOwner
      },
      source: 'thirdweb',
      cached_at: new Date()
    })

  } catch (error) {
    console.error('❌ Error in NFT Owner API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 