import { NextRequest, NextResponse } from 'next/server'

// ===== ENHANCED BASE PROMPTS COM FIDELIDADE VISUAL =====
const ENHANCED_BASE_PROMPTS = {
  "soccer": {
    "front": {
      "base": `Create a professional soccer jersey front view with the following specifications:

JERSEY REQUIREMENTS:
- Sport: Soccer/Football jersey
- View: Front view only, centered composition
- Player: {{playerName}} #{{{playerNumber}}}
- Style: {{style}} design aesthetic
- Quality: {{qualityLevel}} professional grade

VISUAL COMPOSITION:
- Single jersey only, no shorts, no pants, no additional clothing
- Jersey positioned flat and centered in frame
- Professional product photography style
- Clean background (white or transparent)
- Perfect front-facing orientation

DESIGN ELEMENTS:
- Team badge/crest prominently displayed on left chest
- Sponsor logo positioning as appropriate
- Collar and neckline in harmonious style
- Sleeve design consistent with overall aesthetic
- Proper proportions and professional cut

COLOR AND PATTERN FIDELITY:
- Maintain exact color schemes when specified
- Preserve pattern integrity (stripes, gradients, etc.)
- Consistent color application across all elements
- Professional color balance and harmony

TECHNICAL SPECIFICATIONS:
- High-resolution quality
- Professional lighting and shadows
- Realistic fabric texture and material representation
- Proper jersey proportions and fit`,

      "quality_enhancers": {
        "basic": "Clean design, good proportions",
        "advanced": "Professional photography quality, studio lighting, premium fabric textures, exact color matching, commercial product presentation",
        "premium": "Ultra-high quality, magazine-ready photography, perfect lighting, luxurious fabric details, brand-accurate colors, championship-grade presentation"
      }
    },

    "back": {
      "base": `Create a professional soccer jersey back view with the following specifications:

JERSEY REQUIREMENTS:
- Sport: Soccer/Football jersey
- View: Back view only, centered composition
- Player: {{playerName}} #{{{playerNumber}}}
- Style: {{style}} design aesthetic
- Quality: {{qualityLevel}} professional grade

VISUAL COMPOSITION:
- Single jersey only, no shorts, no pants, no additional clothing
- Jersey positioned flat and centered in frame
- Professional product photography style
- Clean background (white or transparent)
- Perfect back-facing orientation

PLAYER IDENTIFICATION:
- Player name "{{playerName}}" positioned at top-back area
- Player number "{{playerNumber}}" prominently displayed center-back
- Font style appropriate to team and league standards
- Name and number colors contrasting with jersey base
- Professional typography and spacing

COLOR AND PATTERN FIDELITY:
- Maintain exact color schemes when specified
- Preserve pattern integrity from front to back
- Consistent color application across all elements
- Professional color balance and harmony

TECHNICAL SPECIFICATIONS:
- High-resolution quality
- Professional lighting and shadows
- Realistic fabric texture and material representation
- Proper jersey proportions and fit`,

      "quality_enhancers": {
        "basic": "Clear name and number, good proportions",
        "advanced": "Professional photography quality, studio lighting, premium fabric textures, perfect name/number positioning, exact color matching",
        "premium": "Ultra-high quality, magazine-ready photography, perfect lighting, luxurious fabric details, championship-grade typography, brand-accurate presentation"
      }
    }
  },
  
  "basketball": {
    "front": {
      "base": `Create a professional basketball jersey front view with the following specifications:

JERSEY REQUIREMENTS:
- Sport: Basketball jersey
- View: Front view only, centered composition
- Player: {{playerName}} #{{{playerNumber}}}
- Style: {{style}} design aesthetic
- Quality: {{qualityLevel}} professional grade

VISUAL COMPOSITION:
- Single basketball jersey only, no shorts, no additional clothing
- Tank top style with armholes, no sleeves
- Jersey positioned flat and centered in frame
- Professional product photography style
- Clean background (white or transparent)

DESIGN ELEMENTS:
- Team name or logo prominently displayed on chest
- Front number if applicable to design
- Proper basketball jersey proportions
- Armhole design appropriate to style
- Neckline cut suitable for basketball

TECHNICAL SPECIFICATIONS:
- Basketball-specific fabric appearance (mesh or smooth)
- Professional lighting and presentation
- Accurate basketball jersey proportions
- High-resolution quality`,

      "quality_enhancers": {
        "basic": "Clean basketball design, proper armholes",
        "advanced": "Professional NBA/college quality, studio lighting, authentic basketball fabric textures, perfect team branding",
        "premium": "Championship-grade presentation, ultra-high quality, professional sports photography, premium basketball materials"
      }
    },

    "back": {
      "base": `Create a professional basketball jersey back view with the following specifications:

JERSEY REQUIREMENTS:
- Sport: Basketball jersey
- View: Back view only, centered composition
- Player: {{playerName}} #{{{playerNumber}}}
- Style: {{style}} design aesthetic
- Quality: {{qualityLevel}} professional grade

VISUAL COMPOSITION:
- Single basketball jersey only, no shorts, no additional clothing
- Tank top style with armholes, no sleeves
- Jersey positioned flat and centered in frame
- Professional product photography style

PLAYER IDENTIFICATION:
- Player name "{{playerName}}" positioned above number
- Player number "{{playerNumber}}" prominently displayed center-back
- Basketball-style typography and proportions
- Name curved above number (if applicable to style)
- Professional basketball font standards

TECHNICAL SPECIFICATIONS:
- Basketball-specific fabric and cut
- Proper armhole continuation from front
- Professional basketball jersey proportions
- High-resolution quality`,

      "quality_enhancers": {
        "basic": "Clear name and number, basketball proportions",
        "advanced": "Professional NBA quality, studio lighting, authentic basketball typography, perfect player identification layout",
        "premium": "Championship-grade presentation, ultra-high quality, professional sports photography, premium basketball aesthetics"
      }
    }
  },
  
  "nfl": {
    "front": {
      "base": `Create a professional NFL football jersey front view with the following specifications:

JERSEY REQUIREMENTS:
- Sport: American Football (NFL) jersey
- View: Front view only, centered composition
- Player: {{playerName}} #{{{playerNumber}}}
- Style: {{style}} design aesthetic
- Quality: {{qualityLevel}} professional grade

VISUAL COMPOSITION:
- Single NFL jersey only, no pants, no additional clothing
- Professional football jersey cut and proportions
- Jersey positioned flat and centered in frame
- Professional product photography style

DESIGN ELEMENTS:
- Team logo prominently displayed on chest or shoulder
- NFL-style collar and neckline
- Shoulder area design appropriate to team
- Front number placement if applicable
- Professional football proportions and cut

TECHNICAL SPECIFICATIONS:
- NFL-quality fabric appearance (durable, professional)
- Proper football jersey proportions (broader shoulders)
- Professional lighting and presentation
- High-resolution quality`,

      "quality_enhancers": {
        "basic": "Clean NFL design, proper proportions",
        "advanced": "Professional NFL quality, studio lighting, authentic football fabric textures, perfect team branding, official NFL standards",
        "premium": "Super Bowl-grade presentation, ultra-high quality, professional sports photography, premium NFL materials, championship aesthetics"
      }
    },

    "back": {
      "base": `Create a professional NFL football jersey back view with the following specifications:

JERSEY REQUIREMENTS:
- Sport: American Football (NFL) jersey
- View: Back view only, centered composition
- Player: {{playerName}} #{{{playerNumber}}}
- Style: {{style}} design aesthetic
- Quality: {{qualityLevel}} professional grade

VISUAL COMPOSITION:
- Single NFL jersey only, no pants, no additional clothing
- Professional football jersey cut and proportions
- Jersey positioned flat and centered in frame

PLAYER IDENTIFICATION:
- Player name "{{playerName}}" positioned top-back, centered
- Player number "{{playerNumber}}" prominently displayed center-back
- NFL-style typography and proportions
- Name curved or straight per team style
- Professional NFL font standards

TECHNICAL SPECIFICATIONS:
- NFL-quality fabric and construction appearance
- Proper football jersey back proportions
- Professional shoulder area continuation
- High-resolution quality`,

      "quality_enhancers": {
        "basic": "Clear name and number, NFL proportions",
        "advanced": "Professional NFL quality, studio lighting, authentic NFL typography, perfect player identification, official standards",
        "premium": "Super Bowl-grade presentation, ultra-high quality, professional sports photography, premium NFL aesthetics, championship typography"
      }
    }
  }
}

