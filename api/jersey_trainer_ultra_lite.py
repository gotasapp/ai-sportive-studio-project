#!/usr/bin/env python3
"""
Jersey Trainer Ultra Lite - Usa modelo já carregado
"""

import os
import json
import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
import requests
import base64
from io import BytesIO
from pathlib import Path
import time

class UltraLiteJerseyDataset(Dataset):
    """Dataset ultra simplificado"""
    
    def __init__(self, metadata_path, base_dir):
        self.base_dir = Path(base_dir)
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        # Filtra apenas jerseys que existem
        self.valid_metadata = []
        for item in self.metadata:
            image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
            if image_path.exists():
                self.valid_metadata.append(item)
                
        print(f"Dataset carregado: {len(self.valid_metadata)} jerseys")
        
    def __len__(self):
        return len(self.valid_metadata)
    
    def __getitem__(self, idx):
        item = self.valid_metadata[idx]
        
        # Carrega imagem
        image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
        image = Image.open(image_path).convert('RGB')
        
        # Prompt detalhado
        if 'detailed_prompt' in item:
            prompt = item['detailed_prompt']
        else:
            prompt = f"A hyper-realistic {item['team_name']} soccer jersey, back view, premium fabric texture, 4K quality"
        
        return {
            "image": image,
            "prompt": prompt,
            "team": item['team_name']
        }

class UltraLiteTrainer:
    """Trainer que usa API do servidor"""
    
    def __init__(self, config):
        self.config = config
        self.server_url = "http://localhost:8000"
        self.setup_dataset()
        self.check_server()
        
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
        
    def setup_dataset(self):
        """Configura dataset"""
        print("📊 Configurando dataset...")
        
        self.dataset = UltraLiteJerseyDataset(
            metadata_path=self.config.metadata_path,
            base_dir=self.config.dataset_dir
        )
        
        print(f"✅ Dataset configurado: {len(self.dataset)} amostras")
        
    def generate_image(self, prompt):
        """Gera imagem via API"""
        try:
            response = requests.post(
                f"{self.server_url}/generate-image",
                json={
                    "prompt": prompt,
                    "num_inference_steps": 20,
                    "guidance_scale": 7.5
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["image"]  # base64
            else:
                print(f"Erro na API: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Erro ao gerar: {e}")
            return None
    
    def compare_images(self, original_image, generated_base64):
        """Compara imagem original com gerada"""
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
            
            # Calcula diferença (MSE)
            mse = np.mean((orig_array - gen_array) ** 2)
            
            return mse, generated_image
            
        except Exception as e:
            print(f"Erro na comparação: {e}")
            return float('inf'), None
    
    def train_iteration(self):
        """Uma iteração de 'treinamento' (análise)"""
        print("🚀 Iniciando análise de qualidade...")
        
        results = []
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        for i, sample in enumerate(self.dataset):
            print(f"\n📊 Analisando {i+1}/{len(self.dataset)}: {sample['team']}")
            
            # Gera imagem
            print("🎨 Gerando imagem...")
            generated_base64 = self.generate_image(sample['prompt'])
            
            if generated_base64:
                # Compara com original
                mse, generated_image = self.compare_images(
                    sample['image'], 
                    generated_base64
                )
                
                # Salva resultado
                if generated_image:
                    filename = f"analysis_{i+1}_{sample['team'].replace(' ', '_')}.png"
                    generated_image.save(output_dir / filename)
                    
                    results.append({
                        "team": sample['team'],
                        "prompt": sample['prompt'],
                        "mse": float(mse),  # Converte para float Python
                        "filename": filename
                    })
                    
                    print(f"✅ MSE: {mse:.4f} - Salvo: {filename}")
                else:
                    print("❌ Falha na comparação")
            else:
                print("❌ Falha na geração")
                
            # Pausa para não sobrecarregar
            time.sleep(2)
        
        # Salva relatório
        self.save_analysis_report(results)
        
    def save_analysis_report(self, results):
        """Salva relatório de análise"""
        report_path = Path(self.config.output_dir) / "analysis_report.json"
        
        # Ordena por qualidade (menor MSE = melhor)
        results.sort(key=lambda x: x['mse'])
        
        report = {
            "total_samples": len(results),
            "best_result": results[0] if results else None,
            "worst_result": results[-1] if results else None,
            "average_mse": float(sum(r['mse'] for r in results) / len(results)) if results else 0,
            "all_results": results
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
            
        print(f"\n📊 Relatório salvo: {report_path}")
        
        if results:
            print(f"🏆 Melhor resultado: {report['best_result']['team']} (MSE: {report['best_result']['mse']:.4f})")
            print(f"📈 MSE médio: {report['average_mse']:.4f}")

class UltraLiteConfig:
    """Configurações ultra lite"""
    def __init__(self):
        self.dataset_dir = "dataset_improved"
        self.metadata_path = "dataset_improved/metadata_improved.json"
        self.output_dir = "ultra_lite_analysis"

def main():
    """Função principal"""
    print("🏈 Jersey AI Trainer Ultra Lite - Análise via API")
    print("=" * 55)
    
    config = UltraLiteConfig()
    
    if not os.path.exists(config.metadata_path):
        print("❌ Dataset não encontrado!")
        print("Execute: python improve_dataset.py")
        return
    
    trainer = UltraLiteTrainer(config)
    trainer.train_iteration()
    
    print("\n🎉 Análise concluída!")
    print("Verifique a pasta 'ultra_lite_analysis' para os resultados.")

if __name__ == "__main__":
    main() 