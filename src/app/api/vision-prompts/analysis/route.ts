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

    "back": `You are a professional uniform designer specializing in sportswear. Analyze the image of a soccer jersey from the back. Describe in **precise visual and technical detail** everything that is visible.

Instructions:
- Be highly observant.
- Do not assume or generalize.
- Focus on design-specific details that a production team would need.

Respond in clear **bullet-point text**, structured like this:

1. **Primary and secondary colors**: name and hex if possible
2. **Pattern or fabric texture**: describe any subtle design, weaves, mesh or print pattern visible
3. **Logos and text**:
   - Sponsor text (ex: "Crefisa") → position, color, font type (e.g., custom sans-serif), case, size relative to shirt
   - Any manufacturer logos (e.g. Puma) → position, quantity, size
   - Any symbols above the collar or near shoulders
4. **Collar and sleeve details**:
   - Collar type, color, and trim details
   - Sleeve endings: any contrasting bands or colored cuffs
5. **Stitching and structure**:
   - Any visible seams (e.g. central vertical line down the back)
   - Stitch lines around shoulders or sides
6. **Presence of player name or number**: is there any? If not, state clearly: "No number or name visible"
7. **Back layout**:
   - Empty space for name/number?
   - Design symmetry or asymmetry
8. **Style category**: modern, classic, retro, minimalistic, sponsor-heavy

Avoid unnecessary summaries. Focus on details that matter visually and structurally.`
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

    "back": `You are a professional sports uniform designer specializing in basketball jerseys. Analyze the image of a basketball jersey from the back. Describe in **precise visual and technical detail** everything that is visible.

Instructions:
- Be highly observant.
- Do not assume or generalize.
- Focus on design-specific elements that affect reproduction.

Respond in clear **bullet-point text**, structured like this:

1. **Primary and secondary colors**: name and hex if possible
2. **Visual pattern or texture**: describe any stripes, gradients, mesh zones, or print elements
3. **Name and number**:
   - Player name → placement (curved or straight), font type, color, uppercase/lowercase, size relative to jersey
   - Number → position, size, font style, color, outlines or shadows
4. **Logos and text**:
   - Team or league logos → placement, size, color
   - Manufacturer logo (e.g., Nike) → location and style
   - Sponsor (if visible) → text, position, color
5. **Collar and armhole details**:
   - Collar type (round, V, elastic), color and trim
   - Armhole finish → color contrast or design details
6. **Stitching and jersey cut**:
   - Visible seams, panel lines, or special tailoring
   - Shoulder/side cuts or mesh areas
7. **Style category**: modern, throwback, city edition, minimalistic, vibrant

Be factual and technical. Only describe what is visually present in the image.`
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

    "back": `You are a professional sportswear designer specialized in American football uniforms. Analyze the back view of the jersey image and describe in **precise visual and structural detail** all visible elements.

Instructions:
- Focus on design features used in NFL-style jerseys
- Don't invent or generalize — describe what's observable

Respond in structured **bullet-point form** as follows:

1. **Main and secondary colors**: name + hex if possible
2. **Shoulder and sleeve design**:
   - Stripes, blocks, logos, patch shapes
   - Color contrast between shoulder pad area and sleeves
3. **Player number**:
   - Size, color, font style, placement (high/mid-back)
   - Presence of outlines, shadows, texture inside digits
4. **Player name**:
   - Placement (above number), font style, case, spacing
5. **Team or manufacturer logos**:
   - Nike, NFL shield, team logo → position, style, size
6. **Collar and neckline**:
   - Type (V, elastic, padded), color and trim
7. **Fabric and texture**:
   - Mesh panels, ribbed zones, vent sections, gloss/matte finish
8. **Back layout**:
   - Symmetry, space for customization
   - Visual weight or balance across shoulder pad area
9. **Style category**: classic, aggressive, clean, urban, retro

Focus only on what is visible and relevant to recreate the uniform accurately.`
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
    const analysisPrompt = ENHANCED_ANALYSIS_PROMPTS[sport as keyof typeof ENHANCED_ANALYSIS_PROMPTS]?.[view as keyof typeof ENHANCED_ANALYSIS_PROMPTS['soccer']];
    if (!analysisPrompt) {
      return NextResponse.json({
        success: false,
        error: `No enhanced analysis prompt found for sport: ${sport}, view: ${view}`
      }, { status: 400 });
    }

    // Get enhanced metadata
    const metadata = ENHANCED_FOCUS_METADATA[sport as keyof typeof ENHANCED_FOCUS_METADATA]?.[view as keyof typeof ENHANCED_FOCUS_METADATA['soccer']] || {};

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