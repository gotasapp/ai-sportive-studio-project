#!/usr/bin/env python3
"""
Teste do Sistema Melhorado - Prompts Técnicos + ControlNet
"""

import json
import requests
import base64
from io import BytesIO
from PIL import Image
from pathlib import Path
import time

class ImprovedJerseySystem:
    """Sistema melhorado com prompts técnicos e ControlNet"""
    
    def __init__(self):
        self.server_url = "http://localhost:8000"
        self.check_server()
        self.load_technical_prompts()
        
    def check_server(self):
        """Verifica servidor"""
        try:
            response = requests.get(f"{self.server_url}/health")
            if response.status_code == 200:
                print("✅ Servidor AI funcionando")
                return True
        except:
            print("❌ Servidor AI não está rodando!")
            exit(1)
    
    def load_technical_prompts(self):
        """Carrega prompts técnicos"""
        metadata_path = Path("dataset_clean/metadata_clean.json")
        
        if not metadata_path.exists():
            print("❌ Prompts técnicos não encontrados!")
            print("Execute: python technical_prompts.py")
            exit(1)
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
        
        # Verifica se tem prompts técnicos
        has_technical = any('technical_prompt' in item for item in self.metadata)
        if not has_technical:
            print("❌ Prompts técnicos não configurados!")
            print("Execute: python technical_prompts.py")
            exit(1)
        
        print(f"✅ Prompts técnicos carregados: {len(self.metadata)} times")
    
    def generate_improved_jersey(self, team_name, custom_name=None, custom_number=None):
        """Gera jersey com sistema melhorado"""
        print(f"\n🎨 Gerando jersey melhorado: {team_name}")
        
        # Encontra metadados do time
        team_data = None
        for item in self.metadata:
            if item['team_name'] == team_name:
                team_data = item
                break
        
        if not team_data:
            print(f"❌ Time não encontrado: {team_name}")
            return None
        
        # Usa prompt técnico
        prompt = team_data.get('technical_prompt', team_data.get('detailed_prompt', ''))
        negative_prompt = team_data.get('negative_prompt', '')
        
        # Customiza nome/número se fornecido
        if custom_name:
            prompt = prompt.replace('ARIEL', custom_name).replace('JEFF', custom_name)
        if custom_number:
            prompt = prompt.replace("'10'", f"'{custom_number}'").replace("'8'", f"'{custom_number}'").replace("'9'", f"'{custom_number}'")
        
        print(f"📝 Prompt técnico: {prompt[:100]}...")
        print(f"🚫 Negative prompt: {negative_prompt[:50]}...")
        
        # Gera imagem
        try:
            response = requests.post(
                f"{self.server_url}/generate-image",
                json={
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "width": 512,
                    "height": 512
                },
                timeout=90
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["image"]
            else:
                print(f"❌ Erro na API: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Erro: {e}")
            return None
    
    def test_all_teams(self):
        """Testa todos os times com sistema melhorado"""
        print("🚀 Testando Sistema Melhorado")
        print("=" * 35)
        
        results_dir = Path("improved_results")
        results_dir.mkdir(exist_ok=True)
        
        results = []
        
        for item in self.metadata:
            team_name = item['team_name']
            print(f"\n📊 Testando: {team_name}")
            
            # Gera com prompt técnico
            image_base64 = self.generate_improved_jersey(team_name)
            
            if image_base64:
                # Salva imagem
                image_data = base64.b64decode(image_base64)
                image = Image.open(BytesIO(image_data))
                
                filename = f"improved_{team_name.replace(' ', '_')}.png"
                image.save(results_dir / filename)
                
                results.append({
                    "team": team_name,
                    "filename": filename,
                    "prompt_type": "technical",
                    "status": "success"
                })
                
                print(f"✅ Salvo: {filename}")
            else:
                results.append({
                    "team": team_name,
                    "status": "failed"
                })
                print(f"❌ Falha na geração")
            
            # Pausa entre gerações
            time.sleep(3)
        
        # Salva relatório
        report = {
            "test_type": "improved_system",
            "total_teams": len(self.metadata),
            "successful_generations": len([r for r in results if r.get('status') == 'success']),
            "improvements": [
                "technical_prompts",
                "negative_prompts", 
                "flat_lay_specification",
                "camera_settings"
            ],
            "results": results
        }
        
        with open(results_dir / "improved_test_report.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎯 Teste concluído!")
        print(f"📁 Resultados: {results_dir}")
        print(f"✅ Sucessos: {report['successful_generations']}/{report['total_teams']}")
        
        return results
    
    def compare_with_previous(self):
        """Compara com resultados anteriores"""
        print("\n📊 Comparando com resultados anteriores...")
        
        # Verifica se existem resultados anteriores
        old_results = Path("api_training_results")
        new_results = Path("improved_results")
        
        if old_results.exists() and new_results.exists():
            old_files = list(old_results.glob("*.png"))
            new_files = list(new_results.glob("*.png"))
            
            print(f"📈 Resultados anteriores: {len(old_files)} imagens")
            print(f"🆕 Resultados melhorados: {len(new_files)} imagens")
            
            print(f"\n🔍 Compare visualmente:")
            print(f"   Antigo: {old_results}")
            print(f"   Novo: {new_results}")
        else:
            print("⚠️ Resultados anteriores não encontrados")

def main():
    """Função principal"""
    print("🎯 Sistema Jersey Melhorado - Teste Completo")
    print("=" * 50)
    
    # Verifica dependências
    if not Path("dataset_clean/metadata_clean.json").exists():
        print("❌ Execute primeiro: python create_clean_dataset.py")
        return
    
    system = ImprovedJerseySystem()
    
    # Testa sistema melhorado
    results = system.test_all_teams()
    
    # Compara com anteriores
    system.compare_with_previous()
    
    print(f"\n🎉 Teste do sistema melhorado concluído!")
    print(f"🔍 Verifique a pasta 'improved_results' para ver a diferença!")

if __name__ == "__main__":
    main() 