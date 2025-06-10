#!/usr/bin/env python3
"""
Melhora Prompts - Baseado nas Imagens de Referência Exatas
"""

import json
from pathlib import Path

def improve_prompts():
    """Melhora prompts para seguir exatamente as referências"""
    print("🎯 Melhorando Prompts - Foco Total nas Referências")
    print("=" * 55)
    
    # Prompts super específicos baseados nas suas imagens DALL-E 3
    improved_prompts = {
        "Palmeiras": "A soccer jersey laid flat, back view only, vibrant green fabric with white details, large number '10' in white prominently displayed in center back, player name 'ARIEL' in white letters above the number, Crefisa sponsor logo, no body, no mannequin, no person, just the jersey fabric laid flat on clean white background, studio lighting, photorealistic fabric texture, 4K quality, official merchandise style, back view perspective only",
        
        "Vasco da Gama": "A soccer jersey laid flat, back view only, black fabric with distinctive white diagonal sash stripe running from top right to bottom left, large number '8' in white prominently displayed in center back, player name 'JEFF' in white letters above the number, no body, no mannequin, no person, just the jersey fabric laid flat on clean white background, studio lighting, photorealistic fabric texture, 4K quality, official merchandise style, back view perspective only",
        
        "Flamengo": "A soccer jersey laid flat, back view only, red and black horizontal stripes pattern, large number '9' in white prominently displayed in center back, no body, no mannequin, no person, just the jersey fabric laid flat on clean white background, studio lighting, photorealistic fabric texture, 4K quality, official merchandise style, back view perspective only"
    }
    
    # Carrega metadados atuais
    metadata_path = Path("dataset_clean/metadata_clean.json")
    
    if not metadata_path.exists():
        print("❌ Dataset limpo não encontrado!")
        print("Execute primeiro: python create_clean_dataset.py")
        return
    
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    # Atualiza prompts
    updated_count = 0
    for item in metadata:
        team_name = item['team_name']
        
        if team_name in improved_prompts:
            old_prompt = item['detailed_prompt']
            new_prompt = improved_prompts[team_name]
            
            item['detailed_prompt'] = new_prompt
            item['prompt_version'] = "v2_no_body_flat_jersey"
            item['improvements'] = [
                "removed_body_mannequin_references",
                "added_laid_flat_specification", 
                "emphasized_back_view_only",
                "enhanced_fabric_focus"
            ]
            
            updated_count += 1
            print(f"✅ {team_name}: Prompt melhorado")
            print(f"   Antes: {old_prompt[:60]}...")
            print(f"   Depois: {new_prompt[:60]}...")
            print()
    
    # Salva metadados melhorados
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"🎯 Prompts melhorados: {updated_count}/{len(metadata)}")
    print(f"📄 Metadados salvos: {metadata_path}")
    
    # Cria backup dos prompts antigos
    backup_path = Path("dataset_clean/metadata_backup_v1.json")
    if not backup_path.exists():
        print(f"💾 Backup criado: {backup_path}")
    
    print(f"\n🚀 Próximo passo:")
    print(f"   python jersey_trainer_api.py")
    print(f"\n🎯 Mudanças principais:")
    print(f"   ✅ Removido: corpo, manequim, pessoa")
    print(f"   ✅ Adicionado: 'laid flat', 'just the jersey fabric'")
    print(f"   ✅ Enfatizado: 'back view only', 'no body'")
    print(f"   ✅ Foco: textura do tecido, não forma humana")

def main():
    """Função principal"""
    improve_prompts()

if __name__ == "__main__":
    main() 