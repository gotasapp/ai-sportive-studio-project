#!/usr/bin/env python3
"""
Analysis Prompts for Vision Test System
Structured prompts that return JSON analysis for jersey vision analysis
"""

# Vision Analysis Prompts por Esporte
# Prompts específicos para análise detalhada de cada tipo de jersey

ANALYSIS_PROMPTS = {
    "soccer": {
        "front": """Analyze the uploaded soccer jersey image (front view). Extract the following:

1. Dominant colors and visual pattern (striping, color blocking, gradients)
2. Chest layout: sponsor logos, team crest, central numbers
3. Collar and neckline style
4. Sleeve design (piping, striping, sponsor logos)
5. Fabric texture (e.g., mesh, smooth synthetic, glossy)
6. Fit style (tight athletic, classic loose)
7. Any visual indicators of a particular style (modern, classic, urban, retro)
8. Badge shape or logo placement

Summarize the information in a structured way for use in dynamic image generation.""",
        
        "back": """Analyze the uploaded soccer jersey image (back view). Extract the following visual details:

1. Dominant colors and color pattern (horizontal/vertical stripes, gradients, or solid colors)
2. Fabric texture and sheen (e.g., matte, glossy, mesh)
3. Presence and placement of sponsor logos or emblems
4. Location and style of the name and number area (e.g., centered, top back, bold white)
5. Type of neckline (round, V-neck, collar)
6. Shoulder and sleeve details (stripes, piping, logos)
7. General fit of the jersey (tight athletic cut, loose classic cut)
8. Any stylistic features that suggest a modern, classic, urban, or retro style

Return a structured list of all visual elements, keeping descriptions neutral and objective.""",
        
        "focus_areas": [
            "cores principais e secundárias",
            "gola e mangas", 
            "linhas e padrões",
            "textura do tecido",
            "escudo/logo do time",
            "patrocinadores",
            "detalhes únicos"
        ]
    },
    
    "basketball": {
        "front": """Analyze the uploaded front-view basketball jersey image. Extract the following:

1. Dominant colors and layout
2. Chest design: team name/logo, number style and placement
3. Neckline shape and trim
4. Fabric texture (mesh/smooth), sheen
5. Shoulder and piping design
6. Overall silhouette and cut (tight, relaxed)
7. Design elements that indicate modern, retro, or classic influence
8. Decorative elements (graphic overlays, geometric cuts)

Return a detailed, structured summary for use in jersey recreation prompts.""",
        
        "back": """Analyze the uploaded basketball jersey (back view). Extract:

1. Main colors and their arrangement (e.g., solid base with trims, stripes)
2. Font style and position of player name and number
3. Fabric style (mesh, perforated, smooth)
4. Back design elements: piping, yoke pattern, shoulder detail
5. Neckline (U-shape, V-neck, collar)
6. Armhole cut and sleeve trim
7. Any visible team branding or sponsor logo
8. Overall design style (modern, retro, urban, classic)

Output a structured description of all elements visible in the image.""",
        
        "focus_areas": [
            "cores principais e acentos",
            "bordas e acabamentos",
            "textura do material", 
            "números e tipografia",
            "logos da equipe",
            "padrões gráficos",
            "cortes e formato"
        ]
    },
    
    "nfl": {
        "front": """Analyze the front-facing NFL jersey image provided. Extract and summarize:

1. Main color scheme and layout (solid, striped, two-tone)
2. Chest logo or number location and size
3. Neckline design and collar type
4. Shoulder pad detailing and stripe patterns
5. Sleeve elements (team logo, stripe, blank)
6. Texture and material look (mesh, thick matte fabric)
7. Jersey cut (wide shoulders, short torso)
8. Style influences visible in the design (modern, retro, classic, urban)

Present the findings clearly to guide high-quality jersey image generation.""",
        
        "back": """Analyze the uploaded American football jersey image (back view). Extract:

1. Dominant and secondary colors
2. Player name placement (top-back, centered) and font style
3. Player number position and size
4. Jersey cut and shape (broad shoulders, tapered waist)
5. Presence of shoulder detailing or logos
6. Sleeve cut and stripe design
7. Texture type (matte, mesh, glossy)
8. Style hints: modern, classic, retro, or urban

Summarize the results in a structured format for use in prompt building.""",
        
        "focus_areas": [
            "cores da equipe",
            "números e fontes",
            "textura robusta do tecido",
            "mangas e ombros",
            "logos oficiais",
            "padrões únicos da NFL",
            "detalhes técnicos"
        ]
    }
}

