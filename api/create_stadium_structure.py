#!/usr/bin/env python3
"""
Create Stadium References Structure
Cria automaticamente a estrutura de pastas para referências de estádios
"""

import os
import json
from pathlib import Path

# Estrutura dos estádios
STADIUMS = {
    "maracana": {
        "name": "Maracanã Stadium",
        "full_name": "Estádio Jornalista Mário Filho",
        "city": "Rio de Janeiro",
        "country": "Brazil",
        "capacity": 78838,
        "teams": ["Flamengo", "Fluminense", "Brazil National Team"],
        "colors": ["red", "black", "white"],
        "architecture_style": "Modern iconic curved concrete",
        "year_built": 1950,
        "renovated": 2013,
        "description": "Legendary Brazilian football stadium with iconic curved architecture"
    },
    
    "camp_nou": {
        "name": "Camp Nou Stadium", 
        "full_name": "Camp Nou",
        "city": "Barcelona",
        "country": "Spain",
        "capacity": 99354,
        "teams": ["FC Barcelona"],
        "colors": ["blue", "burgundy", "red"],
        "architecture_style": "Massive rectangular with steep stands",
        "year_built": 1957,
        "renovated": 2023,
        "description": "Barcelona's cathedral of football, largest stadium in Europe"
    },
    
    "allianz_arena_bayern": {
        "name": "Allianz Arena Munich",
        "full_name": "Allianz Arena",
        "city": "Munich", 
        "country": "Germany",
        "capacity": 75000,
        "teams": ["Bayern Munich", "Germany National Team"],
        "colors": ["red", "white"],
        "architecture_style": "Futuristic inflated ETFE panels",
        "year_built": 2005,
        "renovated": null,
        "description": "Futuristic stadium with LED facade that glows in team colors"
    },
    
    "allianz_parque_palmeiras": {
        "name": "Allianz Parque São Paulo",
        "full_name": "Allianz Parque",
        "city": "São Paulo",
        "country": "Brazil", 
        "capacity": 43713,
        "teams": ["Palmeiras"],
        "colors": ["green", "white"],
        "architecture_style": "Modern arena with green LED lighting",
        "year_built": 2014,
        "renovated": null,
        "description": "Modern Brazilian arena, Palmeiras' passionate home"
    },
    
    "sao_januario_vasco": {
        "name": "São Januário Stadium",
        "full_name": "Estádio São Januário",
        "city": "Rio de Janeiro",
        "country": "Brazil",
        "capacity": 21880,
        "teams": ["Vasco da Gama"],
        "colors": ["black", "white"],
        "architecture_style": "Historic concrete with classic design",
        "year_built": 1927,
        "renovated": 2013,
        "description": "Historic stadium, Vasco da Gama's traditional home"
    }
}

