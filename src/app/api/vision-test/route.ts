import { NextRequest, NextResponse } from 'next/server';

const VISION_API_BASE_URL = process.env.NEXT_PUBLIC_VISION_API_URL || 'http://localhost:8002';



export async function POST(request: NextRequest) {
  try {
    const { image_base64, prompt, model } = await request.json()

    console.log('🎯 [VISION-TEST API] Received analysis request')

    // Validação dos parâmetros obrigatórios
    if (!image_base64) {
      console.log('❌ [VISION-TEST API] Missing image_base64')
      return NextResponse.json({
        success: false,
        error: 'image_base64 is required'
      }, { status: 400 })
    }

    if (!prompt) {
      console.log('❌ [VISION-TEST API] Missing prompt')
      return NextResponse.json({
        success: false,
        error: 'prompt is required'
      }, { status: 400 })
    }

    const isStructuredPrompt = prompt.includes('return ONLY a valid JSON object')
    
    console.log(`🔍 [VISION-TEST API] Processing analysis:`, {
      model: model || 'default',
      promptLength: prompt.length,
      imageSize: image_base64.length,
      isStructuredPrompt,
      timestamp: new Date().toISOString()
    })
    
          console.log(`📝 [VISION-TEST API] Prompt preview:`, (prompt as string).substring(0, 150) + '...')

    // Chamar a API Python do Vision Test
    const pythonResponse = await fetch(`${VISION_API_BASE_URL}/analyze-image-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64,
        analysis_prompt: prompt,
        model: model || 'openrouter/gpt-4o-mini'
      }),
    })

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text()
      console.error(`❌ Python API error (${pythonResponse.status}):`, errorText)
      
      return NextResponse.json({
        success: false,
        error: `Vision analysis failed: ${pythonResponse.status} - ${errorText}`
      }, { status: 400 })
    }

    const result = await pythonResponse.json()
    
    if (!result.success) {
      console.error('❌ Python API returned error:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Vision analysis failed'
      }, { status: 400 })
    }

    console.log('✅ Vision Test: Analysis completed successfully')
    
    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      model_used: result.model_used || model,
      cost_estimate: result.cost_estimate || 0,
      metadata: {
        prompt_length: prompt.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Vision Test route error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during vision analysis'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Health check - verificar se a API Python está funcionando
    const healthResponse = await fetch(`${VISION_API_BASE_URL}/health`, {
      method: 'GET',
    })

    const isHealthy = healthResponse.ok

    return NextResponse.json({
      success: true,
      status: isHealthy ? 'online' : 'offline',
      api_url: VISION_API_BASE_URL,
      available_models: [
        'openrouter/gpt-4o-mini',
        'openrouter/gpt-4o',
        'openrouter/claude-3-sonnet',
        'openrouter/claude-3-haiku'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Vision Test GET error:', error)
    return NextResponse.json({
      success: false,
      status: 'offline',
      error: 'Failed to connect to Vision API'
    }, { status: 503 })
  }
} 