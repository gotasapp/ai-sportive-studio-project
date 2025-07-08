import { NextRequest, NextResponse } from 'next/server';

// ===== ENHANCED ANALYSIS PROMPTS - FIDELIDADE VISUAL =====
const ENHANCED_ANALYSIS_PROMPTS = {
  "soccer": {
    "front": `Analyze this soccer jersey front view with EXTREME PRECISION for faithful reproduction. Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact hex color code of main jersey color",
    "secondary": "exact hex color code of secondary color", 
    "accent": "exact hex color code of accent/trim color",
    "colorDescription": "detailed color description (e.g., 'bright golden yellow', 'deep royal blue')"
  },
  "visualPattern": {
    "type": "solid/horizontal_stripes/vertical_stripes/diagonal/geometric/gradient",
    "description": "detailed pattern description",
    "patternColors": ["color1", "color2", "color3"],
    "patternWidth": "stripe width or pattern scale"
  },
  "teamElements": {
    "teamBadge": "detailed badge description, position, colors, shape",
    "sponsor": "sponsor logo description, position, colors",
    "teamName": "any team name visible on front"
  },
  "fabricAndTexture": {
    "material": "fabric type (mesh/synthetic/cotton blend)",
    "finish": "matte/glossy/textured/smooth",
    "quality": "professional/replica/vintage"
  },
  "designElements": {
    "neckline": "crew/v-neck/polo collar with color details",
    "sleeves": "sleeve design, length, trim colors",
  "frontDesign": "unique front design elements",
    "logoPlacement": "exact positioning of all logos/badges"
  },
  "styleCategory": "modern/classic/retro/vintage/urban/premium",
  "keyVisualFeatures": "most distinctive visual elements that make this jersey unique",
  "reproductionNotes": "critical details needed for faithful visual reproduction"
}

CRITICAL: Focus on exact colors, pattern fidelity, logo placement, and distinctive visual elements. This analysis will be used to generate an identical jersey design.`,

    "back": `Analyze this soccer jersey back view with EXTREME PRECISION for faithful reproduction. Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact hex color code of main jersey color",
    "secondary": "exact hex color code of secondary color",
    "accent": "exact hex color code of accent/trim color", 
    "colorDescription": "detailed color description"
  },
  "visualPattern": {
    "type": "solid/horizontal_stripes/vertical_stripes/diagonal/geometric/gradient",
    "description": "detailed pattern description",
    "patternColors": ["color1", "color2", "color3"],
    "patternWidth": "stripe width or pattern scale"
  },
  "playerArea": {
    "namePosition": "exact position of name area (top-center/top-left/top-right)",
    "nameFont": "font style description (bold/regular/italic)",
    "nameColor": "exact color of player name text",
    "numberPosition": "exact position of number (center-back/lower-center)",
    "numberFont": "number font style and size",
    "numberColor": "exact color of player number",
    "nameNumberSpacing": "spacing between name and number areas"
  },
  "fabricAndTexture": {
    "material": "fabric type visible from back",
    "finish": "surface finish description",
    "quality": "professional/replica/vintage"
  },
  "designElements": {
  "backDesign": "unique back design elements",
    "shoulderDetails": "shoulder and sleeve details from back",
    "sponsorBack": "any sponsor elements visible on back",
    "trimDetails": "collar, sleeve, and hem trim details"
  },
  "styleCategory": "modern/classic/retro/vintage/urban/premium",
  "keyVisualFeatures": "most distinctive back view elements",
  "reproductionNotes": "critical details for faithful back view reproduction"
}

CRITICAL: Focus on exact colors, name/number positioning, pattern consistency, and all visual elements needed for identical reproduction.`
  },
  
  "basketball": {
    "front": `Analyze this basketball jersey front view with EXTREME PRECISION. Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact hex color code of main jersey color",
    "secondary": "exact hex color code of secondary color",
    "accent": "exact hex color code of accent/trim color",
    "colorDescription": "detailed color description"
  },
  "visualPattern": {
    "type": "solid/side_panels/geometric/gradient",
    "description": "detailed pattern description",
    "patternColors": ["color1", "color2", "color3"]
  },
  "teamElements": {
    "teamLogo": "detailed logo description, position, colors",
    "teamName": "team name placement and styling",
    "frontNumber": "front number style if visible"
  },
  "fabricAndTexture": {
    "material": "basketball fabric type (mesh/synthetic)",
    "finish": "surface finish",
    "breathability": "mesh areas and ventilation"
  },
  "designElements": {
    "armholes": "armhole design and trim",
    "neckline": "neckline style and trim",
    "sidePanels": "side panel design if present",
    "frontCut": "jersey cut and fit style"
  },
  "styleCategory": "modern/classic/retro/throwback",
  "keyVisualFeatures": "distinctive basketball jersey elements",
  "reproductionNotes": "critical details for faithful reproduction"
}`,

    "back": `Analyze this basketball jersey back view with EXTREME PRECISION. Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact hex color code",
    "secondary": "exact hex color code",
    "accent": "exact hex color code",
    "colorDescription": "detailed color description"
  },
  "visualPattern": {
    "type": "solid/side_panels/geometric",
    "description": "pattern details",
    "patternColors": ["color1", "color2"]
  },
  "playerArea": {
    "namePosition": "name placement on back",
    "nameFont": "font style for name",
    "nameColor": "name text color",
    "numberPosition": "number placement",
    "numberFont": "number font and size",
    "numberColor": "number color",
    "nameNumberLayout": "layout relationship"
  },
  "designElements": {
    "armholes": "armhole design from back",
    "backCut": "jersey back cut style",
    "sidePanels": "side panel continuation",
    "backDesign": "unique back elements"
  },
  "styleCategory": "modern/classic/retro/throwback",
  "keyVisualFeatures": "distinctive back elements",
  "reproductionNotes": "critical reproduction details"
}`
  },
  
  "nfl": {
    "front": `Analyze this NFL jersey front view with EXTREME PRECISION. Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact hex color code",
    "secondary": "exact hex color code", 
    "accent": "exact hex color code",
    "colorDescription": "detailed color description"
  },
  "visualPattern": {
    "type": "solid/shoulder_stripes/side_panels/two_tone",
    "description": "pattern description",
    "patternColors": ["color1", "color2", "color3"]
  },
  "teamElements": {
    "teamLogo": "logo details and position",
    "frontNumber": "front number if visible",
    "teamName": "any team text on front"
  },
  "fabricAndTexture": {
    "material": "NFL fabric type (mesh/stretch)",
    "finish": "surface texture",
    "durability": "fabric weight and quality"
  },
  "designElements": {
    "shoulderPads": "shoulder area design",
    "neckline": "collar style",
    "sleeves": "sleeve design and length",
    "frontCut": "jersey front cut"
  },
  "styleCategory": "modern/classic/throwback",
  "keyVisualFeatures": "distinctive NFL elements", 
  "reproductionNotes": "critical details for reproduction"
}`,

    "back": `Analyze this NFL jersey back view with EXTREME PRECISION. Return ONLY a valid JSON object:

{
  "dominantColors": {
    "primary": "exact hex color code",
    "secondary": "exact hex color code",
    "accent": "exact hex color code",
    "colorDescription": "detailed color description"
  },
  "visualPattern": {
    "type": "solid/shoulder_stripes/side_panels",
    "description": "pattern details",
    "patternColors": ["color1", "color2"]
  },
  "playerArea": {
    "namePosition": "name placement (top-center curved)",
    "nameFont": "NFL name font style",
    "nameColor": "name color",
    "numberPosition": "large center number placement",
    "numberFont": "NFL number font style",
    "numberColor": "number color",
    "nameNumberSpacing": "spacing specification"
  },
  "designElements": {
    "shoulderPads": "shoulder design from back",
    "backCut": "NFL jersey back cut", 
    "sleeves": "sleeve design from back",
    "backDesign": "unique back elements"
  },
  "styleCategory": "modern/classic/throwback",
  "keyVisualFeatures": "distinctive NFL back elements",
  "reproductionNotes": "critical NFL reproduction details"
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