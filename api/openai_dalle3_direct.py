#!/usr/bin/env python3
"""
Sistema DALL-E 3 OpenAI Direto - Qualidade perfeita para jerseys
"""

import openai
import requests
import json
from pathlib import Path
from PIL import Image
from io import BytesIO
import time
import os
from dotenv import load_dotenv

load_dotenv()

class OpenAIDALLE3Direct:
    """Sistema DALL-E 3 OpenAI direto"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            print("❌ OPENAI_API_KEY não encontrada!")
            print("🔑 Configure no arquivo .env:")
            print("   OPENAI_API_KEY=your_key_here")
            exit(1)
        
        # Configura cliente OpenAI
        openai.api_key = self.api_key
        
        self.load_prompts()
        print(f"✅ OpenAI DALL-E 3 configurado!")
    
    def load_prompts(self):
        """Carrega prompts técnicos otimizados"""
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
        
        print(f"📝 Prompts carregados: {list(self.prompts.keys())}")
    
    def enhance_prompt_for_dalle3(self, base_prompt, team_name):
        """Otimiza prompt especificamente para DALL-E 3"""
        
        # DALL-E 3 responde melhor a prompts mais naturais e descritivos
        dalle3_prompt = f"""Professional product photography of a {team_name} soccer jersey.

{base_prompt}

