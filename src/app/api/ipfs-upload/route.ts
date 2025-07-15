import { NextRequest, NextResponse } from 'next/server'
import { IPFSService } from '@/lib/services/ipfs-service'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')

    // Check if it's JSON (metadata upload)
    if (contentType?.includes('application/json')) {
      const { metadata, type } = await request.json()
      
      if (type === 'metadata' && metadata) {
        console.log('📤 Uploading metadata to IPFS...')
        const metadataUrl = await IPFSService.uploadMetadata(metadata)
        
        return NextResponse.json({
          success: true,
          ipfsUrl: metadataUrl,
          type: 'metadata'
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid metadata format' },
        { status: 400 }
      )
    }

    // Handle FormData (image upload)
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📤 Uploading image to IPFS...')

    // Convert File to Blob
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })

    // Upload to IPFS
    const result = await IPFSService.uploadImage(blob, file.name)

    console.log('✅ File uploaded to IPFS:', result)

    return NextResponse.json({
      success: true,
      ipfsUrl: result,
      type: 'image'
    })

  } catch (error: any) {
    console.error('❌ IPFS upload error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Upload failed',
        details: error.toString()
      },
      { status: 500 }
    )
  }
} 