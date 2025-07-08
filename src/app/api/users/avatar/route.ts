import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRECT || process.env.CLOUDINARY_API_SECRET,
})

let cachedClient: MongoClient | null = null

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Avatar upload API called')
    
    const formData = await request.formData()
    const avatar = formData.get('avatar') as File
    const walletAddress = formData.get('walletAddress') as string

    console.log('📥 FormData received:')
    console.log('- Avatar file:', avatar?.name, avatar?.size, avatar?.type)
    console.log('- Wallet address:', walletAddress)

    if (!avatar || !walletAddress) {
      console.log('❌ Missing avatar or wallet address')
      return NextResponse.json(
        { error: 'Avatar file and wallet address are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!avatar.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', avatar.type)
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (avatar.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', avatar.size, 'bytes')
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    console.log('✅ File validation passed')

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...')
    const bytes = await avatar.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('✅ Buffer created, size:', buffer.length)

    // Check Cloudinary config
    console.log('☁️ Cloudinary config:')
    const hasCloudName = !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME)
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY
    const hasApiSecret = !!(process.env.CLOUDINARY_API_SECRECT || process.env.CLOUDINARY_API_SECRET)
    
    console.log('- Cloud name:', hasCloudName ? '✓' : '❌', hasCloudName ? (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME) : 'NOT_SET')
    console.log('- API key:', hasApiKey ? '✓' : '❌')
    console.log('- API secret:', hasApiSecret ? '✓' : '❌')

    let avatarUrl: string
    let publicId: string | undefined

    if (hasCloudName && hasApiKey && hasApiSecret) {
      // Upload to Cloudinary
      console.log('☁️ Uploading to Cloudinary...')
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'avatars',
            public_id: `avatar_${walletAddress}_${Date.now()}`,
            transformation: [
              { width: 200, height: 200, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error)
              reject(error)
            } else {
              console.log('✅ Cloudinary upload success:', result?.secure_url)
              resolve(result)
            }
          }
        ).end(buffer)
      })

      const result = uploadResult as any
      avatarUrl = result.secure_url
      publicId = result.public_id
      console.log('📄 Cloudinary upload result:', { url: avatarUrl, publicId })
    } else {
      // Fallback: Save as base64 data URL
      console.log('⚠️ Cloudinary not configured, using base64 fallback...')
      
      // Resize image using canvas-like approach (simple resize)
      const mimeType = avatar.type
      avatarUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
      publicId = undefined
      
      console.log('✅ Base64 avatar created, size:', avatarUrl.length, 'characters')
    }

    // Update user profile with new avatar URL
    console.log('🔗 Connecting to database...')
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    console.log('💾 Updating user avatar in database...')
    const dbResult = await usersCollection.findOneAndUpdate(
      { walletAddress },
      { 
        $set: { 
          avatar: avatarUrl,
          avatarPublicId: publicId || '',
          updatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    )

    console.log('✅ Database updated successfully')
    console.log('📄 DB Result:', dbResult?.value?.avatar ? 'Avatar URL saved' : 'No avatar in result')

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrl,
      publicId: publicId,
      message: 'Avatar uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading avatar:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const publicId = searchParams.get('publicId')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Delete from Cloudinary if publicId provided
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryError)
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Update user profile to remove avatar
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    await usersCollection.findOneAndUpdate(
      { walletAddress },
      { 
        $set: { 
          avatar: '',
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    })

  } catch (error) {
    console.error('Error removing avatar:', error)
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    )
  }
} 