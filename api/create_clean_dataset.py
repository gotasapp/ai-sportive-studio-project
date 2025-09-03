#!/usr/bin/env python3
"""
Cria Dataset Limpo - Apenas Imagens de Referência de Alta Qualidade
"""

import json
import os
from pathlib import Path
import shutil

def create_clean_dataset():
    """Cria dataset limpo com apenas imagens de referência"""
    print("🧹 Criando Dataset Limpo - Apenas Referências de Alta Qualidade")
    print("=" * 65)
    
    # Estrutura do dataset limpo
    clean_dir = Path("dataset_clean")
    jerseys_dir = clean_dir / "jerseys" / "reference"
    
    # Cria estrutura
    jerseys_dir.mkdir(parents=True, exist_ok=True)
    
    # Verifica se imagens de referência existem
    reference_dir = Path("dataset_improved/jerseys/reference")
    if not reference_dir.exists():
        print("❌ Pasta de referências não encontrada!")
        print("Certifique-se de ter as imagens em: dataset_improved/jerseys/reference/")
        return
    
    # Lista imagens de referência
    reference_images = list(reference_dir.glob("*.png")) + list(reference_dir.glob("*.jpg")) + list(reference_dir.glob("*.jpeg"))
    
    if not reference_images:
        print("❌ Nenhuma imagem de referência encontrada!")
        return
    
    print(f"📁 Encontradas {len(reference_images)} imagens de referência")
    
    # Metadados limpos com prompts DALL-E 3 style
    clean_metadata = []
    
    # Copia imagens e cria metadados
    for i, img_path in enumerate(reference_images):
        # Copia imagem
        new_filename = f"reference_{i+1}_{img_path.stem}.png"
        dest_path = jerseys_dir / new_filename
        shutil.copy2(img_path, dest_path)
        
        # Detecta time pelo nome do arquivo
        filename_lower = img_path.stem.lower()
        
        if "vasco" in filename_lower:
            team_name = "Vasco da Gama"
            detailed_prompt = "A hyper-realistic Vasco da Gama soccer jersey, back view, black with white diagonal sash design, large number '8' prominently displayed in the center, player name 'JEFF' printed above the number, premium fabric texture, professional soccer jersey fit, clean white background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style"
            colors = ["black", "white"]
            
        elif "palmeiras" in filename_lower:
            team_name = "Palmeiras"
            detailed_prompt = "A hyper-realistic Palmeiras soccer jersey, back view, vibrant green with white details, large number '10' prominently displayed in the center, player name 'ARIEL' printed above the number, Crefisa sponsor logo, premium fabric texture, professional soccer jersey fit, clean white background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style"
            colors = ["green", "white"]
            
        elif "flamengo" in filename_lower:
            team_name = "Flamengo"
            detailed_prompt = "A hyper-realistic Flamengo soccer jersey, back view, red and black horizontal stripes pattern, large number '9' prominently displayed in the center, premium fabric texture, professional soccer jersey fit, clean white background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style"
            colors = ["red", "black"]
            
        else:
            # Genérico para outras imagens
            team_name = f"Team_{i+1}"
            detailed_prompt = f"A hyper-realistic soccer jersey, back view, premium fabric texture, professional soccer jersey fit, clean white background, studio lighting, photorealistic rendering, 4K quality, official soccer merchandise style"
            colors = ["unknown"]
        
        # Metadados
        metadata = {
            "filename": new_filename,
            "team_name": team_name,
            "type": "reference",
            "detailed_prompt": detailed_prompt,
            "colors": colors,
            "quality": "high",
            "source": "user_reference",
            "style": "dalle3_quality"
        }
        
        clean_metadata.append(metadata)
        print(f"✅ {team_name}: {new_filename}")
    
    # Salva metadados limpos
    metadata_path = clean_dir / "metadata_clean.json"
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(clean_metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\n📊 Dataset limpo criado:")
    print(f"   📁 Pasta: {clean_dir}")
    print(f"   🖼️ Imagens: {len(clean_metadata)}")
    print(f"   📄 Metadados: {metadata_path}")
    
    # Cria configuração para trainer limpo
    create_clean_trainer_config(clean_dir, len(clean_metadata))
    
    print(f"\n🎯 Próximo passo:")
    print(f"   python jersey_trainer_clean.py")

def create_clean_trainer_config(dataset_dir, num_images):
    """Cria configuração otimizada para dataset limpo"""
    config = {
        "dataset_info": {
            "total_images": num_images,
            "quality": "high",
            "source": "user_reference_only",
            "style": "dalle3_quality"
        },
        "training_config": {
            "resolution": 512,  # Resolução maior para qualidade
            "batch_size": 1,
            "num_epochs": 15,   # Mais épocas para dataset menor
            "learning_rate": 5e-5,  # Learning rate menor para precisão
            "gradient_accumulation_steps": 8
        },
        "lora_config": {
            "rank": 32,
            "alpha": 64,
            "target_modules": ["to_k", "to_q", "to_v", "to_out.0"],
            "dropout": 0.1
        }
    }
    
    config_path = dataset_dir / "clean_config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    
    print(f"⚙️ Configuração salva: {config_path}")

def main():
    """Função principal"""
    create_clean_dataset()

if __name__ == "__main__":
    main() 