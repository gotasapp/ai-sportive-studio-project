#!/usr/bin/env python3
"""
Badge/Logo Prompt System for Sports Teams
Optimized prompts for generating badges, logos and team emblems
"""

# Base prompts for different badge styles
BADGE_STYLE_PROMPTS = {
    "modern": {
        "base": "Create a modern, minimalist esports team badge with clean geometric shapes, bold typography, and contemporary design elements.",
        "elements": "sleek lines, gradient effects, modern font, digital aesthetic, high contrast colors"
    },
    "retro": {
        "base": "Create a retro-style esports team badge with vintage design elements, classic typography, and nostalgic aesthetics.",
        "elements": "vintage typography, classic shield shapes, retro color palette, aged textures, old-school emblem style"
    },
    "national": {
        "base": "Create a national team-style badge with official emblematic design, heraldic elements, and formal presentation.",
        "elements": "heraldic shield, national symbols, formal crest design, traditional emblem elements, official badge style"
    },
    "urban": {
        "base": "Create an urban-style esports team badge with street art influences, graffiti elements, and modern city aesthetics.",
        "elements": "street art style, urban textures, bold graffiti fonts, metropolitan design, edgy graphics"
    },
    "classic": {
        "base": "Create a classic team badge with timeless design elements, traditional sports aesthetics, and professional presentation.",
        "elements": "traditional shield, classic typography, professional emblem, timeless design, refined aesthetics"
    }
}

# Team-specific prompts
TEAM_BADGE_PROMPTS = {
    "flamengo": {
        "colors": "red and black",
        "identity": "Brazilian football club Flamengo",
        "symbols": "red and black stripes, passionate energy, Brazilian football heritage",
        "style_notes": "Bold and energetic design reflecting the club's passionate fanbase"
    },
    "corinthians": {
        "colors": "white and black",
        "identity": "Brazilian football club Corinthians",
        "symbols": "white and black colors, strength and tradition, São Paulo heritage",
        "style_notes": "Strong and traditional design reflecting the club's history"
    },
    "palmeiras": {
        "colors": "green and white",
        "identity": "Brazilian football club Palmeiras",
        "symbols": "vibrant green, palm tree references, championship tradition",
        "style_notes": "Vibrant and victorious design reflecting success and tradition"
    },
    "santos": {
        "colors": "white and black",
        "identity": "Brazilian football club Santos",
        "symbols": "white and black, coastal heritage, legendary football history",
        "style_notes": "Elegant and legendary design reflecting the club's prestigious history"
    },
    "vasco": {
        "colors": "white and black",
        "identity": "Brazilian football club Vasco da Gama",
        "symbols": "white with black diagonal stripe, maritime heritage, Rio de Janeiro",
        "style_notes": "Maritime-inspired design with the iconic diagonal stripe element"
    }
}

def build_badge_prompt(team_name: str, badge_name: str, badge_number: str, style: str = "modern") -> str:
    """
    Builds optimized prompt for badge/logo generation
    
    Args:
        team_name: Team name
        badge_name: Badge name/text
        badge_number: Badge number
        style: Badge style (modern, retro, national, urban, classic)
    """
    
    team_key = team_name.lower()
    
    # Get team configuration
    team_config = TEAM_BADGE_PROMPTS.get(team_key, {
        "colors": "team colors",
        "identity": f"{team_name} team",
        "symbols": "team symbols and heritage",
        "style_notes": "Professional team design"
    })
    
    # Get style configuration
    style_config = BADGE_STYLE_PROMPTS.get(style, BADGE_STYLE_PROMPTS["modern"])
    
    # Build main prompt
    main_prompt = f"""Create a premium NFT-quality esports team badge for {team_config['identity']}.

BADGE SPECIFICATIONS:
- Team: {team_name}
- Badge Name: {badge_name}
- Badge Number: {badge_number}
- Style: {style.title()}

DESIGN REQUIREMENTS:
{style_config['base']}

VISUAL ELEMENTS:
- Primary colors: {team_config['colors']}
- Design style: {style_config['elements']}
- Team symbols: {team_config['symbols']}
- Badge text: "{badge_name}" prominently displayed
- Number: "{badge_number}" integrated into design

COMPOSITION:
- Centered emblem/badge format
- Clean background (transparent or minimal)
- Professional esports branding quality
- Scalable design suitable for digital use
- High contrast for visibility

TECHNICAL SPECIFICATIONS:
- Ultra-high resolution for NFT artwork
- Professional logo/badge design quality
- Clean vector-style aesthetic
- Perfect symmetry and balance
- Suitable for team merchandise and digital assets

STYLE NOTES:
{team_config['style_notes']}

Create a {style} style badge that represents {team_name} team identity with "{badge_name}" and number "{badge_number}", suitable for professional esports branding and NFT artwork."""

    return main_prompt

def get_available_styles() -> list:
    """Returns list of available badge styles"""
    return list(BADGE_STYLE_PROMPTS.keys())

def get_supported_teams() -> list:
    """Returns list of teams with specific prompts"""
    return list(TEAM_BADGE_PROMPTS.keys())

# Usage example
if __name__ == "__main__":
    # Test prompt system
    test_prompt = build_badge_prompt("Flamengo", "CHAMPION", "1", "modern")
    print("=== BADGE PROMPT TEST ===")
    print(test_prompt)
    print(f"\nAvailable styles: {get_available_styles()}")
    print(f"Supported teams: {get_supported_teams()}") 