import { NextRequest, NextResponse } from 'next/server';

// Unificada com a API principal do Render
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      apiUrl: API_BASE_URL,
      timestamp: new Date().toISOString()
    })
    
    console.log(`📝 [VISION-TEST API] Prompt preview:`, (prompt as string).substring(0, 150) + '...')

    // Chamar a API unificada do Render com endpoint de vision analysis
    const pythonResponse = await fetch(`${API_BASE_URL}/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64,
        prompt: prompt, // Usando 'prompt' em vez de 'analysis_prompt' para consistência
        model: model || 'openai/gpt-4o-mini',
        type: 'vision-analysis' // Identificar como análise de visão
      }),
    })

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text()
      console.error(`❌ Vision API error (${pythonResponse.status}):`, errorText)
      
      return NextResponse.json({
        success: false,
        error: `Vision analysis failed: ${pythonResponse.status} - ${errorText}`
      }, { status: 400 })
    }

    const result = await pythonResponse.json()
    
    if (!result.success) {
      console.error('❌ Vision API returned error:', result.error)
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
        api_endpoint: `${API_BASE_URL}/analyze-image`,
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
    // Health check - verificar se a API unificada está funcionando
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    })

    const isHealthy = healthResponse.ok

    return NextResponse.json({
      success: true,
      status: isHealthy ? 'online' : 'offline',
      api_url: API_BASE_URL,
      endpoint: `${API_BASE_URL}/analyze-image`,
      available_models: [
        'openai/gpt-4o-mini',
        'openai/gpt-4o',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Vision Test GET error:', error)
    return NextResponse.json({
      success: false,
      status: 'offline',
      error: 'Failed to connect to unified API',
      api_url: API_BASE_URL
    }, { status: 503 })
  }
} 