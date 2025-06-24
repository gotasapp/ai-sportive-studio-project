import { NextRequest, NextResponse } from 'next/server'

// Vision prompts system (ported from Python)
const VISION_PROMPTS = {
  soccer: {
    back: `A photorealistic back view of a professional soccer jersey on a clean white studio background. The jersey design and color scheme must be derived directly from the uploaded image. Maintain the original stripe, pattern, and texture details as base reference. Centered on the upper back of the jersey, add the player name "{PLAYER_NAME}" in bold uppercase white letters. Below it, add the number "{PLAYER_NUMBER}" in matching white, centered. The style theme is "{STYLE}". Use hyper-realistic lighting, studio photography angle, no human model or mannequin. High-definition 4K result, subtle fabric sheen, premium athletic fit, jersey floating flat in space.`,
    front: `A photorealistic front view of a soccer jersey based entirely on the uploaded image design. Preserve the fabric color, patterns, and stripe layout. Use the uploaded image as the visual base reference. On the front of the jersey, render the badge and logos with enhanced clarity and professional finish. The style theme is "{STYLE}". Apply soft shadows, clean white background, no mannequin or human body. Studio lighting with 4K sharpness, professional merchandise photography quality, premium textile textures.`
  },
  basketball: {
    back: `A hyper-realistic back view of a professional basketball jersey. The design should closely follow the reference uploaded by the user, maintaining the base color, lines, and textures. The name "{PLAYER_NAME}" should appear curved above the number, in white uppercase athletic lettering. Centered below the name, place the number "{PLAYER_NUMBER}" in bold, matching white or contrasting color. The style theme is "{STYLE}". Display the jersey on a clean white studio background, no human model, realistic shadow and lighting, floating flat with 4K clarity.`,
    front: `A realistic front view of a basketball jersey, using the uploaded image as the base reference. Preserve the texture, colors, and design of the image. Show realistic embroidery and stitching on the team name or logo area. The style theme is "{STYLE}". Render the jersey alone, flat in space, no human or mannequin. Studio lighting, professional soft shadows, ultra-detailed fabric, 4K photorealistic rendering, athletic fit.`
  },
  nfl: {
    back: `A photorealistic back view of an American football jersey based entirely on the uploaded reference image. Preserve the original color scheme, striping, stitching, and shoulder pad silhouette. At the top of the back, above the shoulder area, display the player name "{PLAYER_NAME}" in bold white uppercase lettering. Below it, centered, add the number "{PLAYER_NUMBER}" in large, thick white font, in traditional NFL style. The theme is "{STYLE}" (e.g., classic, modern, retro, urban). Render the jersey isolated on a clean white studio background, flat view, no mannequin or human model, with 4K resolution, premium fabric texture, and professional studio lighting.`,
    front: `A hyper-realistic front view of a professional NFL jersey inspired by the uploaded image. Recreate the front design faithfully: shoulder stripe patterns, chest logo or number, neckline style, and fabric details. Use the uploaded image as base visual guidance. The jersey should reflect the style "{STYLE}" chosen by the user. Place the number "{PLAYER_NUMBER}" at the center of the chest, using a bold, thick font in white or the most readable contrast color. Use a clean white background, floating jersey layout (no mannequin), 4K resolution, soft shadows and professional lighting.`
  }
}

const STYLE_THEMES = {
  classic: "classic professional sports design",
  modern: "modern athletic design with clean lines", 
  retro: "vintage retro sports aesthetic",
  urban: "urban street sports style",
  premium: "luxury premium sports merchandise",
  vintage: "classic vintage sports uniform style"
}

function getPrompt(sport: string, view: string, playerName: string = "", playerNumber: string = "", style: string = "classic"): string {
  if (!VISION_PROMPTS[sport as keyof typeof VISION_PROMPTS]) {
    throw new Error(`Sport '${sport}' not supported`)
  }
  
  const sportPrompts = VISION_PROMPTS[sport as keyof typeof VISION_PROMPTS]
  if (!sportPrompts[view as keyof typeof sportPrompts]) {
    throw new Error(`View '${view}' not available for ${sport}`)
  }
  
  const promptTemplate = sportPrompts[view as keyof typeof sportPrompts]
  const styleDescription = STYLE_THEMES[style as keyof typeof STYLE_THEMES] || style
  
  return promptTemplate
    .replace('{PLAYER_NAME}', playerName.toUpperCase())
    .replace('{PLAYER_NUMBER}', playerNumber)
    .replace('{STYLE}', styleDescription)
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const { sport, view, playerName, playerNumber, style } = await request.json()
    
    const prompt = getPrompt(sport, view, playerName, playerNumber, style)
    
    return NextResponse.json({
      success: true,
      prompt: prompt,
      metadata: {
        sport,
        view,
        style,
        hasPlayerData: !!(playerName && playerNumber)
      }
    })
    
  } catch (error: any) {
    console.error('❌ Vision prompt error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate prompt' 
      },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    availableSports: Object.keys(VISION_PROMPTS),
    availableViews: {
      soccer: ['front', 'back'],
      basketball: ['front', 'back'],
      nfl: ['front', 'back']
    },
    availableStyles: Object.keys(STYLE_THEMES)
  })
} 