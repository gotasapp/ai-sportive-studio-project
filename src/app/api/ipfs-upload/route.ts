import { NextRequest, NextResponse } from 'next/server'
import { IPFSService } from '@/lib/services/ipfs-service'

/**
 * @swagger
 * /api/ipfs-upload:
 *   post:
 *     summary: Upload content to IPFS
 *     description: |
 *       Uploads images or metadata to IPFS (InterPlanetary File System) using Pinata service.
 *       Supports both binary file uploads and JSON metadata uploads.
 *     tags: [Upload, IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload to IPFS
 *               fileName:
 *                 type: string
 *                 description: Custom filename for the uploaded file
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - metadata
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [metadata]
 *                 description: Upload type
 *                 example: "metadata"
 *               metadata:
 *                 type: object
 *                 description: NFT metadata object to upload
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: NFT name
 *                   description:
 *                     type: string
 *                     description: NFT description
 *                   image:
 *                     type: string
 *                     format: uri
 *                     description: Image URL (can be IPFS URL)
 *                   attributes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         trait_type:
 *                           type: string
 *                         value:
 *                           type: string
 *                     description: NFT attributes/traits
 *                   external_url:
 *                     type: string
 *                     format: uri
 *                     description: External URL for the NFT
 *     responses:
 *       200:
 *         description: Content uploaded to IPFS successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 ipfsUrl:
 *                   type: string
 *                   format: uri
 *                   description: IPFS URL of uploaded content
 *                   example: "ipfs://QmX1234567890abcdef..."
 *                 ipfsHash:
 *                   type: string
 *                   description: IPFS hash
 *                 type:
 *                   type: string
 *                   enum: [image, metadata]
 *                   description: Type of content uploaded
 *                 size:
 *                   type: number
 *                   description: File size in bytes (for images)
 *       400:
 *         description: Invalid request or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: IPFS upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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