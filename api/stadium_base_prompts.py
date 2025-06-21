#!/usr/bin/env python3
"""
Stadium Base Prompts - Premium NFT Quality
Prompts base para geração de estádios com qualidade NFT premium
"""

# Prompt base premium para estádios NFT - VISÃO EXTERNA
STADIUM_NFT_BASE_PROMPT_EXTERNAL = """
Create a stunning, hyperrealistic stadium NFT artwork with premium quality details:

ARCHITECTURAL DESIGN:
- {architectural_analysis}
- Premium materials: brushed steel, reflective glass panels, LED-integrated concrete
- Multiple tiers with luxury VIP sections
- Retractable roof with geometric patterns

VISUAL EXCELLENCE:
- 8K resolution quality rendering
- Dramatic lighting: golden hour sunset with stadium lights beginning to glow
- Cinematic composition with slight aerial perspective
- Perfect symmetry and architectural precision

PREMIUM NFT AESTHETICS:
- Hyperrealistic 3D rendering style
- Rich color palette: deep blues, warm golds, pristine whites
- Atmospheric effects: subtle light rays, realistic shadows
- Crystal-clear details in every surface and texture

EMOTIONAL IMPACT:
- Majestic and awe-inspiring presence
- Sense of scale showing human figures for reference
- Stadium filled with warm, welcoming light
- Surrounding cityscape with modern skyline

TECHNICAL SPECIFICATIONS:
- Professional architectural visualization quality
- NFT-ready composition and framing
- No text, logos, or distracting elements
- Focus on timeless, iconic design that represents excellence

Style: Photorealistic architectural rendering, premium NFT artwork quality, cinematic lighting
"""

# Prompt base premium para estádios NFT - VISÃO INTERNA
STADIUM_NFT_BASE_PROMPT_INTERNAL = """
A high-resolution, ultra-realistic 8K digital rendering of a packed football stadium during a night match. 
The scene is viewed from an elevated angle behind the goal, capturing the interior structure and crowd atmosphere. 
The architecture includes a curved horseshoe or circular seating layout, illuminated with powerful floodlights. 

ARCHITECTURAL INTEGRATION:
- {architectural_analysis}
- Authentic stadium interior structure with premium materials
- Curved seating tiers with luxury VIP sections visible
- Professional floodlighting system creating dramatic illumination

CROWD AND ATMOSPHERE:
- Fans fill the stands, creating a vibrant mosaic of team colors
- Supporters wear matching team colors creating visual unity
- Banners and flags wave above the crowd, adding movement and energy
- Realistic crowd density with authentic fan behavior

FIELD AND DETAILS:
- The field is bright green and perfectly marked
- Players entering or warming up adding life to the scene
- Stadium roof details visible above with structural elements
- Authentic materials (concrete, steel, fabric) with realistic textures

PREMIUM NFT QUALITY:
- Ultra-realistic 8K rendering quality
- Atmospheric lighting highlights the passion and grandeur
- Shadows, color reflections, and cinematic depth of field
- Professional stadium photography aesthetic
- Perfect balance of crowd energy and architectural beauty

TECHNICAL SPECIFICATIONS:
- Hyperrealistic crowd-focused composition
- Premium NFT artwork quality
- Cinematic lighting with dramatic contrast
- Interior perspective showcasing stadium atmosphere
- No distracting text or logos, pure visual impact

Style: Hyperrealistic | Stadium interior | Premium NFT artwork | Cinematic lighting | Crowd-focused
"""

# Prompt base padrão (visão externa para compatibilidade)
STADIUM_NFT_BASE_PROMPT = STADIUM_NFT_BASE_PROMPT_EXTERNAL

