import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; // Import ObjectId
import { 
  TeamReference, 
  createTeamReference, 
  COLLECTIONS, 
  DB_NAME,
  VALIDATION 
} from '@/lib/database-schema';

// GET - Listar todas as referências de jerseys
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

    // Buscar apenas referências de jerseys
    const references = await collection
      .find({ category: 'jersey' })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📦 Found ${references.length} jersey references`);

    return NextResponse.json({
      success: true,
      data: references,
      count: references.length
    });

  } catch (error) {
    console.error('❌ Error fetching jersey references:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jersey references' },
      { status: 500 }
    );
  }
}

// POST - Criar nova referência de jersey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, teamBasePrompt, referenceImages } = body;

    // Validação
    if (!teamName || typeof teamName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }

    if (teamName.length < VALIDATION.teamName.minLength || 
        teamName.length > VALIDATION.teamName.maxLength) {
      return NextResponse.json(
        { success: false, error: `Team name must be between ${VALIDATION.teamName.minLength} and ${VALIDATION.teamName.maxLength} characters` },
        { status: 400 }
      );
    }

    if (!VALIDATION.teamName.pattern.test(teamName)) {
      return NextResponse.json(
        { success: false, error: 'Team name contains invalid characters' },
        { status: 400 }
      );
    }

    if (teamBasePrompt && (
        teamBasePrompt.length < VALIDATION.teamBasePrompt.minLength ||
        teamBasePrompt.length > VALIDATION.teamBasePrompt.maxLength
      )) {
      return NextResponse.json(
        { success: false, error: `Team base prompt must be between ${VALIDATION.teamBasePrompt.minLength} and ${VALIDATION.teamBasePrompt.maxLength} characters` },
        { status: 400 }
      );
    }

    if (referenceImages && referenceImages.length > VALIDATION.referenceImage.maxImages) {
      return NextResponse.json(
        { success: false, error: `Maximum ${VALIDATION.referenceImage.maxImages} reference images allowed` },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

    // Verificar se já existe
    const existing = await collection.findOne({ 
      teamName: teamName.trim(), 
      category: 'jersey' 
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Team already exists for jerseys' },
        { status: 409 }
      );
    }

    // Criar nova referência
    const newReference = createTeamReference({
      teamName: teamName.trim(),
      category: 'jersey',
      teamBasePrompt: teamBasePrompt?.trim() || '',
      referenceImages: referenceImages || [],
      createdBy: 'admin' // TODO: pegar do token de autenticação
    });

    const result = await collection.insertOne(newReference);

    console.log(`✅ Created jersey reference for team: ${teamName}`);

    return NextResponse.json({
      success: true,
      data: { ...newReference, _id: result.insertedId },
      message: 'Jersey reference created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating jersey reference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create jersey reference' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar referência existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, teamName, teamBasePrompt, referenceImages, isActive } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Reference ID is required' },
        { status: 400 }
      );
    }

    // Validação (mesma do POST)
    if (teamName && (
        teamName.length < VALIDATION.teamName.minLength || 
        teamName.length > VALIDATION.teamName.maxLength ||
        !VALIDATION.teamName.pattern.test(teamName)
      )) {
      return NextResponse.json(
        { success: false, error: 'Invalid team name' },
        { status: 400 }
      );
    }

    if (teamBasePrompt && (
        teamBasePrompt.length < VALIDATION.teamBasePrompt.minLength ||
        teamBasePrompt.length > VALIDATION.teamBasePrompt.maxLength
      )) {
      return NextResponse.json(
        { success: false, error: 'Invalid team base prompt length' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

    // Preparar dados para atualização
    const updateData: Partial<TeamReference> = {
      updatedAt: new Date(),
      updatedBy: 'admin' // TODO: pegar do token de autenticação
    };

    if (teamName) updateData.teamName = teamName.trim();
    if (teamBasePrompt !== undefined) updateData.teamBasePrompt = teamBasePrompt.trim();
    if (referenceImages) updateData.referenceImages = referenceImages;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const result = await collection.updateOne(
      { _id: _id, category: 'jersey' },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Jersey reference not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Updated jersey reference: ${_id}`);

    return NextResponse.json({
      success: true,
      message: 'Jersey reference updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating jersey reference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update jersey reference' },
      { status: 500 }
    );
  }
}

