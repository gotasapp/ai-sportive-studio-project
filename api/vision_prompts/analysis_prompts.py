#!/usr/bin/env python3
"""
Analysis Prompts for Vision Test System
Structured prompts that return JSON analysis for jersey vision analysis
"""

# Vision Analysis Prompts por Esporte
# Prompts específicos para análise detalhada de cada tipo de jersey

PROMPTS = {
    "soccer": {
        "front": """
Analyze this front-view image of a soccer jersey and extract detailed design elements in JSON format:

{
  "dominantColors": ["primary color", "secondary color"],
  "pattern": "describe the pattern or graphic style on the jersey",
  "logoPosition": "where the team or sponsor logo appears",
  "collar": "type and color of collar (e.g., round, v-neck, polo)",
  "sleeves": "sleeve style and color",
  "style": "overall visual style (modern, classic, retro, minimalistic)",
  "texture": "smooth, mesh, shiny, matte, etc.",
  "logos": "describe any visible brand or team logos",
  "view": "front"
}
""",

        "back": """
Analyze this soccer jersey back view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["white", "black"],
  "pattern": "gradient fade from white (top) to black (bottom)",
  "numberStyle": {
    "font": "bold geometric sans-serif",
    "fillPattern": "black with tribal circular patterns",
    "outline": "white border"
  },
  "namePlacement": "centered at top, all uppercase, sans-serif font, black color",
  "collar": "round collar, white",
  "sleeves": "black sleeves with smooth gradient transition",
  "style": "modern minimalistic",
  "texture": "smooth fabric, no mesh or shine",
  "logos": "none",
  "view": "back"
}
"""
    },
    
    "basketball": {
        "back": """
Analyze the uploaded basketball jersey back image and extract in JSON:

{
  "dominantColors": ["main", "secondary"],
  "pattern": "describe design style (solid, striped, etc.)",
  "numberStyle": {
    "font": "type of font used",
    "fillPattern": "solid, gradient, mesh, etc.",
    "outline": "outline color or style"
  },
  "namePlacement": "top center, above number, etc.",
  "collar": "v-neck, round, ribbed, etc.",
  "sleeves": "sleeveless",
  "style": "urban, modern, retro, etc.",
  "texture": "smooth, mesh, fabric",
  "logos": "describe any logos or patches",
  "view": "back"
}
"""
    },

    "football": {
        "back": """
Analyze the uploaded American football jersey image (back view) and extract in JSON:

{
  "dominantColors": ["main", "secondary"],
  "numberStyle": {
    "font": "describe the font",
    "fillPattern": "solid, striped, mesh, etc.",
    "outline": "color or style of the number outline"
  },
  "namePlacement": "top center, above number, etc.",
  "collar": "round, v-neck, etc.",
  "sleeves": "short, long, etc.",
  "style": "classic, aggressive, retro, etc.",
  "texture": "smooth, mesh, shiny, etc.",
  "logos": "describe any logos or patches",
  "view": "back"
}
"""
    }
}

# Helper functions for accessing prompts
def get_analysis_prompt(sport: str, view: str) -> str:
    """
    Get analysis prompt for specific sport and view
    
    Args:
        sport: 'soccer', 'basketball', or 'football'
        view: 'front' or 'back'
        
    Returns:
        Analysis prompt string for the specified sport and view
    """
    if sport not in PROMPTS:
        # Fallback to soccer if sport not found
        sport = 'soccer'
    
    sport_data = PROMPTS[sport]
    
    if view not in sport_data:
        # If specific view doesn't exist, try 'back' as default, then 'front'
        view = 'back' if 'back' in sport_data else 'front' if 'front' in sport_data else list(sport_data.keys())[0]
        
    return sport_data.get(view, sport_data.get('back', "Analyze this sports jersey.")).strip()

def get_available_sports() -> list:
    """Get list of available sports"""
    return list(PROMPTS.keys())

def get_available_views(sport: str) -> list:
    """Get available views for a specific sport"""
    if sport not in PROMPTS:
        return []
    return list(PROMPTS[sport].keys())

def validate_sport_view(sport: str, view: str) -> bool:
    """Validate if sport and view combination exists"""
    return sport in PROMPTS and view in PROMPTS[sport]

# Example usage and testing
if __name__ == "__main__":
    print("=== NEW JSON STRUCTURED PROMPTS ===")
    print("Available sports:", get_available_sports())
    
    for sport in get_available_sports():
        print(f"\n🏆 {sport.upper()}:")
        for view in get_available_views(sport):
            prompt = get_analysis_prompt(sport, view)
            print(f"   📝 {view}: ✅ {len(prompt)} chars")
            
    print("\n=== Soccer Back View Prompt ===")
    print(get_analysis_prompt("soccer", "back"))
    
    print("\n=== Basketball Back View Prompt ===") 
    print(get_analysis_prompt("basketball", "back")) 