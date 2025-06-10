#!/usr/bin/env python3
"""
Sistema DALL-E 3 OpenAI - Teste controlado (3 imagens por vez)
"""

from openai import OpenAI
import requests
import json
from pathlib import Path
from PIL import Image
from io import BytesIO
import time
import os
from dotenv import load_dotenv

load_dotenv()

class OpenAIDALLE3Test:
    """Sistema DALL-E 3 - Testes controlados"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            print("❌ OPENAI_API_KEY não encontrada!")
            exit(1)
        
        self.client = OpenAI(api_key=self.api_key)
        self.load_prompts()
        print(f"✅ OpenAI DALL-E 3 configurado!")
    
    def load_prompts(self):
        """Carrega prompts técnicos"""
        metadata_path = Path("dataset_clean/metadata_clean.json")
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        self.prompts = {}
        for item in metadata:
            team = item['team_name']
            self.prompts[team] = {
                'technical': item.get('technical_prompt', ''),
                'detailed': item.get('detailed_prompt', ''),
                'base': item.get('base_prompt', f'{team} soccer jersey')
            }
        
        print(f"📝 Times disponíveis: {list(self.prompts.keys())}")
    
    def enhance_prompt_for_dalle3(self, base_prompt, team_name):
        """Otimiza prompt para DALL-E 3"""
        
        dalle3_prompt = f"""Professional product photography of a {team_name} soccer jersey.

{base_prompt}

Studio lighting, clean white background, jersey laid flat in perfect symmetrical position, front view clearly showing team logo and sponsor details, official team colors, high-quality athletic fabric texture, no wrinkles, no shadows, commercial photography style."""
        
        return dalle3_prompt
    
    def generate_single_jersey(self, team_name, custom_name=None, custom_number=None, quality="standard"):
        """Gera UM jersey específico"""
        
        print(f"\n🎨 Gerando {team_name} com DALL-E 3...")
        
        # Pega prompt
        prompts = self.prompts.get(team_name, {})
        base_prompt = prompts.get('technical', prompts.get('detailed', prompts.get('base')))
        
        # Customiza se necessário
        if custom_name:
            base_prompt = base_prompt.replace('ARIEL', custom_name).replace('JEFF', custom_name)
        if custom_number:
            base_prompt = base_prompt.replace("'10'", f"'{custom_number}'").replace("'8'", f"'{custom_number}'").replace("'9'", f"'{custom_number}'")
        
        # Otimiza para DALL-E 3
        dalle3_prompt = self.enhance_prompt_for_dalle3(base_prompt, team_name)
        
        print(f"📝 Prompt: {dalle3_prompt[:80]}...")
        
        try:
            print(f"🔄 Enviando para OpenAI...")
            
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=dalle3_prompt,
                size="1024x1024",
                quality=quality,
                n=1
            )
            
            image_url = response.data[0].url
            
            # Baixa imagem
            img_response = requests.get(image_url, timeout=60)
            if img_response.status_code == 200:
                image = Image.open(BytesIO(img_response.content))
                print(f"✅ Jersey {team_name} gerado!")
                return image, dalle3_prompt
            else:
                print(f"❌ Erro ao baixar")
                return None, dalle3_prompt
                
        except Exception as e:
            print(f"❌ Erro: {e}")
            return None, dalle3_prompt
    
    def test_batch_3(self, teams_list, quality="standard"):
        """Testa lote de 3 times"""
        print("🎯 Teste DALL-E 3 - Lote de 3 jerseys")
        print("=" * 40)
        
        results_dir = Path("openai_test_results")
        results_dir.mkdir(exist_ok=True)
        
        results = []
        total_cost = 0
        cost_per_image = 0.040 if quality == "standard" else 0.080
        
        for i, team_name in enumerate(teams_list[:3], 1):
            print(f"\n📊 [{i}/3] Testando: {team_name}")
            
            image, prompt_used = self.generate_single_jersey(team_name, quality=quality)
            
            if image:
                filename = f"test_{i}_{team_name.replace(' ', '_')}.png"
                image.save(results_dir / filename)
                
                results.append({
                    "order": i,
                    "team": team_name,
                    "generated_file": filename,
                    "prompt_used": prompt_used,
                    "status": "success",
                    "cost_usd": cost_per_image
                })
                
                total_cost += cost_per_image
                print(f"💰 Custo: ${cost_per_image:.3f}")
            else:
                results.append({
                    "order": i,
                    "team": team_name,
                    "status": "failed"
                })
            
            # Pausa entre gerações
            time.sleep(3)
        
        # Salva relatório do lote
        self.save_batch_report(results_dir, results, total_cost, quality)
        
        return results, total_cost
    
    def save_batch_report(self, results_dir, results, total_cost, quality):
        """Salva relatório do lote"""
        successful = [r for r in results if r.get('status') == 'success']
        
        report = {
            "batch_test": True,
            "method": "openai_dalle3_batch",
            "quality": quality,
            "total_generated": len(successful),
            "total_cost_usd": round(total_cost, 3),
            "cost_per_image": 0.040 if quality == "standard" else 0.080,
            "results": results,
            "next_steps": [
                "review_image_quality",
                "adjust_prompts_if_needed", 
                "generate_next_batch"
            ]
        }
        
        with open(results_dir / f"batch_report_{len(results)}.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎯 Lote concluído!")
        print(f"📁 Resultados: {results_dir}")
        print(f"✅ Sucessos: {len(successful)}/{len(results)}")
        print(f"💰 Custo do lote: ${total_cost:.3f}")
        print(f"💵 Créditos restantes: ~${5 - total_cost:.3f}")
        
        if len(successful) > 0:
            print(f"\n🔍 Analise os resultados e depois:")
            print(f"   1. Se ficaram bons: gere próximo lote")
            print(f"   2. Se precisa melhorar: ajuste prompts")
    
    def show_available_teams(self):
        """Mostra times disponíveis"""
        print("📋 Times disponíveis:")
        for i, team in enumerate(self.prompts.keys(), 1):
            print(f"   {i}. {team}")

def main():
    """Função principal"""
    print("🎯 Teste OpenAI DALL-E 3 - Controlado")
    print("=" * 40)
    
    tester = OpenAIDALLE3Test()
    tester.show_available_teams()
    
    # Primeiro lote: 3 times principais
    first_batch = ["Palmeiras", "Vasco da Gama", "Flamengo"]
    
    print(f"\n🚀 Primeiro lote: {first_batch}")
    print(f"💰 Custo estimado: $0.12 (3 × $0.04)")
    
    quality = "standard"
    results, cost = tester.test_batch_3(first_batch, quality)
    
    print(f"\n🎉 Primeiro teste concluído!")
    print(f"📁 Verifique: openai_test_results/")
    print(f"🔍 Analise a qualidade antes do próximo lote!")

if __name__ == "__main__":
    main() 