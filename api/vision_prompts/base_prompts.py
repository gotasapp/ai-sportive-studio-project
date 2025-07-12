#!/usr/bin/env python3
"""
Vision Test - Prompts Base para Múltiplos Esportes
Organização de prompts por esporte e perspectiva (frente/costas)
"""

from typing import Optional

# ============================================================================
# SOCCER (FUTEBOL) PROMPTS
# ============================================================================

SOCCER_BACK_PROMPT = """
A photorealistic back view of a professional soccer jersey on a clean white studio background. The jersey design and color scheme must be derived directly from the uploaded image. Maintain the original stripe, pattern, and texture details as base reference. Centered on the upper back of the jersey, add the player name "{PLAYER_NAME}" in bold uppercase white letters. Below it, add the number "{PLAYER_NUMBER}" in matching white, centered. The style theme is "{STYLE}". Use hyper-realistic lighting, studio photography angle, no human model or mannequin. High-definition 4K result, subtle fabric sheen, premium athletic fit, jersey floating flat in space.
"""

SOCCER_FRONT_PROMPT = """
A photorealistic front view of a soccer jersey based entirely on the uploaded image design. Preserve the fabric color, patterns, and stripe layout. Use the uploaded image as the visual base reference. On the front of the jersey, render the badge and logos with enhanced clarity and professional finish. The style theme is "{STYLE}". Apply soft shadows, clean white background, no mannequin or human body. Studio lighting with 4K sharpness, professional merchandise photography quality, premium textile textures.
"""

# ============================================================================
# BASKETBALL (NBA) PROMPTS 
# ============================================================================

BASKETBALL_BACK_PROMPT = """
A hyper-realistic back view of a professional basketball jersey. The design should closely follow the reference uploaded by the user, maintaining the base color, lines, and textures. The name "{PLAYER_NAME}" should appear curved above the number, in white uppercase athletic lettering. Centered below the name, place the number "{PLAYER_NUMBER}" in bold, matching white or contrasting color. The style theme is "{STYLE}". Display the jersey on a clean white studio background, no human model, realistic shadow and lighting, floating flat with 4K clarity.
"""

BASKETBALL_FRONT_PROMPT = """
A realistic front view of a basketball jersey, using the uploaded image as the base reference. Preserve the texture, colors, and design of the image. Show realistic embroidery and stitching on the team name or logo area. The style theme is "{STYLE}". Render the jersey alone, flat in space, no human or mannequin. Studio lighting, professional soft shadows, ultra-detailed fabric, 4K photorealistic rendering, athletic fit.
"""

# ============================================================================
# NFL (AMERICAN FOOTBALL) PROMPTS
# ============================================================================

NFL_BACK_PROMPT = """
A photorealistic back view of an American football jersey based entirely on the uploaded reference image. Preserve the original color scheme, striping, stitching, and shoulder pad silhouette. At the top of the back, above the shoulder area, display the player name "{PLAYER_NAME}" in bold white uppercase lettering. Below it, centered, add the number "{PLAYER_NUMBER}" in large, thick white font, in traditional NFL style. The theme is "{STYLE}" (e.g., classic, modern, retro, urban). Render the jersey isolated on a clean white studio background, flat view, no mannequin or human model, with 4K resolution, premium fabric texture, and professional studio lighting.
"""

NFL_FRONT_PROMPT = """
A hyper-realistic front view of a professional NFL jersey inspired by the uploaded image. Recreate the front design faithfully: shoulder stripe patterns, chest logo or number, neckline style, and fabric details. Use the uploaded image as base visual guidance. The jersey should reflect the style "{STYLE}" chosen by the user. Place the number "{PLAYER_NUMBER}" at the center of the chest, using a bold, thick font in white or the most readable contrast color. Use a clean white background, floating jersey layout (no mannequin), 4K resolution, soft shadows and professional lighting.
"""

# ============================================================================
# PROMPT ORGANIZATION SYSTEM
# ============================================================================

VISION_PROMPTS = {
    "soccer": {
        "back": SOCCER_BACK_PROMPT,
        "front": SOCCER_FRONT_PROMPT
    },
    "basketball": {
        "back": BASKETBALL_BACK_PROMPT,
        "front": BASKETBALL_FRONT_PROMPT
    },
    "nfl": {
        "back": NFL_BACK_PROMPT,
        "front": NFL_FRONT_PROMPT
    }
}

# ============================================================================
# QUALITY ENHANCERS (baseado no nosso código atual)
# ============================================================================

