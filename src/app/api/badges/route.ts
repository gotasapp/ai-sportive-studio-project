import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'badges';

/**
 * @swagger
 * /api/badges:
 *   post:
 *     summary: Create new badge NFT
 *     description: |
 *       Creates a new badge NFT with AI-generated design and metadata.
 *       Badges are achievement-based collectibles with automatic approval.
 *     tags: [NFTs, Collections]
 *     security:
 *       - WalletAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - imageUrl
 *               - creatorWallet
 *             properties:
 *               name:
 *                 type: string
 *                 description: Badge name
 *                 example: "Golden Boot Achievement"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Generated badge image URL
 *               creatorWallet:
 *                 type: string
 *                 description: Creator wallet address
 *                 example: "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56"
 *               description:
 *                 type: string
 *                 description: Badge description
 *               achievement:
 *                 type: string
 *                 description: Achievement type
 *                 example: "Top Scorer"
 *               rarity:
 *                 type: string
 *                 enum: [Common, Rare, Epic, Legendary]
 *                 description: Badge rarity level
 *               season:
 *                 type: string
 *                 description: Season or event
 *                 example: "2024"
 *               team:
 *                 type: string
 *                 description: Associated team
 *               player:
 *                 type: string
 *                 description: Associated player
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Badge tags
 *               metadata:
 *                 type: object
 *                 description: Additional NFT metadata
 *     responses:
 *       201:
 *         description: Badge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Badge created successfully"
 *                 badgeId:
 *                   type: string
 *                   description: Created badge MongoDB ID
 *                 data:
 *                   $ref: '#/components/schemas/NFT'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   get:
 *     summary: Get all badges
 *     description: |
 *       Retrieves all badge NFTs with filtering and pagination support.
 *       Includes various achievement types and rarity levels.
 *     tags: [NFTs, Collections]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Approved, Pending, Rejected, all]
 *         description: Filter by approval status
 *       - in: query
 *         name: creator
 *         schema:
 *           type: string
 *         description: Filter by creator wallet address
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [Common, Rare, Epic, Legendary]
 *         description: Filter by rarity level
 *       - in: query
 *         name: achievement
 *         schema:
 *           type: string
 *         description: Filter by achievement type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of badges per page
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 badges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NFT'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export async function POST(request: NextRequest) {
  console.log('🏆 Badge API: POST request received')
  
  try {
    const body = await request.json()
    console.log('📝 Badge data received:', { 
      name: body.name, 
      imageUrl: body.imageUrl ? 'URL provided' : 'No URL',
      creatorWallet: body.creatorWallet,
      tags: body.tags 
    })

    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Check moderation configuration
    let status = 'Approved'; // Default
    try {
      const settingsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/settings/moderation`);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        status = settings.moderationEnabled ? 'Pending' : 'Approved';
        console.log(`📋 Badge moderation setting: ${settings.moderationEnabled ? 'ON' : 'OFF'}, status: ${status}`);
      }
    } catch (settingError) {
      console.log('⚠️ Could not fetch moderation settings, using default (Approved)');
    }

    // Insert the badge
    const badgeDoc = {
      name: body.name,
      prompt: body.prompt,
      imageUrl: body.imageUrl,
      cloudinaryPublicId: body.cloudinaryPublicId,
      creatorWallet: body.creatorWallet,
      tags: body.tags || [],
      status: status, // Based on moderation configuration
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('💾 Inserting badge in MongoDB...')
    const result = await collection.insertOne(badgeDoc)
    console.log('✅ Badge inserted successfully:', result.insertedId)

    return NextResponse.json({ 
      success: true, 
      badgeId: result.insertedId.toString(),
      message: 'Badge saved successfully'
    })

  } catch (error: any) {
    console.error('❌ Badge API Error:', error)
    return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Failed to save badge' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Search for approved badges (ordered by creation date, most recent first)
    const badges = await collection
      .find({ status: 'Approved' })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to 50 most recent
      .toArray()

    console.log(`✅ Found ${badges.length} badges`)

    return NextResponse.json(badges)

  } catch (error: any) {
    console.error('❌ Error fetching badges:', error)
    return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request received for badges collection')
    
    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Delete all badges
    const result = await collection.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} badges`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} badges`
    })

  } catch (error: any) {
    console.error('❌ Error deleting badges:', error)
    return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Failed to delete badges' },
      { status: 500 }
    )
  }
} 