// PATCH - Operações específicas (adicionar imagem, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    // Rota para atualizar o prompt
    if (!action) {
      const body = await request.json();
      const { teamId, teamBasePrompt } = body;

      if (!teamId || !teamBasePrompt) {
        return NextResponse.json(
          { success: false, error: 'Team ID and base prompt are required' },
          { status: 400 }
        );
      }

      if (teamBasePrompt.length < VALIDATION.teamBasePrompt.minLength ||
          teamBasePrompt.length > VALIDATION.teamBasePrompt.maxLength) {
        return NextResponse.json(
          { success: false, error: `Team base prompt must be between ${VALIDATION.teamBasePrompt.minLength} and ${VALIDATION.teamBasePrompt.maxLength} characters` },
          { status: 400 }
        );
      }
      
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

      const result = await collection.updateOne(
        { _id: new ObjectId(teamId) },
        { $set: { teamBasePrompt: teamBasePrompt.trim(), updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Team reference not found' },
          { status: 404 }
        );
      }

      console.log(`✅ Updated prompt for team reference: ${teamId}`);

      return NextResponse.json({
        success: true,
        message: 'Team prompt updated successfully'
      });
    }

    if (action === 'add-image') {
      // Adicionar nova imagem de referência
      const formData = await request.formData();
      const teamName = formData.get('teamName') as string;
      const file = formData.get('file') as File;
      const description = formData.get('description') as string;
      const isPrimary = formData.get('isPrimary') === 'true';

      if (!teamName || !file) {
        return NextResponse.json({
          success: false,
          error: 'Team name and file are required'
        }, { status: 400 });
      }

      // Upload para Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', file.name);
      uploadFormData.append('category', 'jersey');
      uploadFormData.append('teamName', teamName);

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const uploadResponse = await fetch(`${baseUrl}/api/admin/upload-reference`, {
        method: 'POST',
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const uploadResult = await uploadResponse.json();

      // Adicionar imagem à referência no banco
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

      const newImage = {
        id: `img_${Date.now()}`,
        url: uploadResult.url,
        filename: uploadResult.metadata.fileName,
        uploadedAt: new Date(),
        description: description || '',
        isPrimary: isPrimary || false,
        metadata: uploadResult.metadata
      };

      const result = await collection.updateOne(
        { teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }, category: 'jersey' },
        { 
          $push: { referenceImages: newImage },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({
          success: false,
          error: 'Team reference not found'
        }, { status: 404 });
      }

      console.log(`✅ Added reference image for team: ${teamName}`);

      return NextResponse.json({
        success: true,
        data: newImage,
        message: 'Reference image added successfully'
      });
    }

    if (action === 'remove-image') {
      // Remover imagem de referência
      const body = await request.json();
      const { teamName, imageId } = body;

      if (!teamName || !imageId) {
        return NextResponse.json({
          success: false,
          error: 'Team name and image ID are required'
        }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

      const result = await collection.updateOne(
        { teamName: teamName.toLowerCase(), category: 'jersey' },
        { 
          $pull: { referenceImages: { id: imageId } },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({
          success: false,
          error: 'Team reference not found'
        }, { status: 404 });
      }

      console.log(`✅ Removed reference image ${imageId} for team: ${teamName}`);

      return NextResponse.json({
        success: true,
        message: 'Reference image removed successfully'
      });
    }

    // Outras ações PATCH podem ser adicionadas aqui
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in PATCH operation:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process request'
    }, { status: 500 });
  }
}

// DELETE - Deletar referência
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reference ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<TeamReference>(COLLECTIONS.TEAM_REFERENCES);

    const result = await collection.deleteOne({ 
      _id: id, 
      category: 'jersey' 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Jersey reference not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Deleted jersey reference: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Jersey reference deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting jersey reference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete jersey reference' },
      { status: 500 }
    );
  }
} 