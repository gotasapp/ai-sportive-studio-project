import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const category = formData.get('category') as string; // 'jersey', 'stadium', 'badge'
    const teamName = formData.get('teamName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!category || !['jersey', 'stadium', 'badge'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category. Must be jersey, stadium, or badge' }, { status: 400 });
    }

    if (!teamName) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validar tamanho (max 10MB para referências)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Converter file para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome do arquivo único
    const timestamp = Date.now();
    const cleanTeamName = teamName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_') : `reference_${timestamp}`;
    const publicId = `${category}_${cleanTeamName}_${cleanFileName}_${timestamp}`;

    console.log('📤 Uploading reference image to Cloudinary:', {
      category,
      teamName: cleanTeamName,
      fileName: cleanFileName,
      publicId,
      fileSize: file.size,
      fileType: file.type
    });

    // Upload para Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          folder: `references/${category}`, // Organizar em pastas por categoria
          transformation: [
            { width: 1024, height: 1024, crop: 'limit' }, // Limitar tamanho máximo
            { quality: 'auto:good' }, // Otimizar qualidade
            { fetch_format: 'auto' } // Formato otimizado
          ],
          tags: [category, 'reference', cleanTeamName], // Tags para organização
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result?.secure_url);
            resolve(result);
          }
        }
      ).end(buffer);
    });

    const uploadResult = result as any;

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      metadata: {
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
        uploadedAt: new Date().toISOString(),
        category,
        teamName,
        fileName: cleanFileName
      }
    });

  } catch (error) {
    console.error('❌ Reference image upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
} 