def create_stadium_structure():
    """Cria estrutura de pastas e metadata para estádios"""
    
    base_dir = Path("stadium_references")
    base_dir.mkdir(exist_ok=True)
    
    print("🏟️ Creating Stadium References Structure")
    print("=" * 50)
    
    for stadium_id, stadium_info in STADIUMS.items():
        # Cria pasta do estádio
        stadium_dir = base_dir / stadium_id
        stadium_dir.mkdir(exist_ok=True)
        
        # Cria metadata.json
        metadata = {
            "stadium_id": stadium_id,
            "basic_info": {
                "name": stadium_info["name"],
                "full_name": stadium_info["full_name"],
                "city": stadium_info["city"],
                "country": stadium_info["country"],
                "capacity": stadium_info["capacity"],
                "year_built": stadium_info["year_built"],
                "renovated": stadium_info["renovated"]
            },
            "teams": stadium_info["teams"],
            "visual_characteristics": {
                "primary_colors": stadium_info["colors"],
                "architecture_style": stadium_info["architecture_style"],
                "description": stadium_info["description"]
            },
            "atmosphere_settings": {
                "default_crowd_colors": stadium_info["colors"],
                "typical_atmosphere": "vibrant and passionate",
                "lighting_style": "modern stadium floodlights",
                "fan_culture": "passionate supporters with team colors"
            },
            "generation_prompts": {
                "base_description": f"{stadium_info['description']}, {stadium_info['architecture_style']}",
                "crowd_description": f"passionate {stadium_info['teams'][0] if stadium_info['teams'] else 'local'} supporters",
                "color_scheme": ", ".join(stadium_info["colors"]),
                "architectural_features": stadium_info["architecture_style"]
            },
            "reference_images": {
                "required": [
                    f"{stadium_id}_day_crowd.jpg",
                    f"{stadium_id}_night_lights.jpg",
                    f"{stadium_id}_atmosphere.jpg"
                ],
                "optional": [
                    f"{stadium_id}_sunset_packed.jpg",
                    f"{stadium_id}_derby_atmosphere.jpg",
                    f"{stadium_id}_empty_training.jpg"
                ]
            }
        }
        
        # Salva metadata
        metadata_file = stadium_dir / "metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        # Cria arquivo README para o estádio
        readme_content = f"""# {stadium_info['name']}

## 📍 Informações Básicas
- **Nome**: {stadium_info['full_name']}
- **Cidade**: {stadium_info['city']}, {stadium_info['country']}
- **Capacidade**: {stadium_info['capacity']:,} pessoas
- **Times**: {', '.join(stadium_info['teams'])}
- **Construído**: {stadium_info['year_built']}
- **Renovado**: {stadium_info['renovated'] or 'N/A'}

## 🎨 Características Visuais
- **Cores principais**: {', '.join(stadium_info['colors'])}
- **Arquitetura**: {stadium_info['architecture_style']}
- **Descrição**: {stadium_info['description']}

## 📸 Imagens Necessárias

### Obrigatórias:
- `{stadium_id}_day_crowd.jpg` - Vista diurna com torcida
- `{stadium_id}_night_lights.jpg` - Vista noturna iluminada  
- `{stadium_id}_atmosphere.jpg` - Atmosfera característica

### Opcionais:
- `{stadium_id}_sunset_packed.jpg` - Pôr do sol lotado
- `{stadium_id}_derby_atmosphere.jpg` - Atmosfera de clássico
- `{stadium_id}_empty_training.jpg` - Vazio para treino

## 🎯 Dicas para Fotos
- Mostre a arquitetura característica
- Inclua torcida com cores do time
- Capture a atmosfera única do estádio
- Boa iluminação e qualidade
"""
        
        readme_file = stadium_dir / "README.md"
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print(f"✅ Created: {stadium_dir}")
        print(f"   📄 metadata.json")
        print(f"   📖 README.md")
        
        # Lista imagens necessárias
        print(f"   📸 Required images:")
        for img in metadata["reference_images"]["required"]:
            print(f"      - {img}")
        print()
    
    # Cria README principal
    main_readme = f"""# 🏟️ Stadium References

Estrutura de referências para geração de estádios com IA.

## 📁 Estádios Disponíveis

{chr(10).join([f"- **{info['name']}** (`{stadium_id}/`) - {info['city']}, {info['country']}" for stadium_id, info in STADIUMS.items()])}

## 🚀 Como Usar

1. **Adicione suas imagens** nas pastas correspondentes
2. **Siga a nomenclatura** especificada em cada README
3. **Execute o sistema** - metadata será processada automaticamente

## 📸 Formato das Imagens

- **Formatos aceitos**: JPG, PNG, WEBP
- **Resolução mínima**: 800x600
- **Qualidade**: Alta resolução preferível
- **Conteúdo**: Vista clara do estádio com torcida

## 🎯 Objetivos

- **Análise com GPT-4 Vision**: Extrai características arquitetônicas
- **Geração com DALL-E 3**: Cria novas imagens baseadas nas referências
- **Atmosfera consistente**: Torcida, iluminação, cores do time

## 📊 Status

Total de estádios: {len(STADIUMS)}
"""
    
    main_readme_file = base_dir / "README.md"
    with open(main_readme_file, 'w', encoding='utf-8') as f:
        f.write(main_readme)
    
    print("📋 Summary:")
    print(f"✅ Created {len(STADIUMS)} stadium directories")
    print(f"📁 Base directory: {base_dir}")
    print(f"📄 Total files created: {len(STADIUMS) * 2 + 1}")
    print("\n🎯 Next steps:")
    print("1. Add your stadium images to the respective folders")
    print("2. Follow the naming convention in each README")
    print("3. Run the stadium system to test")

def list_required_images():
    """Lista todas as imagens necessárias"""
    print("\n📸 Complete Image List Required:")
    print("=" * 50)
    
    for stadium_id, stadium_info in STADIUMS.items():
        print(f"\n🏟️ {stadium_info['name']} ({stadium_id}/):")
        required_images = [
            f"{stadium_id}_day_crowd.jpg",
            f"{stadium_id}_night_lights.jpg", 
            f"{stadium_id}_atmosphere.jpg"
        ]
        
        for img in required_images:
            print(f"   ✅ {img}")

if __name__ == "__main__":
    create_stadium_structure()
    list_required_images()
    
    print(f"\n🎉 Stadium structure created successfully!")
    print(f"📁 Check the 'stadium_references/' directory")
    print(f"📖 Read individual README files for specific instructions") 