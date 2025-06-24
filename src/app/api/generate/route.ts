import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 [GENERATE API] Received request');
    console.log('📦 [GENERATE API] Request type:', body.type || 'unknown');
    console.log('📍 [GENERATE API] Target URL:', `${API_BASE_URL}/generate`);
    
    // Adapt request for Vision Test
    let adaptedBody = { ...body };
    
    if (body.type === 'vision-test') {
      console.log('🎯 [GENERATE API] Adapting Vision Test request for DALL-E 3 direct generation');
      
      // For Vision Test, use stadium type which allows direct DALL-E 3 generation
      // without requiring specific team model_ids
      adaptedBody = {
        prompt: body.prompt,
        quality: body.quality || 'standard',
        type: 'stadium', // Use stadium type for direct DALL-E 3 generation
        // Optional fields for tracking
        sport: body.metadata?.sport || 'soccer',
        view: body.metadata?.view || 'front',
        style: body.metadata?.style || 'classic',
        metadata: body.metadata
      };
      
      console.log('✅ [GENERATE API] Adapted Vision Test for direct DALL-E 3:', {
        type: adaptedBody.type,
        sport: adaptedBody.sport,
        view: adaptedBody.view,
        promptLength: adaptedBody.prompt.length,
        quality: adaptedBody.quality
      });
    }
    
    console.log('📦 [GENERATE API] Final request body:', JSON.stringify(adaptedBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(adaptedBody),
    });

    console.log('📬 [GENERATE API] Python API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [GENERATE API] Python API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Python API error: ${response.status} - ${errorText}` 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ [GENERATE API] Python API success:', {
      success: result.success,
      type: body.type,
      hasImage: !!result.image_base64
    });
    
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