import { NextRequest, NextResponse } from 'next/server'

// BASE PROMPTS: Templates para GERAR a nova imagem após análise
// Baseado exatamente no sistema original vision-test
// Estes prompts incluem placeholders e são enviados para DALL-E 3 após combinação com análise

const VISION_BASE_PROMPTS = {
  "soccer": {
    "back": `A photorealistic back view of a professional soccer jersey on a clean white studio background. The jersey design and color scheme must be derived directly from the uploaded image. Maintain the original stripe, pattern, and texture details as base reference. Centered on the upper back of the jersey, add the player name "{PLAYER_NAME}" in bold uppercase white letters. Below it, add the number "{PLAYER_NUMBER}" in matching white, centered. The style theme is "{STYLE}". Use hyper-realistic lighting, studio photography angle, no human model or mannequin. High-definition 4K result, subtle fabric sheen, premium athletic fit, jersey floating flat in space.`,
    
    "front": `A photorealistic front view of a soccer jersey based entirely on the uploaded image design. Preserve the fabric color, patterns, and stripe layout. Use the uploaded image as the visual base reference. On the front of the jersey, render the badge and logos with enhanced clarity and professional finish. The style theme is "{STYLE}". Apply soft shadows, clean white background, no mannequin or human body. Studio lighting with 4K sharpness, professional merchandise photography quality, premium textile textures.`
  },
  
  "basketball": {
    "back": `A hyper-realistic back view of a professional basketball jersey. The design should closely follow the reference uploaded by the user, maintaining the base color, lines, and textures. The name "{PLAYER_NAME}" should appear curved above the number, in white uppercase athletic lettering. Centered below the name, place the number "{PLAYER_NUMBER}" in bold, matching white or contrasting color. The style theme is "{STYLE}". Display the jersey on a clean white studio background, no human model, realistic shadow and lighting, floating flat with 4K clarity.`,
    
    "front": `A realistic front view of a basketball jersey, using the uploaded image as the base reference. Preserve the texture, colors, and design of the image. Show realistic embroidery and stitching on the team name or logo area. The style theme is "{STYLE}". Render the jersey alone, flat in space, no human or mannequin. Studio lighting, professional soft shadows, ultra-detailed fabric, 4K photorealistic rendering, athletic fit.`
  },
  
  "nfl": {
    "back": `A photorealistic back view of an American football jersey based entirely on the uploaded reference image. Preserve the original color scheme, striping, stitching, and shoulder pad silhouette. At the top of the back, above the shoulder area, display the player name "{PLAYER_NAME}" in bold white uppercase lettering. Below it, centered, add the number "{PLAYER_NUMBER}" in large, thick white font, in traditional NFL style. The theme is "{STYLE}" (e.g., classic, modern, retro, urban). Render the jersey isolated on a clean white studio background, flat view, no mannequin or human model, with 4K resolution, premium fabric texture, and professional studio lighting.`,
    
    "front": `A hyper-realistic front view of a professional NFL jersey inspired by the uploaded image. Recreate the front design faithfully: shoulder stripe patterns, chest logo or number, neckline style, and fabric details. Use the uploaded image as base visual guidance. The jersey should reflect the style "{STYLE}" chosen by the user. Place the number "{PLAYER_NUMBER}" at the center of the chest, using a bold, thick font in white or the most readable contrast color. Use a clean white background, floating jersey layout (no mannequin), 4K resolution, soft shadows and professional lighting.`
  },
  
  "stadium": {
    "external": `A stunning photorealistic external view of a sports stadium. The architectural design, color scheme, and structural elements must be heavily inspired by the uploaded reference image. Preserve the architectural style, facade materials, roof design, and overall proportions from the reference. The stadium should feature the generation style of "{STYLE}" with enhanced professional finish. Display the stadium from an elevated perspective showing the complete exterior structure. Include atmospheric lighting that matches the time of day and weather conditions detected in the reference. Use ultra-high definition 4K rendering, professional architectural photography angle, dramatic sky background that complements the stadium's design. Capture the grandeur and scale typical of professional sports venues.`,
    
    "internal": `A breathtaking photorealistic interior view of a sports stadium. Base the design entirely on the uploaded reference image, preserving the seating layout, architectural features, field surface, and interior color scheme. Maintain the crowd density, lighting type, and atmospheric mood from the reference. The interior should reflect the "{STYLE}" theme with enhanced professional quality. Show the stadium interior from an optimal viewing angle that captures the scale and atmosphere. Include detailed seating sections, field/pitch surface, architectural elements like screens or overhangs, and appropriate lighting (natural/artificial/mixed). Render in ultra-high definition 4K with professional sports photography quality, capturing the energy and atmosphere of a world-class sports venue.`
  },
  
  "badge": {
    "logo": `A premium quality badge/logo design inspired directly by the uploaded reference image. Preserve the core design elements, color palette, shape structure, and visual style from the reference while enhancing clarity and professional finish. Incorporate the team name "{TEAM_NAME}" and the text "{BADGE_NAME}" seamlessly into the design. Add the number "{BADGE_NUMBER}" if specified. The design should follow the "{STYLE}" aesthetic theme with enhanced typography and refined graphic elements. Create a clean, scalable logo suitable for digital and print use. Render on a transparent background with crisp vector-quality edges. Use professional graphic design principles: balanced composition, clear hierarchy, and premium visual impact. The result should be publication-ready with sharp details and perfect color harmony.`,
    
    "emblem": `A distinguished heraldic emblem/crest based entirely on the uploaded reference image. Maintain the traditional emblem structure, symbolic elements, color scheme, and decorative details from the reference. Integrate the team name "{TEAM_NAME}" and the badge designation "{BADGE_NAME}" using classic heraldic typography. Include the number "{BADGE_NUMBER}" if provided, positioned according to traditional crest conventions. The design should embody the "{STYLE}" theme while preserving heraldic authenticity. Feature premium craftsmanship with enhanced symbolic elements, refined borders, and professional heraldic design principles. Create a prestigious emblem suitable for official use, with rich details and traditional proportions. Render with vector-quality precision on a transparent background, emphasizing prestige and institutional quality.`
  }
}

