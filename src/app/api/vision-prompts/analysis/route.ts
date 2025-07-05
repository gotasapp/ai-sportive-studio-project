import { NextRequest, NextResponse } from 'next/server'

// ANALYSIS PROMPTS: Prompts que a IA de visão usa para ANALISAR a imagem enviada
// Baseado exatamente no sistema original vision-test
// Estes prompts retornam JSON estruturado com características visuais específicas por esporte

const STRUCTURED_ANALYSIS_PROMPTS = {
  "soccer": {
    "front": `Analyze the uploaded soccer jersey image (front view). Extract the following visual details and return ONLY a valid JSON object:

{
  "dominantColors": ["primary color", "secondary color", "accent color"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description", 
  "style": "classic/modern/retro/vintage/urban/premium",
  "neckline": "collar type and details (round/V-neck/polo collar)",
  "fit": "loose/fitted/athletic/oversized",
  "teamBadge": "team logo/badge details and placement",
  "sponsor": "sponsor logo details and placement",
  "frontDesign": "unique front design elements",
  "chestLayout": "sponsor logos, team crest, central numbers layout",
  "sleeveDesign": "piping, striping, sponsor logos on sleeves",
  "uniqueFeatures": "special design elements that make this jersey unique"
}

Focus on: chest layout with sponsor logos and team crest, collar and neckline style, sleeve design details, fabric texture, and overall soccer-specific design aesthetic.
Return ONLY valid JSON, no additional text.`,
    
    "back": `Analyze the uploaded soccer jersey image (back view). Extract the following visual details and return ONLY a valid JSON object:

{
  "dominantColors": ["primary color", "secondary color", "accent color"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture description",
  "style": "classic/modern/retro/vintage/urban/premium",
  "neckline": "collar type and details viewed from back",
  "fit": "loose/fitted/athletic/oversized",
  "nameArea": "location and style of player name area (top-back, centered)",
  "numberArea": "location, size and style of number area",
  "backDesign": "unique back design elements",
  "shoulderDetails": "shoulder and sleeve details from back view",
  "sponsorPresence": "any sponsor logos visible on back",
  "uniqueFeatures": "special design elements that make this jersey unique"
}

Focus on: player name and number placement area, shoulder and sleeve details, back-specific design elements, fabric texture, and overall soccer jersey characteristics.
Return ONLY valid JSON, no additional text.`
  },
  
  "basketball": {
    "front": `Analyze the uploaded basketball jersey image (front view). Extract the following and return ONLY a valid JSON object:

{
  "dominantColors": ["primary color", "secondary color", "accent color"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture (mesh/smooth/perforated)",
  "style": "classic/modern/retro/vintage/urban/premium",
  "armholes": "armhole design and trim details",
  "fit": "loose/fitted/athletic/oversized",
  "teamLogo": "team logo details and placement",
  "frontNumber": "front number style if visible",
  "frontDesign": "unique front design elements",
  "chestDesign": "team name/logo, number style and placement on chest",
  "necklineTrim": "neckline shape and trim details",
  "uniqueFeatures": "basketball-specific design elements"
}

Focus on: chest design with team name/logo, neckline shape and trim, armhole cut and sleeve trim, fabric style (mesh/perforated/smooth), and basketball-specific aesthetic.
Return ONLY valid JSON, no additional text.`,
    
    "back": `Analyze the uploaded basketball jersey image (back view). Extract the following and return ONLY a valid JSON object:

{
  "dominantColors": ["primary color", "secondary color", "accent color"],
  "pattern": "description of pattern (stripes, solid, geometric, etc.)",
  "fabric": "fabric type and texture (mesh/smooth/perforated)",
  "style": "classic/modern/retro/vintage/urban/premium",
  "armholes": "armhole design and trim details",
  "fit": "loose/fitted/athletic/oversized",
  "nameArea": "location and style of player name area (curved above number)",
  "numberArea": "location, size and style of number area",
  "backDesign": "unique back design elements",
  "pipingPattern": "piping, yoke pattern, shoulder detail",
  "teamBranding": "any visible team branding or sponsor logo",
  "uniqueFeatures": "basketball-specific design elements"
}

Focus on: player name and number font style and position, back design elements with piping and yoke patterns, armhole cut and trim, fabric style, and basketball-specific characteristics.
Return ONLY valid JSON, no additional text.`
  },
  
  "nfl": {
    "front": `Analyze the uploaded NFL jersey image (front view). Extract the following and return ONLY a valid JSON object:

{
  "dominantColors": ["primary color", "secondary color", "accent color"],
  "pattern": "description of pattern (stripes, solid, two-tone, etc.)",
  "fabric": "fabric type and texture (mesh/thick matte/glossy)",
  "style": "classic/modern/retro/vintage/urban/premium",
  "shoulderPads": "shoulder pad detailing and design",
  "fit": "loose/fitted/athletic/oversized",
  "teamLogo": "team logo details and placement",
  "frontNumber": "front number style and location if visible",
  "frontDesign": "unique front design elements",
  "chestLayout": "chest logo or number location and size",
  "necklineDesign": "neckline design and collar type",
  "sleeveElements": "team logo, stripe, or design on sleeves",
  "uniqueFeatures": "NFL-specific design elements"
}

Focus on: chest logo or number location, shoulder pad detailing and stripe patterns, sleeve elements, neckline design, fabric texture (mesh/thick/matte), and NFL-specific styling.
Return ONLY valid JSON, no additional text.`,
    
    "back": `Analyze the uploaded NFL jersey image (back view). Extract the following and return ONLY a valid JSON object:

{
  "dominantColors": ["primary color", "secondary color", "accent color"],
  "pattern": "description of pattern (stripes, solid, two-tone, etc.)",
  "fabric": "fabric type and texture (mesh/thick matte/glossy)",
  "style": "classic/modern/retro/vintage/urban/premium",
  "shoulderPads": "shoulder pad detailing visible from back",
  "fit": "loose/fitted/athletic/oversized",
  "nameArea": "location and style of player name (top-back, centered)",
  "numberArea": "location, size and style of number area",
  "backDesign": "unique back design elements",
  "shoulderDetails": "shoulder detailing or logos visible from back",
  "sleeveDesign": "sleeve cut and stripe design",
  "jerseyShape": "jersey cut and shape (broad shoulders, tapered waist)",
  "uniqueFeatures": "NFL-specific design elements"
}

Focus on: player name placement (top-back, centered) and font style, player number position and size, jersey cut and shape with broad shoulders, shoulder detailing, and NFL-specific characteristics.
Return ONLY valid JSON, no additional text.`
  }
}

