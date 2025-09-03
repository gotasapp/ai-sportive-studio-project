#!/usr/bin/env python3
"""
Jersey Trainer via API - Usa servidor existente para "treinar"
"""

import os
import json
import requests
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from pathlib import Path
import time
from tqdm import tqdm

class APIJerseyTrainer:
    """Trainer que usa API para simular treinamento"""
    
    def __init__(self, config):
        self.config = config
        self.server_url = "http://localhost:8000"
        self.check_server()
        self.load_dataset()
        
    def check_server(self):
        """Verifica se servidor está rodando"""
        try:
            response = requests.get(f"{self.server_url}/health")
            if response.status_code == 200:
                print("✅ Servidor AI detectado e funcionando")
                return True
        except:
            pass
            
        print("❌ Servidor AI não está rodando!")
        print("Execute em outro terminal: python main.py")
        exit(1)
        
    def load_dataset(self):
        """Carrega dataset limpo"""
        print("📊 Carregando dataset limpo...")
        
        if not os.path.exists(self.config.metadata_path):
            print("❌ Dataset limpo não encontrado!")
            print("Execute primeiro: python create_clean_dataset.py")
            exit(1)
            
        with open(self.config.metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        print(f"✅ Dataset carregado: {len(self.metadata)} imagens de referência")
        
    def generate_variations(self, base_prompt, num_variations=5):
        """Gera variações de um prompt"""
        variations = []
        
        # Variações de parâmetros
        configs = [
            {"steps": 20, "guidance": 7.5},
            {"steps": 25, "guidance": 8.0},
            {"steps": 30, "guidance": 7.0},
            {"steps": 20, "guidance": 9.0},
            {"steps": 35, "guidance": 7.5}
        ]
        
        for i, config in enumerate(configs[:num_variations]):
            try:
                response = requests.post(
                    f"{self.server_url}/generate-image",
                    json={
                        "prompt": base_prompt,
                        "num_inference_steps": config["steps"],
                        "guidance_scale": config["guidance"]
                    },
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    variations.append({
                        "image_base64": data["image"],
                        "config": config,
                        "variation_id": i + 1
                    })
                    print(f"  ✅ Variação {i+1}/{num_variations} gerada")
                else:
                    print(f"  ❌ Erro na variação {i+1}: {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Erro na variação {i+1}: {e}")
                
            # Pausa entre gerações
            time.sleep(2)
            
        return variations
    
    def evaluate_quality(self, original_image, generated_base64):
        """Avalia qualidade da imagem gerada"""
        try:
            # Decodifica imagem gerada
            image_data = base64.b64decode(generated_base64)
            generated_image = Image.open(BytesIO(image_data)).convert('RGB')
            
            # Redimensiona para comparação
            size = (256, 256)
            original_resized = original_image.resize(size, Image.LANCZOS)
            generated_resized = generated_image.resize(size, Image.LANCZOS)
            
            # Converte para arrays
            orig_array = np.array(original_resized).astype(np.float32) / 255.0
            gen_array = np.array(generated_resized).astype(np.float32) / 255.0
            
            # Métricas de qualidade
            mse = np.mean((orig_array - gen_array) ** 2)
            
            # Análise de cores dominantes
            orig_colors = self.get_dominant_colors(original_resized)
            gen_colors = self.get_dominant_colors(generated_resized)
            color_similarity = self.compare_colors(orig_colors, gen_colors)
            
            # Score combinado (menor é melhor para MSE, maior é melhor para cor)
            quality_score = mse - (color_similarity * 0.1)
            
            return {
                "mse": float(mse),
                "color_similarity": float(color_similarity),
                "quality_score": float(quality_score),
                "generated_image": generated_image
            }
            
        except Exception as e:
            print(f"Erro na avaliação: {e}")
            return None
    
    def get_dominant_colors(self, image, k=3):
        """Extrai cores dominantes"""
        from sklearn.cluster import KMeans
        
        # Converte para array
        data = np.array(image).reshape(-1, 3)
        
        # K-means clustering
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(data)
        
        return kmeans.cluster_centers_
    
    def compare_colors(self, colors1, colors2):
        """Compara similaridade de cores"""
        # Calcula distância mínima entre cores
        min_distances = []
        
        for c1 in colors1:
            distances = [np.linalg.norm(c1 - c2) for c2 in colors2]
            min_distances.append(min(distances))
            
        # Similaridade (inverso da distância média)
        avg_distance = np.mean(min_distances)
        similarity = 1.0 / (1.0 + avg_distance / 255.0)
        
        return similarity
    
    def train_iteration(self):
        """Simula treinamento gerando variações"""
        print("🚀 Iniciando 'treinamento' via API...")
        print("Gerando múltiplas variações para cada referência...")
        
        results = []
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        for item_idx, item in enumerate(self.metadata):
            print(f"\n📊 Processando {item_idx+1}/{len(self.metadata)}: {item['team_name']}")
            
            # Carrega imagem original
            image_path = Path(self.config.dataset_dir) / "jerseys" / item['type'] / item['filename']
            original_image = Image.open(image_path).convert('RGB')
            
            # Gera variações
            print("🎨 Gerando variações...")
            variations = self.generate_variations(item['detailed_prompt'], num_variations=5)
            
            # Avalia cada variação
            team_results = []
            for var_idx, variation in enumerate(variations):
                print(f"  📈 Avaliando variação {var_idx+1}...")
                
                quality = self.evaluate_quality(original_image, variation['image_base64'])
                
                if quality:
                    # Salva imagem
                    filename = f"{item['team_name'].replace(' ', '_')}_var_{var_idx+1}.png"
                    quality['generated_image'].save(output_dir / filename)
                    
                    result = {
                        "team": item['team_name'],
                        "variation_id": var_idx + 1,
                        "filename": filename,
                        "config": variation['config'],
                        "mse": quality['mse'],
                        "color_similarity": quality['color_similarity'],
                        "quality_score": quality['quality_score']
                    }
                    
                    team_results.append(result)
                    print(f"    ✅ MSE: {quality['mse']:.4f}, Cor: {quality['color_similarity']:.3f}")
            
            # Encontra melhor variação para este time
            if team_results:
                best_variation = min(team_results, key=lambda x: x['quality_score'])
                best_variation['is_best'] = True
                results.extend(team_results)
                
                print(f"  🏆 Melhor variação: {best_variation['variation_id']} (Score: {best_variation['quality_score']:.4f})")
        
        # Salva relatório completo
        self.save_training_report(results)
        
    def save_training_report(self, results):
        """Salva relatório de 'treinamento'"""
        report_path = Path(self.config.output_dir) / "training_report.json"
        
        # Organiza resultados por time
        teams = {}
        for result in results:
            team = result['team']
            if team not in teams:
                teams[team] = []
            teams[team].append(result)
        
        # Encontra melhor configuração geral
        best_configs = {}
        for team, team_results in teams.items():
            best = min(team_results, key=lambda x: x['quality_score'])
            best_configs[team] = best
        
        # Relatório final
        report = {
            "training_summary": {
                "total_teams": len(teams),
                "total_variations": len(results),
                "best_overall_score": min(r['quality_score'] for r in results),
                "average_mse": sum(r['mse'] for r in results) / len(results),
                "average_color_similarity": sum(r['color_similarity'] for r in results) / len(results)
            },
            "best_configurations": best_configs,
            "all_results": results,
            "recommended_settings": self.get_recommended_settings(results)
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
            
        print(f"\n📊 Relatório de treinamento salvo: {report_path}")
        
        # Mostra resumo
        print(f"\n🎯 Resumo do 'Treinamento':")
        print(f"   📈 Times processados: {len(teams)}")
        print(f"   🎨 Variações geradas: {len(results)}")
        print(f"   🏆 Melhor score geral: {report['training_summary']['best_overall_score']:.4f}")
        
        for team, best in best_configs.items():
            print(f"   ✅ {team}: Steps={best['config']['steps']}, Guidance={best['config']['guidance']}")
    
    def get_recommended_settings(self, results):
        """Analisa melhores configurações"""
        # Agrupa por configuração
        config_performance = {}
        
        for result in results:
            config_key = f"steps_{result['config']['steps']}_guidance_{result['config']['guidance']}"
            if config_key not in config_performance:
                config_performance[config_key] = []
            config_performance[config_key].append(result['quality_score'])
        
        # Calcula média por configuração
        config_averages = {}
        for config, scores in config_performance.items():
            config_averages[config] = sum(scores) / len(scores)
        
        # Melhor configuração
        best_config = min(config_averages.items(), key=lambda x: x[1])
        
        return {
            "best_config": best_config[0],
            "best_average_score": best_config[1],
            "all_config_averages": config_averages
        }

class APITrainingConfig:
    """Configurações para treinamento via API"""
    def __init__(self):
        self.dataset_dir = "dataset_clean"
        self.metadata_path = "dataset_clean/metadata_clean.json"
        self.output_dir = "api_training_results"

def main():
    """Função principal"""
    print("🏈 Jersey AI Trainer via API - Otimização de Parâmetros")
    print("=" * 60)
    
    # Instala sklearn se necessário
    try:
        from sklearn.cluster import KMeans
    except ImportError:
        print("📦 Instalando scikit-learn...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "scikit-learn"])
        print("✅ scikit-learn instalado!")
    
    config = APITrainingConfig()
    trainer = APIJerseyTrainer(config)
    trainer.train_iteration()
    
    print("\n🎉 'Treinamento' via API concluído!")
    print("Verifique a pasta 'api_training_results' para os resultados.")

if __name__ == "__main__":
    main() 