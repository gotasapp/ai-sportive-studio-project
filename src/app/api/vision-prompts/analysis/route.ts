import { NextRequest, NextResponse } from 'next/server';

// ===== ENHANCED ANALYSIS PROMPTS - FIDELIDADE VISUAL =====
const ENHANCED_ANALYSIS_PROMPTS = {
  "soccer": {
    "front": `You are an expert image analyst specializing in soccer jersey color and pattern analysis. Analyze this soccer jersey front view image with EXTREME precision.

CRITICAL INSTRUCTIONS:
1. Extract EXACT colors using descriptive color names AND hex codes if possible
2. Identify ALL patterns, stripes, gradients, or design elements
3. Note logo placements, sponsor locations, and design details
4. Focus on elements needed for FAITHFUL visual reproduction

Return ONLY a valid JSON object with this EXACT structure:

{
  "dominantColors": {
    "primary": "exact primary jersey color (e.g., '#FFFFFF' or 'pure white')",
    "secondary": "exact secondary color (e.g., '#000000' or 'black')", 
    "accent": "exact accent/trim color (e.g., '#FF0000' or 'bright red')",
    "colorDescription": "detailed color analysis (e.g., 'bright golden yellow with deep blue accents')"
  },
  "visualPattern": {
    "type": "solid|horizontal_stripes|vertical_stripes|diagonal_stripes|geometric|gradient|checkered|mixed",
    "description": "detailed pattern description with measurements if visible",
    "patternColors": ["list", "of", "pattern", "colors"],
    "patternWidth": "stripe width or pattern scale description"
  },
  "teamElements": {
    "teamBadge": "detailed badge description: position, shape, colors, size",
    "sponsor": "sponsor logo description: brand, position, colors, style",
    "teamName": "any team text visible on front",
    "additionalLogos": "any other logos or emblems visible"
  },
  "fabricAndTexture": {
    "material": "fabric type visible (mesh, synthetic, cotton, technical)",
    "finish": "surface finish (matte, glossy, textured, smooth)",
    "quality": "professional, replica, vintage, or casual grade"
  },
  "designElements": {
    "neckline": "collar type and colors (crew, v-neck, polo with trim details)",
    "sleeves": "sleeve design, length, cuff colors and style",
    "frontDesign": "unique front design elements and their exact placement",
    "logoPlacement": "precise positioning of all logos and badges"
  },
  "styleCategory": "modern|classic|retro|vintage|urban|premium",
  "keyVisualFeatures": "the 3-5 most distinctive visual elements that make this jersey unique",
  "reproductionNotes": "critical specific details needed for identical visual reproduction"
}

FOCUS AREAS:
- Exact color identification (use color names like 'royal blue', 'forest green', 'golden yellow')
- Pattern details (stripe widths, angles, spacing)
- Logo and badge exact positioning
- Collar and sleeve trim details
- Any unique design elements

Remember: This analysis will be used to generate an IDENTICAL jersey. Be as specific as possible about colors and visual elements.`,

    "back": `You are an expert image analyst specializing in soccer jersey back view analysis. Analyze this soccer jersey back view image with EXTREME precision for faithful reproduction.

CRITICAL INSTRUCTIONS:
1. Extract EXACT colors and their relationships
2. Analyze name/number area positioning and styling
3. Identify all patterns and design elements
4. Note specific details needed for identical reproduction

Return ONLY a valid JSON object with this EXACT structure:

{
  "dominantColors": {
    "primary": "exact primary jersey color with specific name/hex",
    "secondary": "exact secondary color with specific name/hex",
    "accent": "exact accent/trim color with specific name/hex", 
    "colorDescription": "comprehensive color analysis of the jersey"
  },
  "visualPattern": {
    "type": "solid|horizontal_stripes|vertical_stripes|diagonal_stripes|geometric|gradient|mixed",
    "description": "detailed pattern description including measurements",
    "patternColors": ["color1", "color2", "color3"],
    "patternWidth": "specific stripe width or pattern scale"
  },
  "playerArea": {
    "namePosition": "exact name area position (top-center, upper-back, etc.)",
    "nameFont": "font style description (bold, condensed, serif, sans-serif)",
    "nameColor": "exact color of player name text",
    "numberPosition": "exact number position (center-back, below-name, etc.)",
    "numberFont": "number font style, weight, and relative size",
    "numberColor": "exact color of player number",
    "nameNumberSpacing": "spacing between name and number areas",
    "textStyling": "any outlines, shadows, or special text effects"
  },
  "fabricAndTexture": {
    "material": "visible fabric type from back view",
    "finish": "surface finish visible",
    "quality": "professional, replica, vintage assessment"
  },
  "designElements": {
    "backDesign": "unique back design elements beyond name/number",
    "shoulderDetails": "shoulder and upper back design details",
    "sponsorBack": "any sponsor elements visible on back",
    "trimDetails": "collar, sleeve, and hem trim details from back view",
    "stitchingDetails": "visible stitching patterns or seam details"
  },
  "styleCategory": "modern|classic|retro|vintage|urban|premium",
  "keyVisualFeatures": "most distinctive back view elements for reproduction",
  "reproductionNotes": "critical specific details for faithful back view reproduction"
}

FOCUS AREAS:
- Exact color matching for all elements
- Name/number area precise positioning and styling
- Pattern consistency with front (if striped/patterned)
- Trim and accent color details
- Any unique back design elements

This analysis enables IDENTICAL reproduction. Be extremely specific about colors, positioning, and styling details.`
  },
  
  "basketball": {
    "front": `You are an expert image analyst for basketball jerseys. Analyze this basketball jersey front view with EXTREME precision for faithful reproduction.

CRITICAL INSTRUCTIONS:
1. Basketball jerseys have unique cuts, armholes, and proportions
2. Extract EXACT colors and team design elements
3. Identify side panels, mesh areas, and basketball-specific features
4. Focus on elements crucial for authentic reproduction

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "main jersey color (exact name/hex)",
    "secondary": "secondary color (exact name/hex)",
    "accent": "accent/trim color (exact name/hex)",
    "colorDescription": "comprehensive basketball jersey color analysis"
  },
  "visualPattern": {
    "type": "solid|side_panels|geometric|gradient|striped|mixed",
    "description": "basketball-specific pattern details",
    "patternColors": ["pattern", "colors", "list"],
    "sidePanelDetails": "side panel colors and design if present"
  },
  "teamElements": {
    "teamLogo": "team logo details: position, size, colors, style",
    "teamName": "team name placement and styling across front",
    "frontNumber": "front number style, size, and positioning if visible",
    "cityName": "city name if visible on front"
  },
  "fabricAndTexture": {
    "material": "basketball fabric type (mesh, performance, technical)",
    "finish": "surface finish and texture",
    "breathability": "mesh areas and ventilation zones visible"
  },
  "designElements": {
    "armholes": "basketball armhole design and sizing",
    "neckline": "neckline style and trim details",
    "sidePanels": "side panel design, colors, and integration",
    "frontCut": "jersey cut style (loose, fitted, traditional)"
  },
  "styleCategory": "modern|classic|retro|throwback|statement",
  "keyVisualFeatures": "distinctive basketball jersey elements",
  "reproductionNotes": "critical details for authentic basketball jersey reproduction"
}

BASKETBALL SPECIFIC FOCUS:
- Wide armholes and loose fit characteristics
- Side panel color schemes and transitions  
- Mesh material areas and patterns
- Team logo prominence and positioning
- Number placement and sizing standards`,

    "back": `You are an expert basketball jersey analyst. Analyze this basketball jersey back view with EXTREME precision.

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact primary color",
    "secondary": "exact secondary color",
    "accent": "exact accent color",
    "colorDescription": "detailed basketball jersey color analysis"
  },
  "visualPattern": {
    "type": "solid|side_panels|geometric|mixed",
    "description": "back view pattern details",
    "patternColors": ["color1", "color2"],
    "sidePanelContinuation": "how side panels continue on back"
  },
  "playerArea": {
    "namePosition": "name placement on basketball jersey back",
    "nameFont": "basketball name font style",
    "nameColor": "name text exact color",
    "numberPosition": "number placement and sizing",
    "numberFont": "basketball number font and proportions",
    "numberColor": "number exact color",
    "nameNumberLayout": "layout relationship for basketball standard"
  },
  "designElements": {
    "armholes": "armhole design from back view",
    "backCut": "basketball jersey back cut and fit",
    "sidePanels": "side panel design continuation",
    "backDesign": "unique back elements beyond name/number"
  },
  "styleCategory": "modern|classic|retro|throwback|statement",
  "keyVisualFeatures": "distinctive basketball back elements",
  "reproductionNotes": "critical basketball jersey reproduction details"
}`
  },
  
  "nfl": {
    "front": `You are an expert NFL jersey analyst. Analyze this NFL jersey front view with EXTREME precision.

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact NFL team primary color",
    "secondary": "exact secondary color", 
    "accent": "exact accent color",
    "colorDescription": "detailed NFL team color analysis"
  },
  "visualPattern": {
    "type": "solid|shoulder_stripes|side_panels|two_tone|mixed",
    "description": "NFL-specific pattern description",
    "patternColors": ["color1", "color2", "color3"],
    "shoulderDesign": "shoulder stripe or design details"
  },
  "teamElements": {
    "teamLogo": "team logo details and positioning",
    "frontNumber": "front number if visible",
    "teamName": "team text on front",
    "nflBadge": "NFL shield or official badges"
  },
  "fabricAndTexture": {
    "material": "NFL jersey fabric type",
    "finish": "surface texture",
    "durability": "fabric weight and construction quality"
  },
  "designElements": {
    "shoulderPads": "shoulder area design for padding compatibility",
    "neckline": "NFL collar style and construction",
    "sleeves": "sleeve design, length, and team details",
    "frontCut": "NFL jersey front cut and fit"
  },
  "styleCategory": "modern|classic|throwback|alternate",
  "keyVisualFeatures": "distinctive NFL jersey elements", 
  "reproductionNotes": "critical NFL jersey reproduction details"
}`,

    "back": `You are an expert NFL jersey analyst. Analyze this NFL jersey back view with EXTREME precision.

Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact primary color",
    "secondary": "exact secondary color",
    "accent": "exact accent color",
    "colorDescription": "NFL jersey color scheme analysis"
  },
  "visualPattern": {
    "type": "solid|shoulder_stripes|side_panels|mixed",
    "description": "back view pattern details",
    "patternColors": ["color1", "color2", "color3"],
    "shoulderContinuation": "how shoulder design continues on back"
  },
  "playerArea": {
    "namePosition": "NFL name placement standards",
    "nameFont": "NFL name font specifications",
    "nameColor": "name text color",
    "numberPosition": "NFL number placement",
    "numberFont": "NFL number font and proportions",
    "numberColor": "number color",
    "nameNumberSpacing": "NFL standard spacing"
  },
  "designElements": {
    "shoulderPads": "back shoulder design for equipment",
    "backCut": "NFL jersey back construction",
    "shoulderStripes": "shoulder stripe continuation",
    "backDesign": "unique NFL back elements"
  },
  "styleCategory": "modern|classic|throwback|alternate",
  "keyVisualFeatures": "distinctive NFL back elements",
  "reproductionNotes": "critical NFL reproduction specifications"
}`
  }
};

