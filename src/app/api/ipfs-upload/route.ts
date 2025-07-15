import { NextRequest, NextResponse } from 'next/server';
import { IPFSService } from '@/lib/services/ipfs-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 IPFS Upload API called');

    // Check if IPFS is configured
    if (!IPFSService.isConfigured()) {
      return NextResponse.json(
        { error: 'IPFS service not configured. Please add Pinata credentials.' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📋 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Convert File to Blob for IPFSService
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Upload to IPFS
    const result = await IPFSService.uploadImage(blob, file.name);

    console.log('✅ File uploaded to IPFS:', result);

    return NextResponse.json({
      success: true,
      ipfsUrl: result,
      filename: file.name,
      size: file.size
    });

  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload to IPFS',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 