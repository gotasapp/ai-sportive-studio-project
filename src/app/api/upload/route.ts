import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload image to Cloudinary
 *     description: |
 *       Uploads an image file to Cloudinary storage and returns the secure URL.
 *       Supports various image formats for NFT assets.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               fileName:
 *                 type: string
 *                 description: Custom filename (optional)
 *                 example: "jersey_design_001"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Cloudinary secure URL
 *                   example: "https://res.cloudinary.com/dpilz4p6g/image/upload/v1234567890/jersey_design_001.jpg"
 *                 public_id:
 *                   type: string
 *                   description: Cloudinary public ID
 *                 width:
 *                   type: number
 *                   description: Image width in pixels
 *                 height:
 *                   type: number
 *                   description: Image height in pixels
 *       400:
 *         description: No file provided or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file provided"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Converter file para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload para Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: fileName || `jersey_${Date.now()}`,
          folder: 'jerseys', // Organizar em pasta
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
} 