// ===== ENHANCED NEGATIVE PROMPTS - CRITICAL CONSTRAINTS =====
const ENHANCED_NEGATIVE_PROMPTS = {
  "global": `CRITICAL EXCLUSIONS - NEVER INCLUDE:
  
CLOTHING RESTRICTIONS:
- No shorts, pants, or lower body clothing of any kind
- No shoes, socks, or footwear
- No additional clothing items beyond the jersey
- No multiple jerseys in same image
- No layered clothing or outerwear

HUMAN ELEMENTS:
- No people wearing the jersey
- No human models, mannequins, or body parts
- No arms, hands, torso, or any body parts
- No human figures in background

LAYOUT AND COMPOSITION:
- No multiple jerseys side by side
- No jersey sets or collections
- No hangers or clothing displays
- No retail store settings
- No changing room environments

VISUAL DISTRACTIONS:
- No text overlays or watermarks
- No logos unrelated to the team
- No background objects or furniture
- No shadows of people or objects
- No reflections of unwanted elements

QUALITY ISSUES:
- No blurry, pixelated, or low-quality rendering
- No distorted proportions or unrealistic shapes
- No amateur or sketch-like appearance
- No cartoonish or non-photorealistic styles
- No artifacts or rendering errors

SPORTS ACCURACY:
- No mixing sports elements (soccer with basketball, etc.)
- No incorrect sport-specific details
- No wrong jersey cuts for the specified sport
- No inappropriate materials or fabrics for the sport`,

  "soccer": `SOCCER-SPECIFIC EXCLUSIONS:
- No soccer shorts or pants
- No soccer socks or shin guards
- No soccer balls in frame
- No field or grass backgrounds
- No goal posts or field equipment
- No referee jerseys or non-team jerseys`,

  "basketball": `BASKETBALL-SPECIFIC EXCLUSIONS:
- No basketball shorts or pants  
- No basketball shoes or high-tops
- No basketballs in frame
- No court or gym backgrounds
- No basketball hoops or equipment
- No sleeves (maintain tank top style)`,

  "nfl": `NFL-SPECIFIC EXCLUSIONS:
- No football pants or gear
- No helmets or protective equipment
- No footballs in frame
- No field or stadium backgrounds
- No football equipment or pads visible
- No referee jerseys or non-team jerseys`
}

