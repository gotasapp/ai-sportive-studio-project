#!/usr/bin/env python3
"""
Test Script for Stadium Vision + DALL-E 3 System
Testa o pipeline completo: GPT-4 Vision → DALL-E 3
"""

import asyncio
import base64
import json
import os
import requests
from pathlib import Path
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

class StadiumSystemTester:
    def __init__(self):
        self.api_base_url = "http://localhost:8001"
        self.test_results_dir = Path("stadium_test_results")
        self.test_results_dir.mkdir(exist_ok=True)
        
        print("🏟️ Stadium Vision + DALL-E 3 System Tester")
        print("=" * 50)
        
    def load_test_image(self, image_path: str) -> str:
        """Carrega imagem de teste e converte para base64"""
        try:
            with Image.open(image_path) as img:
                # Redimensiona se muito grande
                if img.width > 1024 or img.height > 1024:
                    img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                image_base64 = base64.b64encode(buffered.getvalue()).decode()
                
                print(f"✅ Loaded test image: {image_path}")
                print(f"📏 Size: {img.width}x{img.height}")
                return image_base64
                
        except Exception as e:
            print(f"❌ Failed to load image {image_path}: {e}")
            return ""
    
    def save_result_image(self, base64_data: str, filename: str) -> str:
        """Salva imagem resultado em arquivo"""
        try:
            image_data = base64.b64decode(base64_data)
            image_path = self.test_results_dir / filename
            
            with open(image_path, 'wb') as f:
                f.write(image_data)
            
            print(f"💾 Saved result: {image_path}")
            return str(image_path)
            
        except Exception as e:
            print(f"❌ Failed to save image: {e}")
            return ""
    
    def test_health_check(self) -> bool:
        """Testa se a API está funcionando"""
        try:
            print("\n🔍 Testing API health...")
            response = requests.get(f"{self.api_base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ API is healthy")
                print(f"   GPT-4 Vision: {data.get('gpt4_vision', 'unknown')}")
                print(f"   DALL-E 3: {data.get('dalle3', 'unknown')}")
                return True
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_analysis_only(self, image_base64: str, test_name: str) -> dict:
        """Testa apenas a análise com GPT-4 Vision"""
        try:
            print(f"\n🔍 Testing analysis for: {test_name}")
            
            payload = {
                "reference_image_base64": image_base64,
                "analysis_type": "comprehensive"
            }
            
            response = requests.post(
                f"{self.api_base_url}/analyze-stadium",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success"):
                    print("✅ Analysis completed successfully")
                    print(f"💰 Cost: ${result.get('cost_usd', 0):.3f}")
                    
                    # Salva resultado da análise
                    analysis_file = self.test_results_dir / f"{test_name}_analysis.json"
                    with open(analysis_file, 'w', encoding='utf-8') as f:
                        json.dump(result, f, indent=2, ensure_ascii=False)
                    
                    return result
                else:
                    print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")
                    return {}
            else:
                print(f"❌ API request failed: {response.status_code}")
                return {}
                
        except Exception as e:
            print(f"❌ Analysis test error: {e}")
            return {}
    
    def test_full_generation(self, image_base64: str, test_name: str, params: dict = None) -> dict:
        """Testa pipeline completo: Análise + Geração"""
        try:
            print(f"\n🎨 Testing full generation for: {test_name}")
            
            # Parâmetros padrão
            default_params = {
                "reference_image_base64": image_base64,
                "generation_style": "realistic",
                "atmosphere": "packed",
                "time_of_day": "day",
                "weather": "clear",
                "quality": "standard"
            }
            
            if params:
                default_params.update(params)
            
            print(f"⚙️ Parameters:")
            for key, value in default_params.items():
                if key != "reference_image_base64":
                    print(f"   {key}: {value}")
            
            response = requests.post(
                f"{self.api_base_url}/generate-stadium",
                json=default_params,
                timeout=120  # Mais tempo para geração
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success"):
                    print("✅ Generation completed successfully")
                    print(f"💰 Total cost: ${result.get('cost_usd', 0):.3f}")
                    
                    # Salva imagem gerada
                    if result.get("generated_image_base64"):
                        image_filename = f"{test_name}_generated.png"
                        self.save_result_image(result["generated_image_base64"], image_filename)
                    
                    # Salva resultado completo
                    result_file = self.test_results_dir / f"{test_name}_full_result.json"
                    with open(result_file, 'w', encoding='utf-8') as f:
                        # Remove base64 da imagem para não sobrecarregar o JSON
                        result_copy = result.copy()
                        if "generated_image_base64" in result_copy:
                            result_copy["generated_image_base64"] = "[BASE64_DATA_REMOVED]"
                        json.dump(result_copy, f, indent=2, ensure_ascii=False)
                    
                    return result
                else:
                    print(f"❌ Generation failed: {result.get('error', 'Unknown error')}")
                    return {}
            else:
                print(f"❌ API request failed: {response.status_code}")
                return {}
                
        except Exception as e:
            print(f"❌ Generation test error: {e}")
            return {}
    
    def run_test_suite(self):
        """Executa suite completa de testes"""
        print("\n🚀 Starting Stadium System Test Suite")
        print("=" * 50)
        
        # 1. Health Check
        if not self.test_health_check():
            print("❌ API not available. Make sure to start the server first:")
            print("   python api/stadium_vision_dalle3.py")
            return
        
        # 2. Testes com imagens de exemplo
        test_cases = [
            {
                "name": "maracana_test",
                "description": "Maracanã Stadium Test",
                "image_path": "test_images/maracana.jpg",  # Você precisa colocar esta imagem
                "params": {
                    "generation_style": "cinematic",
                    "atmosphere": "packed",
                    "time_of_day": "night",
                    "weather": "clear"
                }
            },
            {
                "name": "allianz_test",
                "description": "Allianz Parque Test",
                "image_path": "test_images/allianz.jpg",  # Você precisa colocar esta imagem
                "params": {
                    "generation_style": "realistic",
                    "atmosphere": "packed",
                    "time_of_day": "day",
                    "weather": "clear"
                }
            },
            {
                "name": "generic_stadium_test",
                "description": "Generic Stadium Test",
                "image_path": "test_images/stadium.jpg",  # Qualquer imagem de estádio
                "params": {
                    "generation_style": "dramatic",
                    "atmosphere": "half_full",
                    "time_of_day": "sunset",
                    "weather": "dramatic"
                }
            }
        ]
        
        total_cost = 0
        successful_tests = 0
        
        for test_case in test_cases:
            print(f"\n{'='*60}")
            print(f"🏟️ TEST: {test_case['description']}")
            print(f"{'='*60}")
            
            # Verifica se a imagem existe
            if not os.path.exists(test_case['image_path']):
                print(f"⚠️ Test image not found: {test_case['image_path']}")
                print("   Please add test stadium images to run this test")
                continue
            
            # Carrega imagem
            image_base64 = self.load_test_image(test_case['image_path'])
            if not image_base64:
                continue
            
            # Teste 1: Apenas análise
            print(f"\n--- Phase 1: Analysis Only ---")
            analysis_result = self.test_analysis_only(image_base64, f"{test_case['name']}_analysis")
            
            if analysis_result.get("success"):
                total_cost += analysis_result.get("cost_usd", 0)
                
                # Mostra alguns resultados da análise
                if analysis_result.get("analysis"):
                    analysis = analysis_result["analysis"]
                    print(f"📊 Analysis Preview:")
                    
                    if analysis.get("architecture"):
                        arch = analysis["architecture"]
                        print(f"   Style: {arch.get('style', 'N/A')}")
                        print(f"   Features: {arch.get('distinctive_features', 'N/A')[:50]}...")
                    
                    if analysis.get("atmosphere"):
                        atm = analysis["atmosphere"]
                        print(f"   Time: {atm.get('time_of_day', 'N/A')}")
                        print(f"   Crowd: {atm.get('crowd_density', 'N/A')}")
            
            # Teste 2: Geração completa
            print(f"\n--- Phase 2: Full Generation ---")
            generation_result = self.test_full_generation(
                image_base64, 
                test_case['name'], 
                test_case['params']
            )
            
            if generation_result.get("success"):
                total_cost += generation_result.get("cost_usd", 0)
                successful_tests += 1
                print(f"🎉 Test '{test_case['name']}' completed successfully!")
            else:
                print(f"💥 Test '{test_case['name']}' failed")
        
        # Resumo final
        print(f"\n{'='*60}")
        print(f"📊 TEST SUITE SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Successful tests: {successful_tests}/{len(test_cases)}")
        print(f"💰 Total cost: ${total_cost:.3f}")
        print(f"📁 Results saved in: {self.test_results_dir}")
        
        if successful_tests > 0:
            print(f"\n🎯 Next steps:")
            print(f"1. Check generated images in {self.test_results_dir}")
            print(f"2. Review analysis results in JSON files")
            print(f"3. Test the frontend integration")
            print(f"4. Add more test stadium images")
        
        return successful_tests > 0

def main():
    """Função principal"""
    tester = StadiumSystemTester()
    
    # Verifica variáveis de ambiente
    required_env_vars = ['OPENROUTER_API_KEY', 'OPENAI_API_KEY']
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set them in your .env file")
        return
    
    # Cria diretório de imagens de teste se não existir
    test_images_dir = Path("test_images")
    test_images_dir.mkdir(exist_ok=True)
    
    if not any(test_images_dir.glob("*.jpg")) and not any(test_images_dir.glob("*.png")):
        print("⚠️ No test images found in test_images/ directory")
        print("Please add some stadium images (jpg/png) to test_images/ folder")
        print("Recommended images:")
        print("  - maracana.jpg (Maracanã stadium)")
        print("  - allianz.jpg (Allianz Parque)")
        print("  - stadium.jpg (any stadium image)")
        return
    
    # Executa testes
    success = tester.run_test_suite()
    
    if success:
        print("\n🎉 Stadium system is working correctly!")
    else:
        print("\n💥 Some tests failed. Check the logs above.")

if __name__ == "__main__":
    main() 