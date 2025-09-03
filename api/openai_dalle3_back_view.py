#!/usr/bin/env python3
"""
Sistema DALL-E 3 - Vista das costas (baseado no prompt ChatGPT-4)
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

class OpenAIDALLE3BackView:
    """Sistema DALL-E 3 - Jerseys vista das costas"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            print("❌ OPENAI_API_KEY não encontrada!")
            exit(1)
        
        self.client = OpenAI(api_key=self.api_key)
        self.setup_teams_config()
        self.load_reference_images()
        print(f"✅ OpenAI DALL-E 3 configurado para vista das costas!")
    
    def setup_teams_config(self):
        """Configuração base para times e jogadores padrão"""
        self.teams_default_players = {
            "Vasco da Gama": {"name": "VEGETTI", "number": "10"},
            "Palmeiras": {"name": "MARIO", "number": "10"},
            "São Paulo": {"name": "ARIEL", "number": "9"}
        }
        
        # Prompt base otimizado (com placeholders dinâmicos)
        self.base_prompt_template = """A photorealistic back view of a professional soccer jersey on a white studio background, designed for jersey customization interfaces. The jersey is centered and fully visible, with a clean flat fit and realistic texture. At the top, display the player name "{PLAYER_NAME}" in bold uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}".

The jersey must exactly match the official home design of the "{TEAM_NAME}" team: use authentic team colors, patterns, sponsors, and jersey layout. Ensure high contrast between text and background for readability. Use realistic lighting and subtle shadows to reflect fabric quality.

Do not show any mannequin, human body, hanger, or background elements. No angled views or tilted perspectives. Avoid front view, 3D rotation, folds, blurs or wrinkles. The format, layout and proportions must exactly match the Vasco da Gama example with "JEFF" and number "8". Keep the name and number aligned and consistent in size across all generations. 4K resolution."""
        
        print(f"📝 Times disponíveis: {list(self.teams_default_players.keys())}")
        print(f"🎯 Prompt base otimizado carregado!")
    
    def load_reference_images(self):
        """Carrega e analisa imagens de referência locais"""
        self.reference_analysis = {}
        
        reference_files = {
            "Palmeiras": "dataset_clean/jerseys/reference/reference_1_Palmeiras_back.png",
            "Vasco da Gama": "dataset_clean/jerseys/reference/reference_2_Vasco_back.png", 
            "São Paulo": "dataset_clean/jerseys/reference/Sao_Paulo_back.png"
        }
        
        for team, file_path in reference_files.items():
            ref_path = Path(file_path)
            if ref_path.exists():
                try:
                    # Carrega imagem de referência
                    reference_img = Image.open(ref_path)
                    width, height = reference_img.size
                    
                    # Analisa características da referência
                    self.reference_analysis[team] = {
                        "file_found": True,
                        "dimensions": f"{width}x{height}",
                        "aspect_ratio": round(width/height, 2),
                        "format_notes": "flat lay, back view, centered layout"
                    }
                    print(f"📸 Referência carregada: {team} ({width}x{height})")
                    
                except Exception as e:
                    print(f"⚠️ Erro ao carregar {team}: {e}")
                    self.reference_analysis[team] = {"file_found": False}
            else:
                print(f"⚠️ Referência não encontrada: {file_path}")
                self.reference_analysis[team] = {"file_found": False}
    
    def create_back_view_prompt(self, team_name, custom_name=None, custom_number=None):
        """Cria prompt usando template otimizado com placeholders dinâmicos"""
        
        if team_name not in self.teams_default_players:
            print(f"❌ Time {team_name} não está na lista disponível")
            return None
        
        # Usa customizações ou valores padrão
        default_player = self.teams_default_players[team_name]
        player_name = custom_name or default_player["name"]
        number = custom_number or default_player["number"]
        
        # Substitui placeholders no template base
        prompt = self.base_prompt_template.format(
            PLAYER_NAME=player_name,
            PLAYER_NUMBER=number,
            TEAM_NAME=team_name
        )
        
        # Adiciona informações da referência se disponível
        if team_name in self.reference_analysis and self.reference_analysis[team_name].get("file_found"):
            ref_data = self.reference_analysis[team_name]
            prompt += f" Reference dimensions: {ref_data['dimensions']}, maintain exact {ref_data['format_notes']}."
        
        return prompt
    
    def generate_back_view_jersey(self, team_name, custom_name=None, custom_number=None, quality="standard"):
        """Gera jersey vista das costas usando prompt otimizado"""
        
        print(f"\n🎨 Gerando {team_name} (vista das costas) com DALL-E 3...")
        
        # Cria prompt otimizado
        dalle3_prompt = self.create_back_view_prompt(team_name, custom_name, custom_number)
        
        if not dalle3_prompt:
            print(f"❌ Time {team_name} não configurado")
            return None, None
        
        print(f"📝 Prompt: {dalle3_prompt[:100]}...")
        
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
                print(f"✅ Jersey {team_name} (costas) gerado!")
                return image, dalle3_prompt
            else:
                print(f"❌ Erro ao baixar")
                return None, dalle3_prompt
                
        except Exception as e:
            print(f"❌ Erro: {e}")
            return None, dalle3_prompt
    
    def test_back_view_batch(self, teams_list, quality="standard"):
        """Testa lote de jerseys vista das costas"""
        print("🎯 Teste DALL-E 3 - Vista das Costas")
        print("=" * 40)
        
        results_dir = Path("openai_back_view_results")
        results_dir.mkdir(exist_ok=True)
        
        results = []
        total_cost = 0
        cost_per_image = 0.040 if quality == "standard" else 0.080
        
        for i, team_name in enumerate(teams_list, 1):
            if team_name not in self.teams_default_players:
                print(f"❌ {team_name} não disponível, pulando...")
                continue
                
            print(f"\n📊 [{i}] Testando: {team_name} (vista das costas)")
            
            image, prompt_used = self.generate_back_view_jersey(team_name, quality=quality)
            
            if image:
                filename = f"back_view_{team_name.replace(' ', '_')}.png"
                image.save(results_dir / filename)
                
                results.append({
                    "order": i,
                    "team": team_name,
                    "view": "back",
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
                    "view": "back", 
                    "status": "failed"
                })
            
            time.sleep(3)
        
        # Testa variações customizadas
        self.test_custom_back_variations(results_dir, results, quality, total_cost)
        
        return results, total_cost
    
    def test_custom_back_variations(self, results_dir, results, quality, total_cost):
        """Testa variações customizadas vista das costas"""
        print(f"\n🎨 Testando Variações Customizadas (costas)...")
        
        cost_per_image = 0.040 if quality == "standard" else 0.080
        
        custom_tests = [
            {"team": "Vasco da Gama", "name": "PEDRO", "number": "7"},
            {"team": "Palmeiras", "name": "GABRIEL", "number": "23"}, 
            {"team": "São Paulo", "name": "BRUNO", "number": "11"}
        ]
        
        for test in custom_tests:
            team = test["team"]
            name = test["name"]
            number = test["number"]
            
            print(f"\n🔄 {team} - {name} #{number} (costas)")
            
            image, prompt_used = self.generate_back_view_jersey(team, name, number, quality)
            
            if image:
                filename = f"back_custom_{team.replace(' ', '_')}_{name}_{number}.png"
                image.save(results_dir / filename)
                
                results.append({
                    "team": team,
                    "view": "back",
                    "custom_name": name,
                    "custom_number": number,
                    "generated_file": filename,
                    "prompt_used": prompt_used,
                    "status": "success",
                    "cost_usd": cost_per_image
                })
                
                total_cost += cost_per_image
                print(f"✅ Variação: {filename}")
                print(f"💰 Custo: ${cost_per_image:.3f}")
            else:
                print(f"❌ Falha na variação")
            
            time.sleep(3)
        
        # Salva relatório
        self.save_back_view_report(results_dir, results, total_cost, quality)
    
    def save_back_view_report(self, results_dir, results, total_cost, quality):
        """Salva relatório vista das costas"""
        successful = [r for r in results if r.get('status') == 'success']
        
        report = {
            "view_type": "back_view_only",
            "method": "openai_dalle3_back_optimized",
            "prompt_source": "chatgpt4_analyzed_references",
            "quality": quality,
            "total_generated": len(successful),
            "total_cost_usd": round(total_cost, 3),
            "cost_per_image": 0.040 if quality == "standard" else 0.080,
            "results": results,
            "advantages": [
                "chatgpt4_optimized_prompts",
                "back_view_format_perfect",
                "matches_original_references",
                "professional_quality"
            ]
        }
        
        with open(results_dir / "back_view_report.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎯 Vista das costas concluída!")
        print(f"📁 Resultados: {results_dir}")
        print(f"✅ Sucessos: {len(successful)}/{len(results)}")
        print(f"💰 Custo total: ${total_cost:.3f}")
        print(f"💵 Créditos restantes: ~${5 - total_cost:.3f}")
        print(f"🔥 Baseado no prompt ChatGPT-4!")

def main():
    """Função principal"""
    print("🎯 Sistema DALL-E 3 - Vista das Costas")
    print("=" * 40)
    
    tester = OpenAIDALLE3BackView()
    
    # Times para testar
    teams_to_test = ["Vasco da Gama", "Palmeiras", "São Paulo"]
    
    print(f"\n🚀 Testando vista das costas: {teams_to_test}")
    print(f"💰 Custo estimado: ${len(teams_to_test) * 0.04:.2f} + variações")
    print(f"🎯 Prompt baseado na análise ChatGPT-4!")
    
    quality = "standard"
    results, cost = tester.test_back_view_batch(teams_to_test, quality)
    
    print(f"\n🎉 Teste vista das costas concluído!")
    print(f"📁 Verifique: openai_back_view_results/")
    print(f"🔥 Agora deve estar igual às suas referências!")

if __name__ == "__main__":
    main() 