import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { 
  TeamReference, 
  createTeamReference, 
  COLLECTIONS, 
  DB_NAME,
  VALIDATION 
} from '@/lib/database-schema';

// GET - Listar todas as referências de badges
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.BADGE_REFERENCES);

    const references = await collection
      .find({ category: 'badge' })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📦 Found ${references.length} badge references`);

    return NextResponse.json({
      success: true,
      data: references,
      count: references.length
    });

  } catch (error) {
    console.error('❌ Error fetching badge references:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch badge references' },
      { status: 500 }
    );
  }
}

// POST - Criar nova referência de badge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, teamBasePrompt, referenceImages } = body;

    if (!teamName || typeof teamName !== 'string') {
      return NextResponse.json({ success: false, error: 'Badge name is required' }, { status: 400 });
    }
    // Outras validações podem ser adicionadas conforme necessário

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.BADGE_REFERENCES);

    const existing = await collection.findOne({ 
      teamName: teamName.trim(), 
      category: 'badge' 
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Badge reference already exists' }, { status: 409 });
    }

    const newReference = createTeamReference({
      teamName: teamName.trim(),
      category: 'badge',
      teamBasePrompt: teamBasePrompt?.trim() || '',
      referenceImages: referenceImages || [],
      createdBy: 'admin'
    });

    const result = await collection.insertOne(newReference);

    console.log(`✅ Created badge reference for: ${teamName}`);

    return NextResponse.json({
      success: true,
      data: { ...newReference, _id: result.insertedId },
      message: 'Badge reference created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating badge reference:', error);
    return NextResponse.json({ success: false, error: 'Failed to create badge reference' }, { status: 500 });
  }
}

// PATCH - Atualizar prompt ou adicionar imagem para badge
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (!action) {
      const body = await request.json();
      const { teamId, teamBasePrompt } = body;

      if (!teamId || !teamBasePrompt) {
        return NextResponse.json({ success: false, error: 'Reference ID and base prompt are required' }, { status: 400 });
      }
      
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.BADGE_REFERENCES);

      const result = await collection.updateOne(
        { _id: new ObjectId(teamId), category: 'badge' },
        { $set: { teamBasePrompt: teamBasePrompt.trim(), updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Badge reference not found' }, { status: 404 });
      }

      console.log(`✅ Updated prompt for badge reference: ${teamId}`);
      return NextResponse.json({ success: true, message: 'Badge prompt updated successfully' });
    }

    if (action === 'add-image') {
      const formData = await request.formData();
      const teamName = formData.get('teamName') as string;
      const file = formData.get('file') as File;
      
      if (!teamName || !file) {
        return NextResponse.json({ success: false, error: 'Badge name and file are required' }, { status: 400 });
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', file.name);
      uploadFormData.append('category', 'badge');
      uploadFormData.append('teamName', teamName);

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const uploadResponse = await fetch(`${baseUrl}/api/admin/upload-reference`, { method: 'POST', body: uploadFormData });

      if (!uploadResponse.ok) { throw new Error('Failed to upload image to Cloudinary'); }
      const uploadResult = await uploadResponse.json();

      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.BADGE_REFERENCES);

      const newImage = {
        id: `img_${Date.now()}`,
        url: uploadResult.url,
        filename: uploadResult.metadata.fileName,
        uploadedAt: new Date(),
        description: formData.get('description') as string || '',
        isPrimary: false,
        metadata: uploadResult.metadata
      };

      const result = await collection.updateOne(
        { teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }, category: 'badge' },
        { $push: { referenceImages: newImage }, $set: { updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Badge reference not found' }, { status: 404 });
      }

      console.log(`✅ Added reference image for badge: ${teamName}`);
      return NextResponse.json({ success: true, data: newImage, message: 'Reference image added successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in PATCH operation for badges:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process request' }, { status: 500 });
  }
}

// DELETE - Deletar referência de badge
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reference ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.BADGE_REFERENCES);

    const result = await collection.deleteOne({ _id: new ObjectId(id), category: 'badge' });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Badge reference not found' }, { status: 404 });
    }

    console.log(`✅ Deleted badge reference: ${id}`);
    return NextResponse.json({ success: true, message: 'Badge reference deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting badge reference:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete badge reference' }, { status: 500 });
  }
} 