def get_analysis_prompt(sport: str, view: str) -> str:
    """
    Retorna o prompt de análise específico para o esporte e vista escolhidos
    
    Args:
        sport: 'soccer', 'basketball', ou 'nfl'
        view: 'front' ou 'back'
        
    Returns:
        Prompt de análise específico para o esporte e vista
    """
    if sport not in ANALYSIS_PROMPTS:
        # Fallback genérico se esporte não encontrado
        return "Analise esta jersey esportiva: descreva as cores, padrões, textura, logos e detalhes visuais únicos."
    
    sport_data = ANALYSIS_PROMPTS[sport]
    
    if view not in sport_data:
        # Se vista específica não existe, tenta front como padrão
        view = 'front' if 'front' in sport_data else list(sport_data.keys())[0]
        
    return sport_data.get(view, sport_data.get('front', "Analise esta jersey esportiva.")).strip()

def get_focus_areas(sport: str) -> list:
    """
    Retorna as áreas de foco para análise do esporte
    
    Args:
        sport: 'soccer', 'basketball', ou 'nfl'
        
    Returns:
        Lista de áreas que devem ser analisadas
    """
    if sport not in ANALYSIS_PROMPTS:
        return ["cores", "padrões", "textura", "logos"]
    
    return ANALYSIS_PROMPTS[sport]["focus_areas"]

# Função utilitária para validar prompts
def validate_prompts():
    """Valida se todos os prompts foram preenchidos"""
    missing_prompts = []
    
    for sport, data in ANALYSIS_PROMPTS.items():
        if isinstance(data, dict):
            for view in ['front', 'back']:
                if view in data and ("# ADICIONAR" in data[view] or len(data[view].strip()) < 50):
                    missing_prompts.append(f"{sport}-{view}")
    
    if missing_prompts:
        print(f"⚠️  Prompts faltando para: {', '.join(missing_prompts)}")
        return False
    
    print("✅ Todos os prompts de análise foram configurados!")
    return True

def get_all_prompts_info():
    """Retorna informações completas sobre todos os prompts"""
    info = {}
    for sport in ANALYSIS_PROMPTS.keys():
        info[sport] = {
            'front': len(get_analysis_prompt(sport, 'front')),
            'back': len(get_analysis_prompt(sport, 'back')),
            'focus_areas_count': len(get_focus_areas(sport))
        }
    return info