// Stadium Analysis Prompts
const STADIUM_ANALYSIS_PROMPTS = {
  stadium: {
    external: `Analyze this stadium image and return a JSON object with the following structure:
{
  "architectural_style": "modern/classic/traditional/futuristic",
  "structure_type": "bowl/horseshoe/oval/rectangular", 
  "capacity_estimate": "small/medium/large/massive",
  "roof_type": "open/partial/closed/retractable",
  "facade_materials": "concrete/steel/glass/mixed",
  "seating_colors": ["primary color", "secondary color"],
  "lighting_setup": "day/night/mixed/floodlights",
  "atmosphere": "packed/moderate/empty",
  "perspective": "aerial/ground/elevated/internal",
  "weather_conditions": "clear/cloudy/dramatic/sunset",
  "architectural_features": ["notable features like towers, arches, etc"],
  "landscape_context": "urban/suburban/isolated/integrated",
  "predominant_colors": ["list of main colors seen"],
  "unique_characteristics": "brief description of what makes this stadium distinctive"
}

Focus on architectural elements, structural design, capacity indicators, materials, and atmospheric conditions.`,

    internal: `Analyze this stadium interior image and return a JSON object with the following structure:
{
  "interior_type": "bowl/tier/box/field_level",
  "seating_layout": "single_tier/multi_tier/curved/straight",
  "field_surface": "grass/artificial/track/court",
  "seating_colors": ["primary color", "secondary color"],
  "crowd_density": "packed/half_full/empty/sparse",
  "lighting_type": "natural/artificial/mixed/dramatic",
  "roof_visibility": "open/covered/partial/retractable",
  "architectural_features": ["pillars, arches, screens, etc"],
  "atmosphere_mood": "energetic/calm/dramatic/professional",
  "perspective_level": "field/lower_tier/upper_tier/premium",
  "predominant_colors": ["list of main interior colors"],
  "scale_indicators": "intimate/medium/large/massive",
  "unique_elements": "description of distinctive interior features"
}

Focus on interior architecture, seating arrangements, lighting, atmosphere, and spatial characteristics.`
  }
}