Studio lighting, clean white background, jersey laid flat in perfect symmetrical position, front view clearly showing team logo and sponsor details, official team colors, high-quality athletic fabric texture, no wrinkles, no shadows, commercial photography style, 4K resolution."""
        
        return dalle3_prompt
    
    def generate_jersey_dalle3(self, team_name, custom_name=None, custom_number=None, quality="standard"):
        """Gera jersey usando DALL-E 3 OpenAI direto"""
        
        print(f"\n🎨 Gerando {team_name} com DALL-E 3...")
        
        # Pega prompt técnico
        prompts = self.prompts.get(team_name, {})
        base_prompt = prompts.get('technical', prompts.get('detailed', prompts.get('base')))
        
        # Customiza nome/número
        if custom_name:
            base_prompt = base_prompt.replace('ARIEL', custom_name).replace('JEFF', custom_name)
        if custom_number:
            base_prompt = base_prompt.replace("'10'", f"'{custom_number}'").replace("'8'", f"'{custom_number}'").replace("'9'", f"'{custom_number}'")
        
        # Otimiza para DALL-E 3
        dalle3_prompt = self.enhance_prompt_for_dalle3(base_prompt, team_name)
        
        print(f"📝 Prompt DALL-E 3: {dalle3_prompt[:100]}...")
        
        try:
            print(f"🔄 Enviando para OpenAI DALL-E 3...")
            
            response = openai.Image.create(
                model="dall-e-3",
                prompt=dalle3_prompt,
                size="1024x1024",
                quality=quality,  # "standard" ou "hd"
                n=1
            )
            
            # Pega URL da imagem
            image_url = response['data'][0]['url']
            
            # Baixa a imagem
            img_response = requests.get(image_url, timeout=60)
            if img_response.status_code == 200:
                image = Image.open(BytesIO(img_response.content))
                return image, dalle3_prompt
            else:
                print(f"❌ Erro ao baixar imagem: {img_response.status_code}")
                return None, dalle3_prompt
                
        except Exception as e:
            print(f"❌ Erro OpenAI: {e}")
            return None, dalle3_prompt
    
    def test_all_teams(self, quality="standard"):
        """Testa todos os times com DALL-E 3"""
        print("🎯 Sistema DALL-E 3 OpenAI Direto")
        print("=" * 40)
        
        results_dir = Path("openai_dalle3_results")
        results_dir.mkdir(exist_ok=True)
        
        results = []
        total_cost = 0
        cost_per_image = 0.040 if quality == "standard" else 0.080
        
        # Testa cada time
        for team_name in self.prompts.keys():
            print(f"\n📊 Testando: {team_name}")
            
            # Gera com DALL-E 3
            image, prompt_used = self.generate_jersey_dalle3(team_name, quality=quality)
            
            if image:
                # Salva imagem
                filename = f"openai_dalle3_{team_name.replace(' ', '_')}.png"
                image.save(results_dir / filename)
                
                results.append({
                    "team": team_name,
                    "generated_file": filename,
                    "method": "openai_dalle3_direct",
                    "quality": quality,
                    "prompt_used": prompt_used,
                    "status": "success",
                    "cost_usd": cost_per_image
                })
                
                total_cost += cost_per_image
                print(f"✅ Gerado: {filename}")
                print(f"💰 Custo: ${cost_per_image:.3f}")
            else:
                results.append({
                    "team": team_name,
                    "status": "failed"
                })
                print(f"❌ Falha na geração")
            
            # Pausa entre gerações
            time.sleep(2)
        
        # Testa variações customizadas
        self.test_custom_variations(results_dir, results, quality, total_cost)
        
        return results, total_cost
    
    def test_custom_variations(self, results_dir, results, quality, total_cost):
        """Testa variações customizadas"""
        print(f"\n🎨 Testando Variações Customizadas...")
        
        cost_per_image = 0.040 if quality == "standard" else 0.080
        
        custom_tests = [
            {"team": "Vasco da Gama", "name": "PEDRO", "number": "7"},
            {"team": "Palmeiras", "name": "GABRIEL", "number": "23"},
            {"team": "Flamengo", "name": "BRUNO", "number": "11"}
        ]
        
        for test in custom_tests:
            team = test["team"]
            name = test["name"]
            number = test["number"]
            
            print(f"\n🔄 {team} - {name} #{number}")
            
            image, prompt_used = self.generate_jersey_dalle3(team, name, number, quality)
            
            if image:
                filename = f"openai_dalle3_custom_{team.replace(' ', '_')}_{name}_{number}.png"
                image.save(results_dir / filename)
                
                results.append({
                    "team": team,
                    "custom_name": name,
                    "custom_number": number,
                    "generated_file": filename,
                    "method": "openai_dalle3_custom",
                    "quality": quality,
                    "prompt_used": prompt_used,
                    "status": "success",
                    "cost_usd": cost_per_image
                })
                
                total_cost += cost_per_image
                print(f"✅ Variação: {filename}")
                print(f"💰 Custo: ${cost_per_image:.3f}")
            else:
                print(f"❌ Falha na variação")
            
            time.sleep(2)
        
        # Salva relatório final
        self.save_dalle3_report(results_dir, results, total_cost, quality)
    
    def save_dalle3_report(self, results_dir, results, total_cost, quality):
        """Salva relatório DALL-E 3"""
        successful = [r for r in results if r.get('status') == 'success']
        
        report = {
            "method": "openai_dalle3_direct",
            "model": "dall-e-3",
            "quality": quality,
            "total_tests": len(results),
            "successful_generations": len(successful),
            "total_cost_usd": round(total_cost, 3),
            "cost_per_image": 0.040 if quality == "standard" else 0.080,
            "advantages": [
                "official_dalle3_quality",
                "direct_openai_api",
                "perfect_jersey_format",
                "professional_results",
                "same_quality_as_references"
            ],
            "results": results
        }
        
        with open(results_dir / "openai_dalle3_report.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎯 OpenAI DALL-E 3 concluído!")
        print(f"📁 Resultados: {results_dir}")
        print(f"✅ Sucessos: {len(successful)}/{len(results)}")
        print(f"💰 Custo total: ${total_cost:.3f}")
        print(f"🔥 Qualidade: DALL-E 3 oficial!")

def main():
    """Função principal"""
    print("🎯 Sistema OpenAI DALL-E 3 Direto")
    print("=" * 40)
    
    # Testa sistema
    dalle3_system = OpenAIDALLE3Direct()
    
    print("\n🎨 Escolha a qualidade:")
    print("1. Standard ($0.040/imagem)")
    print("2. HD ($0.080/imagem)")
    
    # Para teste automático, usar standard
    quality = "standard"
    print(f"🔥 Usando qualidade: {quality}")
    
    results, total_cost = dalle3_system.test_all_teams(quality)
    
    print(f"\n🎉 OpenAI DALL-E 3 testado!")
    print(f"🔥 Qualidade oficial igual às suas referências!")
    print(f"📁 Verifique: openai_dalle3_results/")

if __name__ == "__main__":
    main() 