def get_structured_analysis_prompt(sport: str, view: str) -> str:
    """
    Returns a structured prompt for jersey analysis that outputs JSON
    """
    
    base_json_structure = """
    {
        "dominantColors": ["color1", "color2", "color3"],
        "pattern": "description of pattern (stripes, solid, geometric, etc.)",
        "fabric": "fabric type and texture description",
        "style": "classic/modern/retro/vintage/urban/premium",
        "neckline": "collar type and details",
        "fit": "loose/fitted/athletic/oversized",
        "brandElements": "logos, badges, sponsor details",
        "uniqueFeatures": "special design elements"
    }
    """
    
    if sport == "soccer":
        if view == "back":
            return f"""
            Analyze this soccer jersey back view image and return ONLY a valid JSON object with the following structure:
            
            {base_json_structure.replace('brandElements', 'nameArea')}
            
            Add these specific fields for back view:
            - "nameArea": "location and style of player name area"
            - "numberArea": "location, size and style of number area"
            - "backDesign": "unique back design elements"
            
            Focus on: colors, patterns, fabric texture, name/number placement, collar style, and overall design aesthetic.
            Return ONLY valid JSON, no additional text.
            """
        else:
            return f"""
            Analyze this soccer jersey front view image and return ONLY a valid JSON object with the following structure:
            
            {base_json_structure}
            
            Add these specific fields for front view:
            - "teamBadge": "team logo/badge details and placement"
            - "sponsor": "sponsor logo details and placement"
            - "frontDesign": "unique front design elements"
            
            Focus on: colors, patterns, fabric texture, logos, badges, collar style, and overall design aesthetic.
            Return ONLY valid JSON, no additional text.
            """
    
    elif sport == "basketball":
        if view == "back":
            return f"""
            Analyze this basketball jersey back view image and return ONLY a valid JSON object with the following structure:
            
            {base_json_structure.replace('neckline', 'armholes')}
            
            Add these specific fields for back view:
            - "nameArea": "location and style of player name area"
            - "numberArea": "location, size and style of number area"
            - "armholes": "armhole design and trim details"
            - "backDesign": "unique back design elements"
            
            Focus on: colors, patterns, fabric texture, name/number placement, armhole design, and overall basketball aesthetic.
            Return ONLY valid JSON, no additional text.
            """
        else:
            return f"""
            Analyze this basketball jersey front view image and return ONLY a valid JSON object with the following structure:
            
            {base_json_structure.replace('neckline', 'armholes')}
            
            Add these specific fields for front view:
            - "teamLogo": "team logo details and placement"
            - "frontNumber": "front number style if visible"
            - "armholes": "armhole design and trim details"
            - "frontDesign": "unique front design elements"
            
            Focus on: colors, patterns, fabric texture, logos, armhole design, and overall basketball aesthetic.
            Return ONLY valid JSON, no additional text.
            """
    
    elif sport == "nfl":
        if view == "back":
            return f"""
            Analyze this NFL jersey back view image and return ONLY a valid JSON object with the following structure:
            
            {base_json_structure.replace('neckline', 'shoulderPads')}
            
            Add these specific fields for back view:
            - "nameArea": "location and style of player name area"
            - "numberArea": "location, size and style of number area"
            - "shoulderPads": "shoulder design and padding details"
            - "backDesign": "unique back design elements"
            
            Focus on: colors, patterns, fabric texture, name/number placement, shoulder design, and overall football aesthetic.
            Return ONLY valid JSON, no additional text.
            """
        else:
            return f"""
            Analyze this NFL jersey front view image and return ONLY a valid JSON object with the following structure:
            
            {base_json_structure.replace('neckline', 'shoulderPads')}
            
            Add these specific fields for front view:
            - "teamLogo": "team logo details and placement"
            - "frontNumber": "front number style if visible"
            - "shoulderPads": "shoulder design and padding details"
            - "frontDesign": "unique front design elements"
            
            Focus on: colors, patterns, fabric texture, logos, shoulder design, and overall football aesthetic.
            Return ONLY valid JSON, no additional text.
            """
    
    # Fallback prompt
    return f"""
    Analyze this sports jersey image and return ONLY a valid JSON object with the following structure:
    
    {base_json_structure}
    
    Focus on: colors, patterns, fabric texture, design elements, and overall style aesthetic.
    Return ONLY valid JSON, no additional text.
    """

# Example usage and testing
if __name__ == "__main__":
    print("=== Soccer Back View Prompt ===")
    print(get_structured_analysis_prompt("soccer", "back"))
    print("\n=== Basketball Front View Prompt ===")
    print(get_structured_analysis_prompt("basketball", "front"))

    # Test - mostrar status dos prompts
    print("📋 Status dos Prompts de Análise Vision:")
    print("=" * 60)
    
    for sport in ANALYSIS_PROMPTS.keys():
        prompt_front = get_analysis_prompt(sport, 'front')
        prompt_back = get_analysis_prompt(sport, 'back')
        focus = get_focus_areas(sport)
        
        print(f"\n🏆 {sport.upper()}:")
        print(f"   📝 Front: ✅ {len(prompt_front)} chars")
        print(f"   📝 Back:  ✅ {len(prompt_back)} chars")
        print(f"   🎯 Focus areas ({len(focus)}): {', '.join(focus[:3])}...")
    
    print("\n" + "=" * 60)
    validate_prompts()
    
    # Test específico
    print(f"\n🧪 Teste - Soccer Front Prompt:")
    print(f"📏 Tamanho: {len(get_analysis_prompt('soccer', 'front'))} caracteres")
    print(f"🎯 Primeira linha: {get_analysis_prompt('soccer', 'front').split('.')[0]}...") 