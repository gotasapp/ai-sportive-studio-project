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

// GET - Listar todas as referências de stadiums
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.STADIUM_REFERENCES);

    // Buscar apenas referências de stadiums
    const references = await collection
      .find({ category: 'stadium' })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📦 Found ${references.length} stadium references`);

    return NextResponse.json({
      success: true,
      data: references,
      count: references.length
    });

  } catch (error) {
    console.error('❌ Error fetching stadium references:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stadium references' },
      { status: 500 }
    );
  }
}

// POST - Criar nova referência de stadium
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, teamBasePrompt, referenceImages } = body;

    // Validação (reutilizada de jerseys, genérica o suficiente)
    if (!teamName || typeof teamName !== 'string') {
      return NextResponse.json({ success: false, error: 'Stadium name is required' }, { status: 400 });
    }
    if (teamName.length < VALIDATION.teamName.minLength || teamName.length > VALIDATION.teamName.maxLength) {
      return NextResponse.json({ success: false, error: `Stadium name must be between ${VALIDATION.teamName.minLength} and ${VALIDATION.teamName.maxLength} characters` }, { status: 400 });
    }
    if (!VALIDATION.teamName.pattern.test(teamName)) {
      return NextResponse.json({ success: false, error: 'Stadium name contains invalid characters' }, { status: 400 });
    }
    if (teamBasePrompt && (teamBasePrompt.length < VALIDATION.teamBasePrompt.minLength || teamBasePrompt.length > VALIDATION.teamBasePrompt.maxLength)) {
      return NextResponse.json({ success: false, error: `Base prompt must be between ${VALIDATION.teamBasePrompt.minLength} and ${VALIDATION.teamBasePrompt.maxLength} characters` }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.STADIUM_REFERENCES);

    // Verificar se já existe
    const existing = await collection.findOne({ 
      teamName: teamName.trim(), 
      category: 'stadium' 
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Stadium reference already exists' }, { status: 409 });
    }

    // Criar nova referência
    const newReference = createTeamReference({
      teamName: teamName.trim(),
      category: 'stadium',
      teamBasePrompt: teamBasePrompt?.trim() || '',
      referenceImages: referenceImages || [],
      createdBy: 'admin'
    });

    const result = await collection.insertOne(newReference);

    console.log(`✅ Created stadium reference for: ${teamName}`);

    return NextResponse.json({
      success: true,
      data: { ...newReference, _id: result.insertedId },
      message: 'Stadium reference created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating stadium reference:', error);
    return NextResponse.json({ success: false, error: 'Failed to create stadium reference' }, { status: 500 });
  }
}

// PATCH - Operações específicas (atualizar prompt, adicionar imagem, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    // Rota para atualizar o prompt
    if (!action) {
      const body = await request.json();
      const { teamId, teamBasePrompt } = body;

      if (!teamId || !teamBasePrompt) {
        return NextResponse.json({ success: false, error: 'Reference ID and base prompt are required' }, { status: 400 });
      }
      if (teamBasePrompt.length < VALIDATION.teamBasePrompt.minLength || teamBasePrompt.length > VALIDATION.teamBasePrompt.maxLength) {
        return NextResponse.json({ success: false, error: `Base prompt must be between ${VALIDATION.teamBasePrompt.minLength} and ${VALIDATION.teamBasePrompt.maxLength} characters` }, { status: 400 });
      }
      
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.STADIUM_REFERENCES);

      const result = await collection.updateOne(
        { _id: new ObjectId(teamId), category: 'stadium' },
        { $set: { teamBasePrompt: teamBasePrompt.trim(), updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Stadium reference not found' }, { status: 404 });
      }

      console.log(`✅ Updated prompt for stadium reference: ${teamId}`);
      return NextResponse.json({ success: true, message: 'Stadium prompt updated successfully' });
    }

    if (action === 'add-image') {
      const formData = await request.formData();
      const teamName = formData.get('teamName') as string;
      const file = formData.get('file') as File;
      const description = formData.get('description') as string;

      if (!teamName || !file) {
        return NextResponse.json({ success: false, error: 'Stadium name and file are required' }, { status: 400 });
      }

      // Upload para Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', file.name);
      uploadFormData.append('category', 'stadium');
      uploadFormData.append('teamName', teamName);

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const uploadResponse = await fetch(`${baseUrl}/api/admin/upload-reference`, { method: 'POST', body: uploadFormData });

      if (!uploadResponse.ok) { throw new Error('Failed to upload image to Cloudinary'); }
      const uploadResult = await uploadResponse.json();

      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.STADIUM_REFERENCES);

      const newImage = {
        id: `img_${Date.now()}`,
        url: uploadResult.url,
        filename: uploadResult.metadata.fileName,
        uploadedAt: new Date(),
        description: description || '',
        isPrimary: false,
        metadata: uploadResult.metadata
      };

      const result = await collection.updateOne(
        { teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }, category: 'stadium' },
        { $push: { referenceImages: newImage }, $set: { updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Stadium reference not found' }, { status: 404 });
      }

      console.log(`✅ Added reference image for stadium: ${teamName}`);
      return NextResponse.json({ success: true, data: newImage, message: 'Reference image added successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in PATCH operation for stadiums:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process request' }, { status: 500 });
  }
}

// DELETE - Deletar referência
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reference ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.STADIUM_REFERENCES);

    const result = await collection.deleteOne({ _id: new ObjectId(id), category: 'stadium' });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Stadium reference not found' }, { status: 404 });
    }

    console.log(`✅ Deleted stadium reference: ${id}`);
    return NextResponse.json({ success: true, message: 'Stadium reference deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting stadium reference:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete stadium reference' }, { status: 500 });
  }
} 