QUALITY_ENHANCERS = {
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

# ============================================================================
# NEGATIVE PROMPTS (baseado no nosso código atual)
# ============================================================================

NEGATIVE_PROMPTS = [
    "blurry", "low quality", "distorted", "amateur", 
    "pixelated", "watermark", "text overlay", "logo overlay",
    "multiple jerseys", "person wearing", "mannequin",
    "human model", "body", "arms", "torso"
]

# ============================================================================
# STYLE THEMES (expandindo do nosso sistema atual)
# ============================================================================

STYLE_THEMES = {
    "classic": "classic professional sports design",
    "modern": "modern athletic design with clean lines", 
    "retro": "vintage retro sports aesthetic",
    "urban": "urban street sports style",
    "premium": "luxury premium sports merchandise",
    "vintage": "classic vintage sports uniform style"
}

# ============================================================================
# NOVA FUNÇÃO DE COMPOSIÇÃO COM ANÁLISE VISION
# ============================================================================

def compose_vision_enhanced_prompt(sport: str, view: str, player_name: str, player_number: str, 
                                 analysis_text: str, style: str = "classic") -> str:
    """
    Gera um prompt DALL-E 3 robusto. Esta é a versão padrão e consistente
    usada em toda a aplicação para garantir a mesma qualidade de renderização.
    """
    style_description = STYLE_THEMES.get(style, "professional sports")

    prompt_final = f"""
Create a photorealistic image of a {sport} jersey, **viewed ONLY from the back**. The final image must clearly show the player's name and number on the back.

**1. VISUAL DESIGN INSTRUCTIONS:**
The jersey's design must be faithfully based on the following description of its visual elements:
---
{analysis_text}
---

**2. CRITICAL CUSTOMIZATION (MANDATORY FOR BACK VIEW):**
You MUST apply the following player details to the **back of the jersey**. This is not optional.
- Player Name: **{player_name.upper()}**
- Player Number: **{player_number}**
- Placement: The name "{player_name.upper()}" must be at the top-back. The number "{player_number}" must be on the center-back, below the name. Use a bold, clear font that contrasts with the jersey's main color for maximum visibility.

**3. RENDERING REQUIREMENTS (NON-NEGOTIABLE):**
- Background: Plain, neutral white studio background.
- Display: The jersey must be shown flat, centered, and completely isolated.
- Prohibited Elements: Absolutely NO human models, NO mannequins, NO body parts (arms, torso), NO brand logos (Nike, Adidas), and NO team emblems.
- Quality: Render in 4K, hyper-realistic quality, with professional studio lighting and attention to fabric texture.

**4. GOLDEN RULE:**
The most important requirement is to show the **back of the jersey** with the name **{player_name.upper()}** and number **{player_number}** clearly visible.
""".strip()
    
    return prompt_final

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_prompt(sport: str, view: str, player_name: str = "", player_number: str = "", style: str = "classic") -> str:
    """
    Retorna o prompt formatado para o esporte e perspectiva especificados
    
    Args:
        sport: "soccer", "basketball", "nfl"
        view: "front", "back"
        player_name: Nome do jogador
        player_number: Número do jogador
        style: Tema de estilo
    
    Returns:
        Prompt formatado pronto para usar
    """
    if sport not in VISION_PROMPTS:
        raise ValueError(f"Sport '{sport}' not supported. Available: {list(VISION_PROMPTS.keys())}")
    
    if view not in VISION_PROMPTS[sport]:
        raise ValueError(f"View '{view}' not available for {sport}. Available: {list(VISION_PROMPTS[sport].keys())}")
    
    prompt_template = VISION_PROMPTS[sport][view]
    style_description = STYLE_THEMES.get(style, style)
    
    return prompt_template.format(
        PLAYER_NAME=player_name.upper(),
        PLAYER_NUMBER=player_number,
        STYLE=style_description
    ).strip()

def get_enhanced_prompt(sport: str, view: str, player_name: str = "", player_number: str = "", 
                       style: str = "classic", quality_level: str = "base") -> str:
    """
    Retorna prompt com melhorias de qualidade aplicadas
    
    Args:
        sport: "soccer", "basketball", "nfl"
        view: "front", "back"  
        player_name: Nome do jogador
        player_number: Número do jogador
        style: Tema de estilo
        quality_level: "base" ou "advanced"
    
    Returns:
        Prompt melhorado com qualidade extra
    """
    base_prompt = get_prompt(sport, view, player_name, player_number, style)
    
    # Adiciona melhorias de qualidade
    quality_additions = QUALITY_ENHANCERS.get(quality_level, QUALITY_ENHANCERS["base"])
    enhanced_prompt = f"{base_prompt}\n\nQUALITY: {', '.join(quality_additions)}"
    
    return enhanced_prompt

def get_available_sports() -> list:
    """Retorna lista de esportes disponíveis"""
    return list(VISION_PROMPTS.keys())

def get_available_views(sport: str) -> list:
    """Retorna lista de perspectivas disponíveis para um esporte"""
    if sport not in VISION_PROMPTS:
        return []
    return list(VISION_PROMPTS[sport].keys())

def get_available_styles() -> list:
    """Retorna lista de estilos disponíveis"""
    return list(STYLE_THEMES.keys())

# ============================================================================
# TESTING FUNCTIONS
# ============================================================================

def test_prompts():
    """Testa todos os prompts para verificar formatação"""
    print("🧪 Testando prompts base...")
    
    for sport in get_available_sports():
        for view in get_available_views(sport):
            try:
                prompt = get_prompt(sport, view, "TESTE", "99", "modern")
                print(f"✅ {sport.upper()} {view}: {len(prompt)} chars")
            except Exception as e:
                print(f"❌ {sport.upper()} {view}: {e}")
    
    print("\n🧪 Testando nova composição vision-enhanced...")
    
    # Teste da nova função de composição
    sample_analysis = """
    • Jersey shows distinctive stripe pattern in blue and white
    • Traditional collar style with ribbed texture
    • Professional fabric quality with subtle sheen
    • Classic soccer jersey proportions and fit
    """
    
    try:
        enhanced_prompt = compose_vision_enhanced_prompt(
            sport="soccer", 
            view="back", 
            player_name="MESSI", 
            player_number="10",
            analysis_text=sample_analysis,
            style="classic"
        )
        print(f"✅ NOVA COMPOSIÇÃO: {len(enhanced_prompt)} chars")
        print(f"📝 Amostra: {enhanced_prompt[:200]}...")
    except Exception as e:
        print(f"❌ NOVA COMPOSIÇÃO: {e}")
    
    print("\n✅ Teste concluído!")

if __name__ == "__main__":
    test_prompts() 