import { NextRequest, NextResponse } from 'next/server';

const VISION_API_BASE_URL = process.env.NEXT_PUBLIC_VISION_API_URL || 'http://localhost:8002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 Vision Test Proxy: Forwarding request to vision API...');
    console.log('📍 Target URL:', `${VISION_API_BASE_URL}/analyze-image-base64`);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${VISION_API_BASE_URL}/analyze-image-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📬 Vision API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vision API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Vision API error: ${response.status} - ${errorText}` 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Vision API success:', result.success);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Vision Test Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Vision Test Proxy error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Vision Test API Proxy',
    status: 'online',
    target: VISION_API_BASE_URL 
  });
} 