#!/usr/bin/env python3
"""
Script para organizar imagens dos estádios nas pastas corretas
"""

import os
import shutil
from pathlib import Path

def organize_stadium_images():
    """Organiza as imagens dos estádios nas pastas corretas"""
    
    base_path = Path("api/stadium_references")
    
    # Mapeamento de estádios e suas imagens
    stadium_mappings = {
        "allianz_parque_palmeiras": {
            "source_images": [
                "palmeiras_atmosphere.jpg",
                "palmeiras_day_light.png", 
                "palmeiras_night_light.jpg"
            ]
        },
        "maracana": {
            "source_images": [
                "maracana_atmosphere.png",
                "maracana_day_light.png",
                "maracana_night_light.jpg"
            ]
        },
        "allianz_arena_bayern": {
            "source_images": [
                "bayern_atmosphere.jpg",
                "bayern_day_light.jpg",
                "bayern_night_light.png",
                "bayern_night_light2.jpg"
            ]
        },
        "sao_januario_vasco": {
            "source_images": [
                "vasco_night_light.png",
                "vasco_night_light2.png",
                "vasco_atmosphere1.jpg",
                "vasco_atmosphere2.jpg",
                "vasco_atmosphere3.jpg"
            ]
        }
    }
    
    print("🏟️  Organizando imagens dos estádios...")
    
    # Verificar se as pastas existem
    for stadium_name in stadium_mappings.keys():
        stadium_path = base_path / stadium_name
        if not stadium_path.exists():
            stadium_path.mkdir(parents=True, exist_ok=True)
            print(f"📁 Criada pasta: {stadium_path}")
    
    # Listar todas as imagens disponíveis no diretório atual
    current_dir = Path(".")
    available_images = []
    
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
        available_images.extend(current_dir.glob(ext))
    
    print(f"📸 Imagens encontradas no diretório atual: {len(available_images)}")
    for img in available_images:
        print(f"   - {img.name}")
    
    # Organizar imagens para cada estádio
    for stadium_name, config in stadium_mappings.items():
        print(f"\n🏟️  Processando {stadium_name}...")
        stadium_path = base_path / stadium_name
        
        moved_count = 0
        for source_image in config["source_images"]:
            # Procurar a imagem no diretório atual
            source_path = None
            for img in available_images:
                if img.name == source_image:
                    source_path = img
                    break
            
            if source_path and source_path.exists():
                dest_path = stadium_path / source_image
                try:
                    shutil.copy2(source_path, dest_path)
                    print(f"   ✅ {source_image} → {dest_path}")
                    moved_count += 1
                except Exception as e:
                    print(f"   ❌ Erro ao copiar {source_image}: {e}")
            else:
                print(f"   ⚠️  Imagem não encontrada: {source_image}")
        
        print(f"   📊 {moved_count}/{len(config['source_images'])} imagens organizadas")
    
    print("\n" + "="*50)
    print("📊 RESUMO DA ORGANIZAÇÃO:")
    print("="*50)
    
    # Verificar resultado final
    for stadium_name in stadium_mappings.keys():
        stadium_path = base_path / stadium_name
        images_in_folder = list(stadium_path.glob("*"))
        images_count = len([f for f in images_in_folder if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']])
        print(f"🏟️  {stadium_name}: {images_count} imagens")
        
        if images_count > 0:
            for img in images_in_folder:
                if img.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    print(f"   📸 {img.name}")
    
    print("\n🎉 Organização concluída!")
    print("💡 Próximo passo: Execute 'python api/generate_stadium_metadata.py' para gerar os metadados")

if __name__ == "__main__":
    organize_stadium_images() 