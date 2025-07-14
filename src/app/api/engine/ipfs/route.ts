import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Configuração do Engine API
    const THIRDWEB_ENGINE_URL = process.env.ENGINE_URL
const THIRDWEB_ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN
    
    if (!THIRDWEB_ENGINE_URL || !THIRDWEB_ACCESS_TOKEN) {
      throw new Error('Engine configuration missing')
    }

    // Upload to IPFS via Engine
    const response = await fetch(`${THIRDWEB_ENGINE_URL}/ipfs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${THIRDWEB_ACCESS_TOKEN}`,
        'x-backend-wallet-address': process.env.THIRDWEB_BACKEND_WALLET_ADDRESS || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Engine IPFS upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      result: result
    })

  } catch (error) {
    console.error('❌ IPFS upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'IPFS upload failed' 
      },
      { status: 500 }
    )
  }
} 