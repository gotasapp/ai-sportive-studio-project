#!/usr/bin/env python3
"""
Script para gerar metadados dos estádios automaticamente
Detecta imagens existentes e cria metadata.json para cada estádio
"""

import os
import json
import glob
from pathlib import Path
from dotenv import load_dotenv
import requests
import base64
from PIL import Image
import io

# Carregar variáveis de ambiente
load_dotenv()

class StadiumMetadataGenerator:
    def __init__(self):
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')
        self.base_path = Path("api/stadium_references")
        
        if not self.openrouter_key:
            raise ValueError("OPENROUTER_API_KEY não encontrada no .env")
    
    def get_image_files(self, stadium_path):
        """Detecta todas as imagens em uma pasta de estádio"""
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
        images = []
        
        for ext in image_extensions:
            images.extend(glob.glob(str(stadium_path / ext)))
        
        return [Path(img) for img in images]
    
    def encode_image(self, image_path):
        """Codifica imagem para base64"""
        try:
            with Image.open(image_path) as img:
                # Redimensionar se muito grande (para economizar tokens)
                if img.width > 1024 or img.height > 1024:
                    img.thumbnail((1024, 1024), Image.Lanczos)
                
                # Converter para RGB se necessário
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Salvar em buffer
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                
                return base64.b64encode(buffer.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"Erro ao processar {image_path}: {e}")
            return None
    
    def analyze_stadium_image(self, image_path):
        """Analisa uma imagem de estádio usando GPT-4 Vision"""
        image_base64 = self.encode_image(image_path)
        if not image_base64:
            return None
        
        prompt = """Analise esta imagem de estádio e me forneça as seguintes informações em formato JSON:

{
  "architecture_style": "descrição do estilo arquitetônico (moderno, clássico, futurista, etc.)",
  "capacity_apparent": "capacidade aparente (pequeno, médio, grande, gigante)",
  "roof_type": "tipo de cobertura (aberta, parcial, fechada, retrátil)",
  "lighting_quality": "qualidade da iluminação (natural, artificial, mista, dramática)",
  "crowd_density": "densidade da torcida (vazio, esparso, médio, lotado, superlotado)",
  "atmosphere_type": "tipo de atmosfera (calma, animada, intensa, épica)",
  "time_of_day": "período do dia (manhã, tarde, noite, crepúsculo)",
  "weather_apparent": "clima aparente (ensolarado, nublado, chuvoso, limpo)",
  "dominant_colors": ["cor1", "cor2", "cor3"],
  "architectural_features": ["característica1", "característica2"],
  "unique_elements": "elementos únicos ou distintivos do estádio"
}

Seja específico e detalhado. Responda APENAS com o JSON válido."""

        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content'].strip()
                
                # Tentar extrair JSON do conteúdo
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()
                elif content.startswith('```'):
                    content = content.replace('```', '').strip()
                
                return json.loads(content)
            else:
                print(f"Erro na API: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Erro ao analisar {image_path}: {e}")
            return None
    
    def generate_stadium_metadata(self, stadium_name, stadium_path):
        """Gera metadados completos para um estádio"""
        print(f"\n🏟️  Processando {stadium_name}...")
        
        images = self.get_image_files(stadium_path)
        if not images:
            print(f"❌ Nenhuma imagem encontrada em {stadium_path}")
            return None
        
        print(f"📸 Encontradas {len(images)} imagens: {[img.name for img in images]}")
        
        # Analisar cada imagem
        image_analyses = {}
        reference_images = []
        
        for img_path in images:
            print(f"   Analisando {img_path.name}...")
            analysis = self.analyze_stadium_image(img_path)
            
            if analysis:
                image_analyses[img_path.name] = analysis
                reference_images.append({
                    "filename": img_path.name,
                    "type": self.classify_image_type(img_path.name),
                    "analysis": analysis
                })
                print(f"   ✅ {img_path.name} analisada")
            else:
                print(f"   ❌ Falha ao analisar {img_path.name}")
        
        if not reference_images:
            print(f"❌ Nenhuma imagem foi analisada com sucesso para {stadium_name}")
            return None
        
        # Consolidar informações
        metadata = self.consolidate_metadata(stadium_name, reference_images)
        
        # Salvar metadata.json
        metadata_path = stadium_path / "metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Metadados salvos em {metadata_path}")
        return metadata
    
    def classify_image_type(self, filename):
        """Classifica o tipo da imagem baseado no nome"""
        filename_lower = filename.lower()
        
        if 'night' in filename_lower:
            return 'night_lights'
        elif 'day' in filename_lower:
            return 'day_crowd'
        elif 'atmosphere' in filename_lower:
            return 'atmosphere'
        else:
            return 'general'
    
    def consolidate_metadata(self, stadium_name, reference_images):
        """Consolida análises individuais em metadados do estádio"""
        
        # Extrair informações mais comuns
        all_colors = []
        all_features = []
        architectures = []
        
        for img_data in reference_images:
            analysis = img_data['analysis']
            all_colors.extend(analysis.get('dominant_colors', []))
            all_features.extend(analysis.get('architectural_features', []))
            architectures.append(analysis.get('architecture_style', ''))
        
        # Determinar características dominantes
        unique_colors = list(set(all_colors))[:5]  # Top 5 cores
        unique_features = list(set(all_features))
        main_architecture = max(set(architectures), key=architectures.count) if architectures else "moderno"
        
        # Criar metadados consolidados
        metadata = {
            "stadium_info": {
                "name": stadium_name.replace('_', ' ').title(),
                "id": stadium_name,
                "architecture_style": main_architecture,
                "dominant_colors": unique_colors,
                "architectural_features": unique_features
            },
            "atmosphere_variants": {
                "night_packed_vibrant": {
                    "description": f"Noite vibrante no {stadium_name.replace('_', ' ').title()} com torcida animada",
                    "lighting": "artificial intensa",
                    "crowd_energy": "alta",
                    "colors": unique_colors[:3]
                },
                "day_classic_atmosphere": {
                    "description": f"Atmosfera clássica diurna no {stadium_name.replace('_', ' ').title()}",
                    "lighting": "natural",
                    "crowd_energy": "média",
                    "colors": unique_colors[:3]
                },
                "sunset_golden_hour": {
                    "description": f"Pôr do sol dourado no {stadium_name.replace('_', ' ').title()}",
                    "lighting": "dourada natural",
                    "crowd_energy": "média-alta",
                    "colors": ["dourado", "laranja"] + unique_colors[:2]
                }
            },
            "reference_images": reference_images,
            "generation_prompts": {
                "base_description": f"Estádio {main_architecture} com arquitetura característica",
                "atmosphere_modifiers": unique_features,
                "color_palette": unique_colors
            },
            "created_at": "2024-12-19",
            "version": "1.0"
        }
        
        return metadata
    
    def process_all_stadiums(self):
        """Processa todos os estádios encontrados"""
        print("🚀 Iniciando geração de metadados para estádios...")
        
        if not self.base_path.exists():
            print(f"❌ Pasta {self.base_path} não encontrada")
            return
        
        stadium_folders = [d for d in self.base_path.iterdir() if d.is_dir()]
        
        if not stadium_folders:
            print(f"❌ Nenhuma pasta de estádio encontrada em {self.base_path}")
            return
        
        print(f"📁 Encontradas {len(stadium_folders)} pastas de estádios")
        
        results = {}
        
        for stadium_path in stadium_folders:
            stadium_name = stadium_path.name
            metadata = self.generate_stadium_metadata(stadium_name, stadium_path)
            
            if metadata:
                results[stadium_name] = "✅ Sucesso"
            else:
                results[stadium_name] = "❌ Falha"
        
        # Resumo final
        print("\n" + "="*50)
        print("📊 RESUMO FINAL:")
        print("="*50)
        
        for stadium, status in results.items():
            print(f"{status} {stadium}")
        
        successful = sum(1 for status in results.values() if "✅" in status)
        total = len(results)
        
        print(f"\n🎯 {successful}/{total} estádios processados com sucesso!")
        
        if successful > 0:
            print("\n🎉 Metadados gerados! Agora você pode testar o sistema de geração.")
            print("💡 Execute: python api/test_stadium_system.py")

def main():
    try:
        generator = StadiumMetadataGenerator()
        generator.process_all_stadiums()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main() 