// Style themes exatamente como no sistema original
const STYLE_THEMES = {
  "classic": "classic professional sports design",
  "modern": "modern athletic design with clean lines", 
  "retro": "vintage retro sports aesthetic",
  "urban": "urban street sports style",
  "premium": "luxury premium sports merchandise",
  "vintage": "classic vintage sports uniform style",
  // Stadium-specific styles
  "realistic": "hyper-realistic architectural design",
  "cinematic": "cinematic dramatic architectural style",
  "dramatic": "dramatic lighting and atmospheric design",
  // Badge-specific styles
  "minimalist": "clean minimalist design with essential elements",
  "emblem": "traditional heraldic emblem style",
  "crest": "official institutional crest design"
}

// Quality enhancers baseados no sistema original
const QUALITY_ENHANCERS = {
  "base": [
    "premium fabric texture",
    "professional athletic fit", 
    "studio lighting",
    "photorealistic rendering",
    "4K quality",
    "official sports merchandise style"
  ],
  "advanced": [
    "hyper-realistic",
    "ultra-detailed fabric",
    "subtle fabric sheen",
    "professional merchandise photography",
    "studio photography angle",
    "high-definition result"
  ]
}

// Negative prompts baseados no sistema original
const NEGATIVE_PROMPTS = [
  "blurry", "low quality", "distorted", "amateur", 
  "pixelated", "watermark", "text overlay", "logo overlay",
  "multiple jerseys", "person wearing", "mannequin",
  "human model", "body", "arms", "torso"
]

// Função principal para obter prompt formatado (igual ao sistema original)
function getPrompt(sport: string, view: string, playerName: string = "", playerNumber: string = "", style: string = "classic", teamName: string = "", badgeName: string = "", badgeNumber: string = ""): string {
  if (!VISION_BASE_PROMPTS[sport as keyof typeof VISION_BASE_PROMPTS]) {
    throw new Error(`Sport '${sport}' not supported`)
  }
  
  const sportPrompts = VISION_BASE_PROMPTS[sport as keyof typeof VISION_BASE_PROMPTS]
  if (!sportPrompts[view as keyof typeof sportPrompts]) {
    throw new Error(`View '${view}' not available for ${sport}`)
  }
  
  const promptTemplate = sportPrompts[view as keyof typeof sportPrompts]
  const styleDescription = STYLE_THEMES[style as keyof typeof STYLE_THEMES] || style
  
  return promptTemplate
    .replace('{PLAYER_NAME}', playerName.toUpperCase())
    .replace('{PLAYER_NUMBER}', playerNumber)
    .replace('{TEAM_NAME}', teamName.toUpperCase())
    .replace('{BADGE_NAME}', badgeName.toUpperCase())
    .replace('{BADGE_NUMBER}', badgeNumber)
    .replace('{STYLE}', styleDescription)
    .trim()
}

