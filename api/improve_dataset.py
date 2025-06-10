#!/usr/bin/env python3
"""
Melhoria do Dataset para Jerseys de Alta Qualidade
Adiciona imagens de referência e cria prompts mais detalhados
"""

import os
import json
import shutil
from pathlib import Path
from PIL import Image
import requests

def create_improved_dataset():
    """Cria dataset melhorado com foco em qualidade"""
    
    # Cria estrutura melhorada
    base_dir = Path("dataset_improved")
    jerseys_dir = base_dir / "jerseys"
    
    for subdir in ["home", "away", "third", "reference"]:
        (jerseys_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    print("📁 Estrutura de dataset melhorada criada")
    
    # Copia dataset existente
    if Path("dataset_v2").exists():
        print("📋 Copiando dataset existente...")
        for jersey_type in ["home", "away"]:
            src_dir = Path("dataset_v2/jerseys") / jersey_type
            dst_dir = jerseys_dir / jersey_type
            
            if src_dir.exists():
                for img_file in src_dir.glob("*.jpg"):
                    shutil.copy2(img_file, dst_dir)
                    print(f"✅ Copiado: {img_file.name}")
    
    return base_dir

def create_detailed_metadata():
    """Cria metadata com prompts mais detalhados"""
    
    # Prompts melhorados baseados nas suas imagens (foco na parte traseira)
    improved_jerseys = [
        {
            "filename": "Palmeiras_back.png",
            "type": "reference",
            "team_name": "Palmeiras",
            "jersey_type": "home",
            "colors": {"primary": "green", "secondary": "white"},
            "detailed_prompt": "A hyper-realistic green soccer jersey, back view, with white collar and cuffs, Crefisa sponsor logo, player name ARIEL and number 10 in yellow, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
            "style_elements": ["back_view", "sponsor_logos", "player_name", "player_number", "white_collar", "white_cuffs", "hyper_realistic"],
            "quality_level": "high"
        },
        {
            "filename": "Vasco_back.png", 
            "type": "reference",
            "team_name": "Vasco",
            "jersey_type": "away",
            "colors": {"primary": "black", "secondary": "white"},
            "detailed_prompt": "A hyper-realistic black jersey with white diagonal sash soccer jersey, back view, with diagonal sash design, player name JEFF and number 8 in red with gold outline, small cross symbol, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
            "style_elements": ["back_view", "diagonal_stripe", "player_name", "player_number", "cross_symbol", "red_numbers", "hyper_realistic"],
            "quality_level": "high"
        },
        {
            "filename": "Flamengo_back.jpeg",
            "type": "reference", 
            "team_name": "Flamengo",
            "jersey_type": "home",
            "colors": {"primary": "red", "secondary": "black"},
            "detailed_prompt": "A hyper-realistic red and black soccer jersey, back view, with red and black stripes, player name and number, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
            "style_elements": ["back_view", "red_black_stripes", "player_name", "player_number", "hyper_realistic"],
            "quality_level": "high"
        },
        # Prompts melhorados para times existentes (foco na parte traseira)
        {
            "filename": "barcelona_improved.jpg",
            "type": "home", 
            "team_name": "Barcelona",
            "jersey_type": "home",
            "colors": {"primary": "blue", "secondary": "red"},
            "detailed_prompt": "A hyper-realistic blue and red striped soccer jersey, back view, vertical stripes, Barcelona FC, player name and number, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
            "style_elements": ["back_view", "vertical_stripes", "player_name", "player_number", "hyper_realistic"],
            "quality_level": "high"
        },
        {
            "filename": "real_madrid_improved.jpg",
            "type": "home",
            "team_name": "Real Madrid", 
            "jersey_type": "home",
            "colors": {"primary": "white", "secondary": "gold"},
            "detailed_prompt": "A hyper-realistic white soccer jersey, back view, with gold accents, Real Madrid CF, player name and number, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
            "style_elements": ["back_view", "solid_white", "gold_accents", "player_name", "player_number", "hyper_realistic"],
            "quality_level": "high"
        },
        {
            "filename": "manchester_united_improved.jpg",
            "type": "home",
            "team_name": "Manchester United",
            "jersey_type": "home", 
            "colors": {"primary": "red", "secondary": "white"},
            "detailed_prompt": "A hyper-realistic red soccer jersey, back view, with white collar, Manchester United, player name and number, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
            "style_elements": ["back_view", "solid_red", "white_collar", "player_name", "player_number", "hyper_realistic"],
            "quality_level": "high"
        },
        {
            "filename": "liverpool_improved.jpg",
            "type": "home",
            "team_name": "Liverpool",
            "jersey_type": "home",
            "colors": {"primary": "red", "secondary": "white"},
            "detailed_prompt": "A hyper-realistic red soccer jersey, back view, with white accents, Liverpool FC, player name and number, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style", 
            "style_elements": ["back_view", "solid_red", "white_accents", "player_name", "player_number", "hyper_realistic"],
            "quality_level": "high"
        }
    ]
    
    # Salva metadata melhorada
    metadata_path = Path("dataset_improved/metadata_improved.json")
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(improved_jerseys, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Metadata melhorada salva: {metadata_path}")
    return improved_jerseys

def create_training_prompts():
    """Cria arquivo com prompts de treinamento otimizados"""
    
    training_prompts = {
        "base_prompt": "A hyper-realistic soccer jersey, back view, premium fabric texture, professional soccer jersey fit, clean dark background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style",
        
        "quality_modifiers": [
            "hyper-realistic", "back view", "premium fabric texture", "professional soccer jersey fit", 
            "studio lighting", "clean dark background", "photorealistic rendering",
            "4K quality", "official soccer merchandise style", "detailed"
        ],
        
        "jersey_elements": [
            "player name", "player number", "sponsor logos", 
            "team crest", "collar design", "sleeve details",
            "fabric patterns", "color gradients", "trim details", "back view"
        ],
        
        "color_combinations": {
            "classic": ["white", "black", "red", "blue", "green"],
            "accents": ["gold", "silver", "yellow", "orange", "purple"],
            "combinations": [
                "blue and red stripes",
                "black with white diagonal",
                "green with white collar",
                "red with gold accents",
                "white with blue trim"
            ]
        },
        
        "negative_prompts": [
            "blurry", "low quality", "distorted", "amateur", 
            "pixelated", "watermark", "text overlay", "logo overlay",
            "multiple jerseys", "person wearing", "mannequin"
        ]
    }
    
    prompts_path = Path("dataset_improved/training_prompts.json")
    with open(prompts_path, 'w', encoding='utf-8') as f:
        json.dump(training_prompts, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Prompts de treinamento salvos: {prompts_path}")
    return training_prompts

def main():
    """Função principal"""
    print("🚀 Melhorando Dataset para Jerseys de Alta Qualidade")
    print("=" * 55)
    
    # Cria dataset melhorado
    base_dir = create_improved_dataset()
    
    # Cria metadata detalhada
    metadata = create_detailed_metadata()
    
    # Cria prompts de treinamento
    prompts = create_training_prompts()
    
    print(f"\n✅ Dataset melhorado criado em: {base_dir}")
    print(f"📊 {len(metadata)} jerseys com prompts detalhados")
    print("\n📋 Próximos passos:")
    print("1. Adicione suas imagens de referência em dataset_improved/jerseys/reference/")
    print("2. Execute: python jersey_trainer_improved.py")
    print("3. Teste com: python test_improved_model.py")

if __name__ == "__main__":
    main() 