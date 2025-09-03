#!/usr/bin/env python3
"""
Stadium Base Prompts - Premium NFT Quality
Prompts base para geração de estádios com qualidade NFT premium
"""

# Prompts base para geração de estádios NFT - Versão Concisa
# Mantém alta qualidade mas respeita limite de 4000 caracteres da OpenAI

# Prompt base conciso para visão externa
STADIUM_NFT_BASE_PROMPT_EXTERNAL = """
Create a premium NFT-quality stadium image featuring: {architectural_analysis}

VISUAL REQUIREMENTS:
- Stunning architectural photography showcasing stadium grandeur
- Professional sports venue composition with perfect lighting
- Ultra-high resolution detail suitable for NFT artwork
- Dramatic perspective highlighting architectural excellence
- Clean composition without text, logos, or distracting elements

TECHNICAL SPECS:
- Hyperrealistic architectural rendering
- Premium NFT artwork quality with exceptional detail
- Professional stadium photography aesthetic
- Perfect lighting and atmospheric conditions
"""

# Prompt base conciso para visão interna  
STADIUM_NFT_BASE_PROMPT_INTERNAL = """
Create a premium NFT-quality stadium interior featuring: {architectural_analysis}

VISUAL REQUIREMENTS:
- Stunning interior view capturing stadium atmosphere
- Professional crowd and field composition
- Ultra-high resolution detail suitable for NFT artwork  
- Dynamic perspective showing crowd energy and architectural beauty
- Clean composition without text, logos, or distracting elements

TECHNICAL SPECS:
- Hyperrealistic interior rendering with crowd atmosphere
- Premium NFT artwork quality with exceptional detail
- Cinematic lighting with perfect contrast
- Stadium atmosphere showcasing passion and energy
"""

# Prompt base padrão
STADIUM_NFT_BASE_PROMPT = STADIUM_NFT_BASE_PROMPT_EXTERNAL

# Variações concisas para diferentes estilos
STADIUM_STYLE_PROMPTS = {
    "realistic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL,
    "realistic_internal": STADIUM_NFT_BASE_PROMPT_INTERNAL,
    "realistic": STADIUM_NFT_BASE_PROMPT_EXTERNAL,
    
    "cinematic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL + "\nCINEMATIC: Wide-angle shot, dramatic depth of field, epic scale, movie-quality lighting.",
    "cinematic_internal": STADIUM_NFT_BASE_PROMPT_INTERNAL + "\nCINEMATIC: Dramatic interior angle, movie-quality crowd scenes, epic stadium atmosphere.",
    "cinematic": STADIUM_NFT_BASE_PROMPT_EXTERNAL + "\nCINEMATIC: Wide-angle shot, dramatic depth of field, epic scale, movie-quality lighting.",
    
    "dramatic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL + "\nDRAMATIC: High contrast lighting, intense floodlights, epic larger-than-life presentation.",
    "dramatic_internal": STADIUM_NFT_BASE_PROMPT_INTERNAL + "\nDRAMATIC: High contrast interior, intense lighting effects, electric crowd atmosphere."
}

# Modificadores conciso
ATMOSPHERE_MODIFIERS = {
    "packed": "Stadium filled with passionate fans, electric atmosphere",
    "half_full": "Stadium moderately filled, balanced crowd energy", 
    "empty": "Empty stadium showcasing pure architectural beauty"
}

TIME_MODIFIERS = {
    "day": "Bright daylight, natural sun illumination, vibrant colors",
    "night": "Stadium floodlights, dramatic night atmosphere, city lights",
    "sunset": "Golden hour lighting, warm sunset colors, romantic atmosphere"
}

WEATHER_MODIFIERS = {
    "clear": "Perfect clear weather, optimal visibility",
    "dramatic": "Dramatic sky, interesting cloud formations, dynamic lighting",
    "cloudy": "Overcast sky, soft diffused lighting, moody atmosphere"
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
    Constrói prompt conciso para geração de estádio NFT (respeitando limite de 4000 chars)
    """
    
    # Selecionar prompt base
    prompt_key = f"{style}_{perspective}"
    if prompt_key not in STADIUM_STYLE_PROMPTS:
        prompt_key = style if style in STADIUM_STYLE_PROMPTS else "realistic"
    
    base_prompt = STADIUM_STYLE_PROMPTS[prompt_key]
    enhanced_prompt = base_prompt.format(architectural_analysis=architectural_analysis)
    
    # Adicionar modificadores de forma concisa
    modifiers = []
    
    if atmosphere in ATMOSPHERE_MODIFIERS:
        modifiers.append(ATMOSPHERE_MODIFIERS[atmosphere])
    
    if time_of_day in TIME_MODIFIERS:
        modifiers.append(TIME_MODIFIERS[time_of_day])
    
    if weather in WEATHER_MODIFIERS:
        modifiers.append(WEATHER_MODIFIERS[weather])
    
    # Adicionar modificadores
    if modifiers:
        enhanced_prompt += f"\n\nSPECIFIC: {', '.join(modifiers)}"
    
    # Adicionar customizações (limitadas)
    if custom_additions:
        # Limitar custom additions para não exceder limite
        custom_limited = custom_additions[:200] if len(custom_additions) > 200 else custom_additions
        enhanced_prompt += f"\nCUSTOM: {custom_limited}"
    
    # Verificar tamanho e truncar se necessário
    if len(enhanced_prompt) > 3800:  # Margem de segurança
        # Truncar mantendo estrutura essencial
        lines = enhanced_prompt.split('\n')
        essential_lines = []
        current_length = 0
        
        for line in lines:
            if current_length + len(line) + 1 <= 3800:
                essential_lines.append(line)
                current_length += len(line) + 1
            else:
                break
        
        enhanced_prompt = '\n'.join(essential_lines)
        enhanced_prompt += "\nPremium NFT quality, architectural excellence."
    
    return enhanced_prompt

# Exemplo de uso
if __name__ == "__main__":
    sample_analysis = "Modern football stadium inspired by Maracanã with curved architecture and red seating"
    
    test_prompt = build_enhanced_stadium_prompt(
        architectural_analysis=sample_analysis,
        style="cinematic",
        perspective="external", 
        atmosphere="packed",
        time_of_day="sunset",
        weather="dramatic",
        custom_additions="Include Brazilian flag colors subtly integrated"
    )
    
    print(test_prompt)
    print(f"\nTamanho do prompt: {len(test_prompt)} caracteres")
    print(f"Dentro do limite: {'✅' if len(test_prompt) <= 4000 else '❌'}") 