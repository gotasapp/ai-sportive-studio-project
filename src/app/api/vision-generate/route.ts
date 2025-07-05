import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Verify API key at runtime
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing OPENAI_API_KEY in environment variables'
      }, { status: 500 });
    }

    // Initialize OpenAI client with runtime verification
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('🎨 [VISION-GENERATE] Direct DALL-E 3 generation for Vision Test');
    
    const { prompt, quality = 'standard' } = await request.json();

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    console.log('📝 [VISION-GENERATE] Generating with prompt length:', prompt.length);
    console.log('🎯 [VISION-GENERATE] Quality:', quality);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: quality as 'standard' | 'hd',
      n: 1,
    });

    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ [VISION-GENERATE] Image generated, downloading...');

    // Download and convert to base64
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    console.log('✅ [VISION-GENERATE] Image converted to base64');

    const cost = quality === 'standard' ? 0.04 : 0.08;

    return NextResponse.json({
      success: true,
      image_base64: imageBase64,
      cost_usd: cost,
      image_url: imageUrl
    });

  } catch (error: any) {
    console.error('❌ [VISION-GENERATE] Error:', error);
    
    // Handle OpenAI specific errors
    if (error?.error?.code === 'content_policy_violation') {
      return NextResponse.json({
        success: false,
        error: 'Content policy violation. Please modify your request and try again.'
      }, { status: 400 });
    }
    
    if (error?.error?.code === 'rate_limit_exceeded') {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Image generation failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vision Test DALL-E 3 Generator',
    status: 'online',
    model: 'dall-e-3',
    qualities: ['standard', 'hd']
  });
} 