// Função para prompt com melhorias de qualidade (igual ao sistema original)
function getEnhancedPrompt(sport: string, view: string, playerName: string = "", playerNumber: string = "", 
                          style: string = "classic", qualityLevel: string = "base", teamName: string = "", badgeName: string = "", badgeNumber: string = ""): string {
  const basePrompt = getPrompt(sport, view, playerName, playerNumber, style, teamName, badgeName, badgeNumber)
  
  // Adiciona melhorias de qualidade
  const qualityAdditions = QUALITY_ENHANCERS[qualityLevel as keyof typeof QUALITY_ENHANCERS] || QUALITY_ENHANCERS["base"]
  const enhancedPrompt = `${basePrompt}\n\nQUALITY: ${qualityAdditions.join(', ')}`
  
  return enhancedPrompt
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 [BASE PROMPTS API] Received request for base generation prompt')
    
    const { sport, view, playerName, playerNumber, style, qualityLevel, teamName, badgeName, badgeNumber } = await request.json()
    
    console.log('📋 [BASE PROMPTS API] Request details:', {
      sport,
      view,
      style: style || 'classic',
      hasPlayerData: !!(playerName && playerNumber),
      hasBadgeData: !!(teamName && badgeName),
      qualityLevel: qualityLevel || 'base',
      timestamp: new Date().toISOString()
    })

    // Validar parâmetros obrigatórios
    if (!sport || !view) {
      console.log('❌ [BASE PROMPTS API] Missing required parameters')
      return NextResponse.json({
        success: false,
        error: 'Sport and view parameters are required'
      }, { status: 400 })
    }

    // Validar sport/type (includes stadium and badge)
    if (!['soccer', 'basketball', 'nfl', 'stadium', 'badge'].includes(sport)) {
      console.log('❌ [BASE PROMPTS API] Invalid sport/type:', sport)
      return NextResponse.json({
        success: false,
        error: 'Invalid type. Must be: soccer, basketball, nfl, stadium, or badge'
      }, { status: 400 })
    }

    // Validar view (different for stadium and badge)
    let validViews = ['front', 'back'] // default for sports
    if (sport === 'stadium') validViews = ['external', 'internal']
    if (sport === 'badge') validViews = ['logo', 'emblem']
    
    if (!validViews.includes(view)) {
      console.log('❌ [BASE PROMPTS API] Invalid view:', view, 'for type:', sport)
      return NextResponse.json({
        success: false,
        error: `Invalid view. For ${sport} must be: ${validViews.join(' or ')}`
      }, { status: 400 })
    }

    try {
      // Usar a função de enhanced prompt se qualityLevel especificado
      const prompt = qualityLevel 
        ? getEnhancedPrompt(sport, view, playerName || "", playerNumber || "", style || "classic", qualityLevel, teamName || "", badgeName || "", badgeNumber || "")
        : getPrompt(sport, view, playerName || "", playerNumber || "", style || "classic", teamName || "", badgeName || "", badgeNumber || "")
      
      console.log('✅ [BASE PROMPTS API] Successfully generated base prompt:', {
        sport,
        view,
        style: style || 'classic',
        promptLength: prompt.length,
        hasPlayerData: !!(playerName && playerNumber),
        qualityEnhanced: !!qualityLevel,
        preview: prompt.substring(0, 150) + '...'
      })

      return NextResponse.json({
        success: true,
        prompt: prompt,
        metadata: {
          sport,
          view,
          style: style || 'classic',
          style_description: STYLE_THEMES[style as keyof typeof STYLE_THEMES] || style,
          hasPlayerData: !!(playerName && playerNumber),
          prompt_length: prompt.length,
          quality_level: qualityLevel || 'base',
          type: 'base_generation_prompt',
          timestamp: new Date().toISOString()
        }
      })
      
    } catch (promptError: any) {
      console.log('❌ [BASE PROMPTS API] Prompt generation error:', promptError.message)
      return NextResponse.json({
        success: false,
        error: promptError.message
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ [BASE PROMPTS API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate base prompt'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('📋 [BASE PROMPTS API] GET request - returning configuration')
    
    return NextResponse.json({
      success: true,
      available_sports: Object.keys(VISION_BASE_PROMPTS),
      available_views: {
        soccer: Object.keys(VISION_BASE_PROMPTS.soccer),
        basketball: Object.keys(VISION_BASE_PROMPTS.basketball),
        nfl: Object.keys(VISION_BASE_PROMPTS.nfl),
        stadium: Object.keys(VISION_BASE_PROMPTS.stadium)
      },
      available_styles: Object.keys(STYLE_THEMES),
      style_descriptions: STYLE_THEMES,
      quality_levels: Object.keys(QUALITY_ENHANCERS),
      quality_enhancers: QUALITY_ENHANCERS,
      negative_prompts: NEGATIVE_PROMPTS,
      prompt_type: 'base_generation_templates',
      placeholders: ['{PLAYER_NAME}', '{PLAYER_NUMBER}', '{STYLE}'],
      description: 'Base prompts for image generation with placeholders that get replaced with actual values',
      usage: 'POST with {"sport": "soccer|basketball|nfl", "view": "front|back", "playerName": "optional", "playerNumber": "optional", "style": "optional", "qualityLevel": "optional"}',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [BASE PROMPTS API] GET Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve base prompt configuration'
    }, { status: 500 })
  }
} 