// ===== ENHANCED COLOR PRESERVATION SYSTEM =====
const COLOR_PRESERVATION_PROMPTS = {
  "high_fidelity": `COLOR FIDELITY REQUIREMENTS:
- Maintain EXACT colors from reference or specification
- Preserve color intensity and saturation levels
- Ensure color consistency across all jersey elements
- Match brand-specific color requirements precisely
- Avoid color shifting or tone alterations
- Professional color accuracy standards`,
  
  "pattern_preservation": `PATTERN FIDELITY REQUIREMENTS:
- Preserve exact stripe patterns and widths
- Maintain geometric pattern integrity
- Ensure consistent pattern alignment
- Preserve gradient directions and intensities
- Match pattern colors exactly to specifications
- Professional pattern reproduction standards`
}

export async function POST(request: NextRequest) {
  try {
    const { sport, view, playerName = "PLAYER", playerNumber = "10", style = "classic", qualityLevel = "advanced" } = await request.json()

    // Validate required parameters
    if (!sport || !view) {
      return NextResponse.json({
        success: false,
        error: 'Sport and view parameters are required'
      }, { status: 400 })
    }

    // Get enhanced base prompt
    const sportPrompts = ENHANCED_BASE_PROMPTS[sport as keyof typeof ENHANCED_BASE_PROMPTS]
    if (!sportPrompts) {
      return NextResponse.json({
        success: false,
        error: `Sport '${sport}' not supported. Available: ${Object.keys(ENHANCED_BASE_PROMPTS).join(', ')}`
      }, { status: 400 })
    }

    const viewPrompt = sportPrompts[view as keyof typeof sportPrompts]
    if (!viewPrompt) {
      return NextResponse.json({
        success: false,
        error: `View '${view}' not supported for ${sport}. Available: ${Object.keys(sportPrompts).join(', ')}`
      }, { status: 400 })
    }

    // Build enhanced prompt with all improvements
    let enhancedPrompt = viewPrompt.base

    // Apply variable substitution
    enhancedPrompt = enhancedPrompt
      .replace(/\{\{playerName\}\}/g, playerName)
      .replace(/\{\{playerNumber\}\}/g, playerNumber)
      .replace(/\{\{style\}\}/g, style)
      .replace(/\{\{qualityLevel\}\}/g, qualityLevel)

    // Add quality enhancers
    const qualityEnhancer = viewPrompt.quality_enhancers[qualityLevel as keyof typeof viewPrompt.quality_enhancers] || viewPrompt.quality_enhancers.advanced
    enhancedPrompt += `\n\nQUALITY ENHANCEMENT: ${qualityEnhancer}`

    // Add color and pattern preservation
    enhancedPrompt += `\n\n${COLOR_PRESERVATION_PROMPTS.high_fidelity}`
    enhancedPrompt += `\n\n${COLOR_PRESERVATION_PROMPTS.pattern_preservation}`

    // Add comprehensive negative prompts
    enhancedPrompt += `\n\n${ENHANCED_NEGATIVE_PROMPTS.global}`
    
    // Add sport-specific negative prompts
    const sportNegatives = ENHANCED_NEGATIVE_PROMPTS[sport as keyof typeof ENHANCED_NEGATIVE_PROMPTS]
    if (sportNegatives) {
      enhancedPrompt += `\n\n${sportNegatives}`
    }

    console.log('✅ [ENHANCED BASE PROMPTS] Generated enhanced prompt:', {
        sport,
        view,
      playerName,
      playerNumber,
      style,
      qualityLevel,
      promptLength: enhancedPrompt.length,
      hasQualityEnhancers: true,
      hasColorPreservation: true,
      hasNegativePrompts: true,
      enhancementLevel: 'MAXIMUM_FIDELITY'
      })

      return NextResponse.json({
        success: true,
      prompt: enhancedPrompt.trim(),
        metadata: {
          sport,
          view,
        playerName,
        playerNumber,
        style,
        qualityLevel,
        enhancement_level: 'MAXIMUM_FIDELITY',
        features_enabled: [
          'color_preservation',
          'pattern_fidelity', 
          'negative_prompts',
          'quality_enhancers',
          'sports_accuracy',
          'visual_constraints'
        ],
        prompt_length: enhancedPrompt.length
      }
    })

  } catch (error: any) {
    console.error('❌ [ENHANCED BASE PROMPTS] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate enhanced base prompt'
    }, { status: 500 })
  }
}

export async function GET() {
    return NextResponse.json({
    message: 'Enhanced Vision Base Prompts API',
    version: '2.0-ENHANCED',
    enhancement_level: 'MAXIMUM_FIDELITY',
    supported_sports: Object.keys(ENHANCED_BASE_PROMPTS),
    supported_views: {
      soccer: ['front', 'back'],
      basketball: ['front', 'back'], 
      nfl: ['front', 'back']
    },
    features: [
      'enhanced_base_prompts',
      'comprehensive_negative_prompts',
      'color_preservation_system',
      'pattern_fidelity_control',
      'quality_enhancers',
      'sports_accuracy_constraints',
      'visual_composition_control'
    ],
    quality_levels: ['basic', 'advanced', 'premium']
  })
} 