# Variações do prompt base para diferentes estilos e perspectivas
STADIUM_STYLE_PROMPTS = {
    "realistic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL,
    "realistic_internal": STADIUM_NFT_BASE_PROMPT_INTERNAL,
    "realistic": STADIUM_NFT_BASE_PROMPT_EXTERNAL,  # Default
    
    "cinematic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL + """

CINEMATIC ENHANCEMENTS:
- Wide-angle cinematic shot with dramatic depth of field
- Epic scale with sweeping camera perspective
- Movie-quality lighting and atmosphere
- Blockbuster film aesthetic
""",
    
    "cinematic_internal": STADIUM_NFT_BASE_PROMPT_INTERNAL + """

CINEMATIC ENHANCEMENTS:
- Dramatic camera angle capturing crowd energy
- Movie-quality crowd scenes with depth of field
- Epic stadium interior with cinematic lighting
- Blockbuster sports film aesthetic
""",
    
    "cinematic": STADIUM_NFT_BASE_PROMPT_EXTERNAL + """

CINEMATIC ENHANCEMENTS:
- Wide-angle cinematic shot with dramatic depth of field
- Epic scale with sweeping camera perspective
- Movie-quality lighting and atmosphere
- Blockbuster film aesthetic
""",
    
    "dramatic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL + """

DRAMATIC ENHANCEMENTS:
- High contrast lighting with deep shadows
- Storm clouds gathering in the background
- Intense stadium floodlights cutting through atmosphere
- Epic, larger-than-life presentation
- Dynamic weather effects
""",
    
    "dramatic_internal": STADIUM_NFT_BASE_PROMPT_INTERNAL + """

DRAMATIC ENHANCEMENTS:
- High contrast interior lighting
- Dramatic crowd silhouettes and shadows
- Intense floodlight beams cutting through stadium
- Electric atmosphere with dynamic lighting effects
- Epic crowd energy and passion
"""
}

# Modificadores de atmosfera
ATMOSPHERE_MODIFIERS = {
    "packed": "Stadium completely filled with passionate fans, electric atmosphere, crowd energy visible",
    "half_full": "Stadium moderately filled, balanced energy, selective crowd sections active",
    "empty": "Empty stadium showcasing pure architectural beauty, pristine and peaceful"
}

# Modificadores de horário
TIME_MODIFIERS = {
    "day": "Bright daylight with natural sun illumination, clear blue skies, vibrant colors",
    "night": "Stadium floodlights in full glory, dramatic night atmosphere, city lights in background",
    "sunset": "Golden hour magic with warm sunset colors, perfect lighting transition, romantic atmosphere"
}

# Modificadores de clima
WEATHER_MODIFIERS = {
    "clear": "Perfect clear weather, optimal visibility, pristine atmospheric conditions",
    "dramatic": "Dramatic sky with interesting cloud formations, dynamic lighting conditions",
    "cloudy": "Overcast sky with soft, diffused lighting, moody atmospheric effects"
}

# Modificadores de perspectiva
PERSPECTIVE_MODIFIERS = {
    "external": "External stadium view showcasing architectural grandeur",
    "internal": "Internal stadium view capturing crowd atmosphere and field action",
    "mixed": "Dynamic perspective showing both architectural beauty and crowd energy"
}

def build_enhanced_stadium_prompt(
    architectural_analysis: str,
    style: str = "realistic",
    perspective: str = "external",
    atmosphere: str = "packed",
    time_of_day: str = "day",
    weather: str = "clear",
    custom_additions: str = ""
) -> str:
    """
    Constrói prompt aprimorado para geração de estádio NFT
    
    Args:
        architectural_analysis: Análise arquitetural do estádio de referência
        style: Estilo de geração (realistic, cinematic, dramatic)
        perspective: Perspectiva (external, internal, mixed)
        atmosphere: Atmosfera do estádio (packed, half_full, empty)
        time_of_day: Horário (day, night, sunset)
        weather: Clima (clear, dramatic, cloudy)
        custom_additions: Adições customizadas ao prompt
    
    Returns:
        Prompt completo para geração
    """
    
    # Selecionar prompt base baseado no estilo e perspectiva
    prompt_key = f"{style}_{perspective}"
    if prompt_key not in STADIUM_STYLE_PROMPTS:
        # Fallback para estilo base se combinação não existir
        prompt_key = style
        if prompt_key not in STADIUM_STYLE_PROMPTS:
            prompt_key = "realistic"
    
    base_prompt = STADIUM_STYLE_PROMPTS[prompt_key]
    enhanced_prompt = base_prompt.format(architectural_analysis=architectural_analysis)
    
    # Adicionar modificadores
    modifiers = []
    
    if perspective in PERSPECTIVE_MODIFIERS:
        modifiers.append(f"PERSPECTIVE: {PERSPECTIVE_MODIFIERS[perspective]}")
    
    if atmosphere in ATMOSPHERE_MODIFIERS:
        modifiers.append(f"ATMOSPHERE: {ATMOSPHERE_MODIFIERS[atmosphere]}")
    
    if time_of_day in TIME_MODIFIERS:
        modifiers.append(f"LIGHTING: {TIME_MODIFIERS[time_of_day]}")
    
    if weather in WEATHER_MODIFIERS:
        modifiers.append(f"WEATHER: {WEATHER_MODIFIERS[weather]}")
    
    # Adicionar modificadores ao prompt
    if modifiers:
        enhanced_prompt += "\n\nSPECIFIC REQUIREMENTS:\n" + "\n".join([f"- {mod}" for mod in modifiers])
    
    # Adicionar customizações
    if custom_additions:
        enhanced_prompt += f"\n\nCUSTOM REQUIREMENTS:\n- {custom_additions}"
    
    # Finalização premium
    enhanced_prompt += "\n\nFINAL QUALITY CHECK: Ensure this stadium represents the pinnacle of architectural excellence and NFT artwork quality."
    
    return enhanced_prompt

# Exemplo de uso
if __name__ == "__main__":
    # Teste do sistema de prompts - Visão Externa
    print("=== TESTE VISÃO EXTERNA ===")
    sample_analysis = "Modern football stadium inspired by Maracanã with iconic curved architecture and distinctive red seating"
    
    external_prompt = build_enhanced_stadium_prompt(
        architectural_analysis=sample_analysis,
        style="cinematic",
        perspective="external",
        atmosphere="packed",
        time_of_day="sunset",
        weather="dramatic",
        custom_additions="Include Brazilian flag colors subtly integrated into the design"
    )
    
    print(external_prompt)
    print(f"\nTamanho do prompt externo: {len(external_prompt)} caracteres")
    
    print("\n" + "="*50)
    
    # Teste do sistema de prompts - Visão Interna
    print("=== TESTE VISÃO INTERNA ===")
    
    internal_prompt = build_enhanced_stadium_prompt(
        architectural_analysis=sample_analysis,
        style="dramatic",
        perspective="internal",
        atmosphere="packed",
        time_of_day="night",
        weather="clear",
        custom_additions="Crowd wearing red and black jerseys, creating team color patterns"
    )
    
    print(internal_prompt)
    print(f"\nTamanho do prompt interno: {len(internal_prompt)} caracteres") 