// Sport-specific focus areas for analysis guidance
const SPORT_FOCUS_AREAS = {
  "soccer": {
    "front": ["chest layout", "team crest", "sponsor logos", "collar style", "sleeve design"],
    "back": ["name/number placement", "shoulder details", "back design", "fabric texture"]
  },
  "basketball": {
    "front": ["team name/logo", "neckline trim", "armhole design", "fabric mesh", "front number"],
    "back": ["curved name placement", "large number", "piping patterns", "armhole trim"]
  },
  "nfl": {
    "front": ["chest logo", "shoulder pads", "neckline design", "sleeve elements", "thick fabric"],
    "back": ["top-back name", "large number", "shoulder details", "jersey shape"]
  },
  "stadium": {
    "external": ["architectural style", "structure type", "roof design", "facade materials", "lighting setup", "landscape context"],
    "internal": ["seating layout", "field surface", "lighting type", "crowd density", "architectural features", "atmosphere mood"]
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [ANALYSIS PROMPT API] Received request for structured analysis prompt')
    
    const { sport, view } = await request.json()
    
    console.log('📋 [ANALYSIS PROMPT API] Request details:', {
      sport,
      view,
      timestamp: new Date().toISOString()
    })

    // Validar parâmetros obrigatórios
    if (!sport || !view) {
      console.log('❌ [ANALYSIS PROMPT API] Missing required parameters')
      return NextResponse.json({
        success: false,
        error: 'Sport and view parameters are required'
      }, { status: 400 })
    }

    // Validar sport/type (includes stadium)
    if (!['soccer', 'basketball', 'nfl', 'stadium'].includes(sport)) {
      console.log('❌ [ANALYSIS PROMPT API] Invalid sport/type:', sport)
      return NextResponse.json({
        success: false,
        error: 'Invalid type. Must be: soccer, basketball, nfl, or stadium'
      }, { status: 400 })
    }

    // Validar view (different for stadium)
    const validViews = sport === 'stadium' ? ['external', 'internal'] : ['front', 'back']
    if (!validViews.includes(view)) {
      console.log('❌ [ANALYSIS PROMPT API] Invalid view:', view, 'for type:', sport)
      return NextResponse.json({
        success: false,
        error: `Invalid view. For ${sport} must be: ${validViews.join(' or ')}`
      }, { status: 400 })
    }

    // Obter prompt estruturado específico (support both sports and stadium)
    const allPrompts = { ...STRUCTURED_ANALYSIS_PROMPTS, ...STADIUM_ANALYSIS_PROMPTS }
    const sportPrompts = allPrompts[sport as keyof typeof allPrompts]
    const analysisPrompt = sportPrompts?.[view as keyof typeof sportPrompts]

    if (!analysisPrompt) {
      console.log('❌ [ANALYSIS PROMPT API] Prompt not found for:', sport, view)
      return NextResponse.json({
        success: false,
        error: `Structured analysis prompt not found for ${sport} ${view} view`
      }, { status: 404 })
    }

    // Obter áreas de foco
    const focusAreas = SPORT_FOCUS_AREAS[sport as keyof typeof SPORT_FOCUS_AREAS]?.[view as keyof typeof SPORT_FOCUS_AREAS[typeof sport]] || []

    console.log('✅ [ANALYSIS PROMPT API] Successfully retrieved structured prompt:', {
      sport,
      view,
      promptLength: analysisPrompt.length,
      type: 'JSON_STRUCTURED',
      focusAreasCount: focusAreas.length,
      preview: analysisPrompt.substring(0, 150) + '...'
    })

    return NextResponse.json({
      success: true,
      analysis_prompt: analysisPrompt.trim(),
      metadata: {
        sport,
        view,
        type: 'structured_json',
        prompt_length: analysisPrompt.length,
        focus_areas: focusAreas,
        expected_output: 'JSON',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [ANALYSIS PROMPT API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get structured analysis prompt'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 [ANALYSIS PROMPT API] GET request - returning available options')
    
    return NextResponse.json({
      success: true,
      available_sports: Object.keys(STRUCTURED_ANALYSIS_PROMPTS),
      available_views: {
        soccer: ['front', 'back'],
        basketball: ['front', 'back'],
        nfl: ['front', 'back']
      },
      sport_focus_areas: SPORT_FOCUS_AREAS,
      prompt_type: 'structured_json_analysis',
      description: 'Analysis prompts that return JSON with visual characteristics for each sport and view combination',
      usage: 'POST with {"sport": "soccer|basketball|nfl", "view": "front|back"}',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [ANALYSIS PROMPT API] GET Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve analysis prompt options'
    }, { status: 500 })
  }
} 