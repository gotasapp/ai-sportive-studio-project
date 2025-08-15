import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';
const LOG_COLLECTION_NAME = 'jerseys_log';

/**
 * @swagger
 * /api/jerseys:
 *   post:
 *     summary: Create new jersey NFT
 *     description: |
 *       Creates a new jersey NFT with AI-generated design and metadata.
 *       Jersey is initially created in pending status and requires approval.
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
 *               - prompt
 *               - creatorWallet
 *             properties:
 *               name:
 *                 type: string
 *                 description: Jersey name/title
 *                 example: "Manchester United Home 2024"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Generated jersey image URL
 *               prompt:
 *                 type: string
 *                 description: AI generation prompt used
 *               creatorWallet:
 *                 type: string
 *                 description: Creator wallet address
 *                 example: "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56"
 *               team:
 *                 type: string
 *                 description: Team name
 *                 example: "Manchester United"
 *               season:
 *                 type: string
 *                 description: Season year
 *                 example: "2024"
 *               playerName:
 *                 type: string
 *                 description: Player name on jersey
 *               playerNumber:
 *                 type: string
 *                 description: Player number on jersey
 *               metadata:
 *                 type: object
 *                 description: Additional NFT metadata
 *     responses:
 *       201:
 *         description: Jersey created successfully
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
 *                   example: "Jersey created successfully"
 *                 jerseyId:
 *                   type: string
 *                   description: Created jersey MongoDB ID
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
 *     summary: Get all jerseys
 *     description: |
 *       Retrieves all jersey NFTs with filtering and pagination support.
 *       Includes approved, pending, and user-specific jerseys.
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
 *         name: team
 *         schema:
 *           type: string
 *         description: Filter by team name
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
 *         description: Number of jerseys per page
 *     responses:
 *       200:
 *         description: Jerseys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 jerseys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NFT'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export async function POST(request: Request) {
  try {
    console.log('👕 Jersey API: POST request received');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);
    const logs = db.collection(LOG_COLLECTION_NAME);

    const data = await request.json();

    const logEntry = {
      timestamp: new Date(),
      message: 'Attempting to insert jersey',
      jerseyName: data.name,
      creatorWallet: data.creatorWallet,
    };
    const logResult = await logs.insertOne(logEntry);

    if (!data.name || !data.imageUrl || !data.prompt || !data.creatorWallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let status = 'Approved';
    try {
      const settingsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/settings/moderation`);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        status = settings.moderationEnabled ? 'Pending' : 'Approved';
        console.log(`📋 Jersey moderation setting: ${settings.moderationEnabled ? 'ON' : 'OFF'}, status: ${status}`);
      }
    } catch (settingError) {
      console.log('⚠️ Could not fetch moderation settings, using default (Approved)');
    }

    const newJersey = {
      name: data.name,
      prompt: data.prompt,
      imageUrl: data.imageUrl,
      creator: {
        wallet: data.creatorWallet,
        name: data.creatorName || 'Anonymous',
      },
      createdAt: new Date(),
      status: status,
      mintCount: 0,
      editionSize: 100,
      tags: data.tags || [],
      
      // Additional fields for collections
      transactionHash: data.transactionHash || null,
      metadataUri: data.metadataUri || null,
      attributes: data.attributes || [],
      metadata: data.metadata || {},
      cloudinaryPublicId: data.cloudinaryPublicId || null,
    };

    console.log('💾 Attempting to save jersey:', {
      name: newJersey.name,
      transactionHash: newJersey.transactionHash,
      tags: newJersey.tags
    });

    const result = await jerseys.insertOne(newJersey);
    
    console.log('✅ Jersey saved with ID:', result.insertedId);

    return NextResponse.json({ 
      message: 'Jersey created successfully and is now available',
      jerseyId: result.insertedId,
      logId: logResult.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating jersey:', error);
    return NextResponse.json({ error: 'Failed to create jersey' }, { status: 500 });
  }
}

// GET handler to fetch approved jerseys from MongoDB
export async function GET(request: Request) {
  try {
    console.log('✅ GET Jerseys - Buscando do MongoDB');
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const status = searchParams.get('status') || 'Approved';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    // Build query filter
    const filter: any = { status };
    if (owner) {
      filter['creator.wallet'] = owner;
    }

    const foundJerseys = await jerseys
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    console.log(`✅ Found ${foundJerseys.length} jerseys for ${owner ? `owner ${owner}` : 'all users'}`);
    return NextResponse.json(foundJerseys);

  } catch (error) {
    console.error('Error fetching jerseys:', error);
    return NextResponse.json({ error: 'Failed to fetch jerseys' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE() {
  try {
    console.log('🗑️ DELETE request received for jerseys collection');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    const result = await jerseys.deleteMany({});
    
    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} documents from jerseys collection`,
      deletedCount: result.deletedCount
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting jerseys:', error);
    return NextResponse.json({ error: 'Failed to delete jerseys' }, { status: 500 });
  }
} 