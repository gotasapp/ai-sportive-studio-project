#!/usr/bin/env python3
"""
Prompts Técnicos - Baseado em DALL-E 3 para Stable Diffusion
"""

import json
from pathlib import Path

def create_technical_prompts():
    """Cria prompts técnicos super específicos"""
    print("🔧 Criando Prompts Técnicos - Zero Ambiguidade")
    print("=" * 50)
    
    # Prompts técnicos que FORÇAM o formato exato
    technical_prompts = {
        "Palmeiras": """
        flat lay photography of official Palmeiras home jersey 2024, 
        Adidas sublimated polyester fabric, vibrant green base color with white trim details,
        large white number '10' heat-pressed on center back, 
        white player name 'ARIEL' heat-pressed above number,
        Crefisa sponsor logo heat-sealed on chest,
        jersey laid completely flat on pure white background,
        no body, no mannequin, no person wearing it,
        professional product photography, Canon EOS R5, 85mm lens,
        studio lighting, zero shadows, 8K resolution,
        fabric texture visible, stitching details sharp,
        official CBF badge, Adidas three stripes logo
        """.strip().replace('\n', ' '),
        
        "Vasco da Gama": """
        flat lay photography of official Vasco da Gama home jersey 2024,
        sublimated polyester fabric, black base color with white diagonal sash,
        diagonal stripe running from top right shoulder to bottom left,
        large white number '8' heat-pressed on center back,
        white player name 'JEFF' heat-pressed above number,
        jersey laid completely flat on pure white background,
        no body, no mannequin, no person wearing it,
        professional product photography, Canon EOS R5, 85mm lens,
        studio lighting, zero shadows, 8K resolution,
        fabric texture visible, stitching details sharp,
        official CBF badge visible
        """.strip().replace('\n', ' '),
        
        "Flamengo": """
        flat lay photography of official Flamengo home jersey 2024,
        sublimated polyester fabric, red and black horizontal stripes pattern,
        alternating red and black bands across entire jersey,
        large white number '9' heat-pressed on center back,
        jersey laid completely flat on pure white background,
        no body, no mannequin, no person wearing it,
        professional product photography, Canon EOS R5, 85mm lens,
        studio lighting, zero shadows, 8K resolution,
        fabric texture visible, stitching details sharp,
        official CBF badge, Adidas three stripes logo
        """.strip().replace('\n', ' ')
    }
    
    # Negative prompts para FORÇAR o que NÃO queremos
    negative_prompt = """
    person, human, body, mannequin, model, torso, arms, shoulders,
    side view, front view, angled view, perspective distortion,
    wrinkled fabric, folded jersey, hanging jersey,
    shadows, dark background, colored background,
    blurry, low quality, distorted proportions,
    cartoon, illustration, drawing, sketch
    """
    
    # Carrega metadados atuais
    metadata_path = Path("dataset_clean/metadata_clean.json")
    
    if not metadata_path.exists():
        print("❌ Dataset limpo não encontrado!")
        return
    
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    # Atualiza com prompts técnicos
    for item in metadata:
        team_name = item['team_name']
        
        if team_name in technical_prompts:
            item['technical_prompt'] = technical_prompts[team_name]
            item['negative_prompt'] = negative_prompt
            item['prompt_type'] = "technical_flat_lay"
            item['camera_settings'] = "Canon EOS R5, 85mm, studio lighting"
            
            print(f"✅ {team_name}: Prompt técnico criado")
    
    # Salva metadados atualizados
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎯 Prompts técnicos salvos!")
    print(f"📄 Arquivo: {metadata_path}")
    
    # Mostra exemplo
    print(f"\n📝 Exemplo de prompt técnico:")
    print(f"Positivo: {technical_prompts['Vasco da Gama'][:100]}...")
    print(f"Negativo: {negative_prompt[:50]}...")

def main():
    """Função principal"""
    create_technical_prompts()

if __name__ == "__main__":
    main() 