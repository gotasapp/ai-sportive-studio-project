import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 [GENERATE API] Received request');
    console.log('📦 [GENERATE API] Request type:', body.type || 'unknown');
    console.log('📦 [GENERATE API] Request model_id:', body.model_id || 'unknown');
    console.log('📍 [GENERATE API] Target URL:', `${API_BASE_URL}/generate`);
    
    // ===== DUAL SYSTEM DETECTION =====
    const isVisionEnhanced = !!(body.reference_image_base64 || body.generation_mode === 'vision_enhanced');
    const isBadgeGeneration = !!(body.badge_name || body.badge_number);
    const isVisionTest = body.type === 'vision-test';
    
    console.log('🎯 [GENERATE API] System detection:', {
      isVisionEnhanced,
      isBadgeGeneration,
      isVisionTest,
      hasReferenceImage: !!body.reference_image_base64,
      hasVisionAnalysis: !!body.vision_analysis
    });
    
    // Adapt request for different types
    let adaptedBody = { ...body };
    
    // ===== VISION ENHANCED GENERATION =====
    if (isVisionEnhanced) {
      console.log('👁️ [GENERATE API] Processing Vision Enhanced generation');
      console.log('👁️ [GENERATE API] Vision details:', {
        model_id: body.model_id,
        player_name: body.player_name,
        player_number: body.player_number,
        hasCustomPrompt: !!body.custom_prompt,
        hasAnalysis: !!body.vision_analysis
      });
      
      // Enhanced request with vision data
      adaptedBody = {
        model_id: body.model_id,
        player_name: body.player_name || 'PLAYER',
        player_number: body.player_number || '10',
        quality: body.quality || 'standard',
        // Vision Analysis fields
        reference_image_base64: body.reference_image_base64,
        custom_prompt: body.custom_prompt,
        vision_analysis: body.vision_analysis,
        generation_mode: 'vision_enhanced',
        // Sport-specific context
        sport: body.sport || 'soccer',
        view: body.view || 'back',
        vision_model: body.vision_model || 'openai/gpt-4o-mini',
        type: 'jersey-vision' // Special type for vision-enhanced jerseys
      };
      
      console.log('✅ [GENERATE API] Prepared Vision Enhanced request for Python API');
    }
    
    // Handle Badge Generation
    else if (body.badge_name || body.badge_number) {
      console.log('🏆 [GENERATE API] Detected badge generation request');
      console.log('🏆 [GENERATE API] Badge details:', {
        model_id: body.model_id,
        badge_name: body.badge_name,
        badge_number: body.badge_number,
        style: body.style
      });
      
      // Adapt badge request to jersey format for Python API
      adaptedBody = {
        model_id: body.model_id, // Team name
        player_name: body.badge_name || 'BADGE',
        player_number: body.badge_number || '1',
        quality: body.quality || 'standard',
        style: body.style || 'modern',
        type: 'badge' // Keep badge type for tracking
      };
      
      console.log('✅ [GENERATE API] Adapted badge request for Python API:', adaptedBody);
    }
    
    // Handle Vision Test
    else if (body.type === 'vision-test') {
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
    
    // ===== STANDARD MODE - ORIGINAL SYSTEM =====
    else {
      console.log('🎨 [GENERATE API] Using Standard Mode (Original System)');
      console.log('🎨 [GENERATE API] Standard details:', {
        model_id: body.model_id,
        player_name: body.player_name,
        player_number: body.player_number,
        quality: body.quality
      });
      
      // Standard request - keep original format that works with main_unified.py
      adaptedBody = {
        model_id: body.model_id,
        player_name: body.player_name || 'PLAYER',
        player_number: body.player_number || '10',
        quality: body.quality || 'standard'
      };
      
      console.log('✅ [GENERATE API] Standard request prepared for Python API');
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
    
    // Enhanced logging for different generation types
    let generationType = 'standard';
    if (isVisionEnhanced) {
      generationType = 'vision-enhanced';
    } else if (isBadgeGeneration) {
      generationType = 'badge';
    } else if (isVisionTest) {
      generationType = 'vision-test';
    }
    
    console.log('✅ [GENERATE API] Python API success:', {
      success: result.success,
      generationType,
      hasImage: !!result.image_base64,
      hasPromptUsed: !!result.prompt_used,
      cost: result.cost_usd || 'unknown'
    });
    
    // Add generation metadata to response
    if (result.success) {
      result.metadata = {
        ...result.metadata,
        generation_type: generationType,
        timestamp: new Date().toISOString(),
        vision_enhanced: isVisionEnhanced
      };
    }
    
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