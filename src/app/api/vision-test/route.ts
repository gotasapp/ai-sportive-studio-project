import { NextRequest, NextResponse } from 'next/server';

// Unificada com a API principal do Render
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jersey-api-dalle3.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const { image_base64, prompt, model } = await request.json()

    console.log('🎯 [VISION-TEST API] Received analysis request')
    console.log('🔧 [VISION-TEST API] Environment check:', {
      API_BASE_URL,
      isProduction: process.env.NODE_ENV === 'production',
      hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL
    })

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

    // Verificar se a API base URL está configurada
    if (!API_BASE_URL) {
      console.log('❌ [VISION-TEST API] API_BASE_URL not configured')
      return NextResponse.json({
        success: false,
        error: 'API base URL not configured.',
        debug: {
          currentUrl: API_BASE_URL,
          environment: process.env.NODE_ENV
        }
      }, { status: 500 })
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

    // Primeiro, verificar se a API está online
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 10000 // 10 segundos para health check
      })
      
      if (!healthResponse.ok) {
        console.log('❌ [VISION-TEST API] API health check failed:', {
          status: healthResponse.status,
          statusText: healthResponse.statusText
        })
        
        return NextResponse.json({
          success: false,
          error: 'Python API is not responding. Please check if the service is running.',
          debug: {
            apiUrl: API_BASE_URL,
            healthStatus: healthResponse.status
          }
        }, { status: 503 })
      }
      
      console.log('✅ [VISION-TEST API] Python API health check passed')
      
    } catch (healthError: any) {
      console.error('❌ [VISION-TEST API] Failed to connect to Python API:', healthError.message)
      
      return NextResponse.json({
        success: false,
        error: `Cannot connect to Python API: ${healthError.message}`,
        debug: {
          apiUrl: API_BASE_URL,
          errorType: 'connection_error'
        }
      }, { status: 503 })
    }

    // Chamar a API unificada do Render com endpoint de vision analysis
    const targetUrl = `${API_BASE_URL}/analyze-image`
    console.log(`🌐 [VISION-TEST API] Calling unified API:`, {
      url: targetUrl,
      hasImageData: !!image_base64,
      model: model || 'openai/gpt-4o-mini'
    })

    try {
      const pythonResponse = await fetch(targetUrl, {
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
        timeout: 60000 // 60 segundos timeout
      })

      console.log(`🔄 [VISION-TEST API] Python API response:`, {
        status: pythonResponse.status,
        statusText: pythonResponse.statusText,
        ok: pythonResponse.ok
      })

      if (!pythonResponse.ok) {
        const errorText = await pythonResponse.text()
        console.error(`❌ Vision API error (${pythonResponse.status}):`, errorText)
        
        return NextResponse.json({
          success: false,
          error: `Vision analysis failed: ${pythonResponse.status} - ${errorText}`,
          debug: {
            apiUrl: targetUrl,
            status: pythonResponse.status,
            statusText: pythonResponse.statusText
          }
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      console.error(`❌ [VISION-TEST API] Fetch error:`, fetchError.message)
      
      return NextResponse.json({
        success: false,
        error: `Failed to connect to unified API: ${fetchError.message}`,
        debug: {
          apiUrl: targetUrl,
          errorType: 'fetch_error'
        }
      }, { status: 500 })
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