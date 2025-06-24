import { NextRequest, NextResponse } from 'next/server'

// Prompts estruturados que retornam JSON para análise de jerseys
const STRUCTURED_ANALYSIS_PROMPTS = {
  "soccer": {
    "front": `Analyze this soccer jersey front view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["color1", "color2", "color3"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description", 
  "style": "classic/modern/retro/vintage/urban/premium",
  "neckline": "collar type and details",
  "fit": "loose/fitted/athletic/oversized",
  "teamBadge": "team logo/badge details and placement",
  "sponsor": "sponsor logo details and placement",
  "frontDesign": "unique front design elements",
  "uniqueFeatures": "special design elements"
}

Focus on: colors, patterns, fabric texture, logos, badges, collar style, and overall design aesthetic.
Return ONLY valid JSON, no additional text.`,
    
    "back": `Analyze this soccer jersey back view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["color1", "color2", "color3"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description",
  "style": "classic/modern/retro/vintage/urban/premium",
  "neckline": "collar type and details",
  "fit": "loose/fitted/athletic/oversized",
  "nameArea": "location and style of player name area",
  "numberArea": "location, size and style of number area",
  "backDesign": "unique back design elements",
  "uniqueFeatures": "special design elements"
}

Focus on: colors, patterns, fabric texture, name/number placement, collar style, and overall design aesthetic.
Return ONLY valid JSON, no additional text.`
  },
  
  "basketball": {
    "front": `Analyze this basketball jersey front view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["color1", "color2", "color3"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description",
  "style": "classic/modern/retro/vintage/urban/premium",
  "armholes": "armhole design and trim details",
  "fit": "loose/fitted/athletic/oversized",
  "teamLogo": "team logo details and placement",
  "frontNumber": "front number style if visible",
  "frontDesign": "unique front design elements",
  "uniqueFeatures": "special design elements"
}

Focus on: colors, patterns, fabric texture, logos, armhole design, and overall basketball aesthetic.
Return ONLY valid JSON, no additional text.`,
    
    "back": `Analyze this basketball jersey back view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["color1", "color2", "color3"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description",
  "style": "classic/modern/retro/vintage/urban/premium",
  "armholes": "armhole design and trim details",
  "fit": "loose/fitted/athletic/oversized",
  "nameArea": "location and style of player name area",
  "numberArea": "location, size and style of number area",
  "backDesign": "unique back design elements",
  "uniqueFeatures": "special design elements"
}

Focus on: colors, patterns, fabric texture, name/number placement, armhole design, and overall basketball aesthetic.
Return ONLY valid JSON, no additional text.`
  },
  
  "nfl": {
    "front": `Analyze this NFL jersey front view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["color1", "color2", "color3"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description",
  "style": "classic/modern/retro/vintage/urban/premium",
  "shoulderPads": "shoulder design and padding details",
  "fit": "loose/fitted/athletic/oversized",
  "teamLogo": "team logo details and placement",
  "frontNumber": "front number style if visible",
  "frontDesign": "unique front design elements",
  "uniqueFeatures": "special design elements"
}

Focus on: colors, patterns, fabric texture, logos, shoulder design, and overall football aesthetic.
Return ONLY valid JSON, no additional text.`,
    
    "back": `Analyze this NFL jersey back view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["color1", "color2", "color3"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description",
  "style": "classic/modern/retro/vintage/urban/premium",
  "shoulderPads": "shoulder design and padding details",
  "fit": "loose/fitted/athletic/oversized",
  "nameArea": "location and style of player name area",
  "numberArea": "location, size and style of number area",
  "backDesign": "unique back design elements",
  "uniqueFeatures": "special design elements"
}

Focus on: colors, patterns, fabric texture, name/number placement, shoulder design, and overall football aesthetic.
Return ONLY valid JSON, no additional text.`
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [ANALYSIS PROMPT] Received request for structured analysis prompt')
    
    const { sport, view } = await request.json()
    
    console.log('📋 [ANALYSIS PROMPT] Request details:', {
      sport,
      view,
      timestamp: new Date().toISOString()
    })

    // Validar parâmetros
    if (!sport || !view) {
      console.log('❌ [ANALYSIS PROMPT] Missing required parameters')
      return NextResponse.json({
        success: false,
        error: 'Sport and view parameters are required'
      }, { status: 400 })
    }

    // Validar sport
    if (!['soccer', 'basketball', 'nfl'].includes(sport)) {
      console.log('❌ [ANALYSIS PROMPT] Invalid sport:', sport)
      return NextResponse.json({
        success: false,
        error: 'Invalid sport. Must be: soccer, basketball, or nfl'
      }, { status: 400 })
    }

    // Validar view
    if (!['front', 'back'].includes(view)) {
      console.log('❌ [ANALYSIS PROMPT] Invalid view:', view)
      return NextResponse.json({
        success: false,
        error: 'Invalid view. Must be: front or back'
      }, { status: 400 })
    }

    // Obter prompt estruturado específico
    const sportPrompts = STRUCTURED_ANALYSIS_PROMPTS[sport as keyof typeof STRUCTURED_ANALYSIS_PROMPTS]
    const analysisPrompt = sportPrompts?.[view as keyof typeof sportPrompts]

    if (!analysisPrompt) {
      console.log('❌ [ANALYSIS PROMPT] Prompt not found for:', sport, view)
      return NextResponse.json({
        success: false,
        error: `Structured analysis prompt not found for ${sport} ${view} view`
      }, { status: 404 })
    }

    console.log('✅ [ANALYSIS PROMPT] Successfully retrieved structured prompt:', {
      sport,
      view,
      promptLength: analysisPrompt.length,
      type: 'JSON_STRUCTURED',
      preview: analysisPrompt.substring(0, 100) + '...'
    })

    return NextResponse.json({
      success: true,
      analysis_prompt: analysisPrompt.trim(),
      metadata: {
        sport,
        view,
        type: 'structured_json',
        prompt_length: analysisPrompt.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [ANALYSIS PROMPT] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get structured analysis prompt'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 [ANALYSIS PROMPT] GET request for prompt info')
    
    const url = new URL(request.url)
    const sport = url.searchParams.get('sport')
    const view = url.searchParams.get('view')

    if (!sport || !view) {
      // Return all available prompts info
      const info = Object.keys(STRUCTURED_ANALYSIS_PROMPTS).map(sport => ({
        sport,
        views: Object.keys(STRUCTURED_ANALYSIS_PROMPTS[sport as keyof typeof STRUCTURED_ANALYSIS_PROMPTS]),
        total_prompts: Object.keys(STRUCTURED_ANALYSIS_PROMPTS[sport as keyof typeof STRUCTURED_ANALYSIS_PROMPTS]).length
      }))

      console.log('📊 [ANALYSIS PROMPT] Returning all available prompts:', info)

      return NextResponse.json({
        success: true,
        available_prompts: info,
        total_sports: Object.keys(STRUCTURED_ANALYSIS_PROMPTS).length,
        type: 'structured_json_prompts'
      })
    }

    // Same logic as POST for specific prompt
    const sportPrompts = STRUCTURED_ANALYSIS_PROMPTS[sport as keyof typeof STRUCTURED_ANALYSIS_PROMPTS]
    const analysisPrompt = sportPrompts?.[view as keyof typeof sportPrompts]

    if (!analysisPrompt) {
      console.log('❌ [ANALYSIS PROMPT] GET - Prompt not found for:', sport, view)
      return NextResponse.json({
        success: false,
        error: `Structured analysis prompt not found for ${sport} ${view} view`
      }, { status: 404 })
    }

    console.log('✅ [ANALYSIS PROMPT] GET - Successfully retrieved prompt:', {
      sport,
      view,
      promptLength: analysisPrompt.length
    })

    return NextResponse.json({
      success: true,
      analysis_prompt: analysisPrompt.trim(),
      metadata: {
        sport,
        view,
        type: 'structured_json',
        prompt_length: analysisPrompt.length
      }
    })

  } catch (error) {
    console.error('❌ [ANALYSIS PROMPT] GET Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get structured analysis prompt'
    }, { status: 500 })
  }
} 