// ===== ENHANCED METADATA FOR FOCUS AREAS =====
const ENHANCED_FOCUS_METADATA = {
  "soccer": {
    "front": {
      "focus_areas": [
        "exact_color_extraction",
        "pattern_fidelity", 
        "team_badge_details",
        "sponsor_positioning",
        "collar_and_trim",
        "fabric_texture",
        "overall_proportions"
      ],
      "critical_elements": [
        "primary_color_dominance",
        "secondary_color_accuracy", 
        "logo_placement_precision",
        "pattern_consistency"
      ]
    },
    "back": {
      "focus_areas": [
        "exact_color_matching",
        "name_number_positioning",
        "pattern_continuation",
        "shoulder_details",
        "trim_consistency",
        "fabric_texture",
        "proportional_layout"
      ],
      "critical_elements": [
        "player_area_layout",
        "color_consistency",
        "pattern_alignment",
        "trim_details"
      ]
    }
  },
  "basketball": {
    "front": {
      "focus_areas": [
        "team_logo_prominence",
        "color_blocking",
        "armhole_design",
        "front_number_style",
        "fabric_breathability",
        "cut_and_fit"
      ],
      "critical_elements": [
        "logo_size_position", 
        "color_balance",
        "armhole_trim",
        "overall_proportions"
      ]
    },
    "back": {
      "focus_areas": [
        "name_number_hierarchy",
        "color_consistency", 
        "armhole_continuation",
        "back_cut_style",
        "fabric_texture",
        "proportional_spacing"
      ],
      "critical_elements": [
        "name_prominence",
        "number_dominance",
        "color_matching",
        "layout_balance"
      ]
    }
  },
  "nfl": {
    "front": {
      "focus_areas": [
        "team_logo_placement",
        "shoulder_design",
        "color_scheme",
        "fabric_durability",
        "front_number_style", 
        "collar_design"
      ],
      "critical_elements": [
        "logo_positioning",
        "shoulder_emphasis",
        "color_authority",
        "proportional_balance"
      ]
    },
    "back": {
      "focus_areas": [
        "name_curvature",
        "number_dominance",
        "shoulder_continuation",
        "color_consistency",
        "fabric_texture",
        "proportional_hierarchy"
      ],
      "critical_elements": [
        "name_arch_style",
        "number_size_prominence",
        "color_fidelity",
        "layout_authority"
      ]
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const { sport, view } = await request.json();

    // Validate inputs
    if (!sport || !view) {
      return NextResponse.json({
        success: false,
        error: 'Sport and view parameters are required'
      }, { status: 400 });
    }

    // Get enhanced analysis prompt
    const analysisPrompt = ENHANCED_ANALYSIS_PROMPTS[sport]?.[view];
    if (!analysisPrompt) {
      return NextResponse.json({
        success: false,
        error: `No enhanced analysis prompt found for sport: ${sport}, view: ${view}`
      }, { status: 400 });
    }

    // Get enhanced metadata
    const metadata = ENHANCED_FOCUS_METADATA[sport]?.[view] || {};

    console.log('✅ [ENHANCED ANALYSIS] Prompt generated:', {
      sport,
      view,
      promptLength: analysisPrompt.length,
      focusAreas: metadata.focus_areas?.length || 0,
      criticalElements: metadata.critical_elements?.length || 0,
      enhancementLevel: 'EXTREME_PRECISION'
    });

    return NextResponse.json({
      success: true,
      analysis_prompt: analysisPrompt,
      metadata: {
        sport,
        view,
        focus_areas: metadata.focus_areas || [],
        critical_elements: metadata.critical_elements || [],
        enhancement_level: 'EXTREME_PRECISION',
        color_fidelity: 'HIGH',
        pattern_accuracy: 'HIGH',
        element_preservation: 'HIGH'
      }
    });

  } catch (error: any) {
    console.error('❌ [ENHANCED ANALYSIS] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate enhanced analysis prompt'
    }, { status: 500 });
  }
}

export async function GET() {
    return NextResponse.json({
    message: 'Enhanced Vision Analysis Prompts API',
    version: '2.0-ENHANCED',
    enhancement_level: 'EXTREME_PRECISION',
    supported_sports: Object.keys(ENHANCED_ANALYSIS_PROMPTS),
    features: [
      'exact_color_extraction',
      'pattern_fidelity_analysis',
      'element_preservation',
      'reproduction_guidance',
      'critical_detail_focus'
    ]
  });
} 