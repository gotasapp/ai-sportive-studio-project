import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jersey-api-dalle3.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 Proxy: Forwarding request to external API...');
    console.log('📍 Target URL:', `${API_BASE_URL}/generate`);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📬 External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ External API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `External API error: ${response.status} - ${errorText}` 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ External API success:', result.success);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Proxy error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Generator API Proxy',
    status: 'online',
    target: API_BASE_URL 
  });
} 