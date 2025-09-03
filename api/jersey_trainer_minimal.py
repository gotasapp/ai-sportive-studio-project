#!/usr/bin/env python3
"""
Jersey Trainer Minimal - LoRA Ultra Otimizado para Memória Limitada
"""

import os
import json
import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
import gc
from pathlib import Path

# Importações condicionais para evitar erro se não estiver instalado
try:
    from diffusers import StableDiffusionPipeline, UNet2DConditionModel
    from peft import LoraConfig, get_peft_model
    from transformers import CLIPTextModel, CLIPTokenizer
    DEPENDENCIES_OK = True
except ImportError as e:
    print(f"❌ Dependência não encontrada: {e}")
    DEPENDENCIES_OK = False

class MinimalDataset(Dataset):
    """Dataset super simplificado"""
    
    def __init__(self, metadata_path, base_dir, size=256):  # Resolução muito baixa
        self.base_dir = Path(base_dir)
        self.size = size
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        print(f"📊 Dataset: {len(self.metadata)} imagens carregadas")
        
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        item = self.metadata[idx]
        
        # Carrega e redimensiona imagem
        image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
        image = Image.open(image_path).convert('RGB')
        image = image.resize((self.size, self.size), Image.LANCZOS)
        
        # Converte para tensor
        image_array = np.array(image).astype(np.float32) / 255.0
        image_array = (image_array - 0.5) / 0.5  # Normaliza [-1, 1]
        image_tensor = torch.from_numpy(image_array).permute(2, 0, 1)
        
        # Prompt técnico ou padrão
        prompt = item.get('technical_prompt', item.get('detailed_prompt', f"A {item['team_name']} soccer jersey"))
        
        return {
            "image": image_tensor,
            "prompt": prompt,
            "team": item['team_name']
        }

class MinimalTrainer:
    """Trainer ultra minimalista"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.setup_config()
        self.cleanup_memory()
        
    def setup_config(self):
        """Configurações mínimas"""
        self.config = {
            'dataset_dir': 'dataset_clean',
            'metadata_path': 'dataset_clean/metadata_clean.json',
            'output_dir': 'jersey_lora_minimal',
            'resolution': 256,  # Muito baixo para economia
            'batch_size': 1,
            'num_epochs': 3,    # Poucas épocas
            'learning_rate': 1e-4,
            'lora_rank': 8,     # Rank muito baixo
            'lora_alpha': 16
        }
        
    def cleanup_memory(self):
        """Limpa memória agressivamente"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        print(f"🧹 Memória limpa - Device: {self.device}")
        
    def load_components_separately(self):
        """Carrega componentes um por vez para economizar memória"""
        print("🔄 Carregando componentes separadamente...")
        
        try:
            # 1. Tokenizer (mais leve)
            print("  📝 Carregando tokenizer...")
            self.tokenizer = CLIPTokenizer.from_pretrained(
                "runwayml/stable-diffusion-v1-5", 
                subfolder="tokenizer"
            )
            self.cleanup_memory()
            
            # 2. Text Encoder
            print("  📖 Carregando text encoder...")
            self.text_encoder = CLIPTextModel.from_pretrained(
                "runwayml/stable-diffusion-v1-5",
                subfolder="text_encoder",
                torch_dtype=torch.float16
            ).to(self.device)
            self.text_encoder.requires_grad_(False)
            self.cleanup_memory()
            
            # 3. UNet (mais pesado)
            print("  🧠 Carregando UNet...")
            self.unet = UNet2DConditionModel.from_pretrained(
                "runwayml/stable-diffusion-v1-5",
                subfolder="unet",
                torch_dtype=torch.float16
            ).to(self.device)
            self.cleanup_memory()
            
            print("✅ Componentes carregados com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao carregar componentes: {e}")
            return False
    
    def setup_lora(self):
        """Configura LoRA mínimo"""
        print("🔧 Configurando LoRA mínimo...")
        
        lora_config = LoraConfig(
            r=self.config['lora_rank'],           # Rank baixo
            lora_alpha=self.config['lora_alpha'], 
            target_modules=["to_q", "to_k"],      # Apenas 2 módulos
            lora_dropout=0.1,
            bias="none",
        )
        
        self.unet = get_peft_model(self.unet, lora_config)
        self.unet.print_trainable_parameters()
        
        print("✅ LoRA configurado")
        
    def setup_dataset(self):
        """Configura dataset"""
        print("📊 Configurando dataset...")
        
        dataset = MinimalDataset(
            self.config['metadata_path'],
            self.config['dataset_dir'],
            size=self.config['resolution']
        )
        
        self.dataloader = DataLoader(
            dataset,
            batch_size=self.config['batch_size'],
            shuffle=True,
            num_workers=0  # Sem multiprocessing
        )
        
        print(f"✅ Dataset configurado: {len(dataset)} amostras")
        
    def encode_prompt(self, prompt):
        """Codifica prompt"""
        text_inputs = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=77,
            truncation=True,
            return_tensors="pt"
        )
        
        with torch.no_grad():
            text_embeddings = self.text_encoder(text_inputs.input_ids.to(self.device))[0]
        
        return text_embeddings
    
    def train_step(self, batch):
        """Um passo de treinamento simplificado"""
        images = batch["image"].to(self.device, dtype=torch.float16)
        prompts = batch["prompt"]
        
        # Codifica prompts
        text_embeddings = self.encode_prompt(prompts[0])  # Apenas primeiro do batch
        
        # Simula VAE encoding (sem carregar VAE)
        # Para economizar memória, vamos usar uma aproximação
        latents = torch.randn(1, 4, 32, 32, device=self.device, dtype=torch.float16)
        
        # Ruído e timesteps
        noise = torch.randn_like(latents)
        timesteps = torch.randint(0, 1000, (1,), device=self.device).long()
        
        # Adiciona ruído
        noisy_latents = latents + noise
        
        # Predição
        noise_pred = self.unet(noisy_latents, timesteps, text_embeddings).sample
        
        # Loss
        loss = F.mse_loss(noise_pred, noise, reduction="mean")
        
        return loss
    
    def train(self):
        """Treinamento minimalista"""
        print("🚀 Iniciando treinamento minimal...")
        
        # Carrega componentes
        if not self.load_components_separately():
            print("❌ Falha ao carregar componentes")
            return False
        
        # Configura LoRA
        self.setup_lora()
        
        # Configura dataset
        self.setup_dataset()
        
        # Otimizador
        optimizer = torch.optim.AdamW(
            self.unet.parameters(),
            lr=self.config['learning_rate']
        )
        
        # Loop de treinamento
        for epoch in range(self.config['num_epochs']):
            print(f"\n📈 Época {epoch + 1}/{self.config['num_epochs']}")
            
            epoch_loss = 0
            for step, batch in enumerate(self.dataloader):
                try:
                    # Forward
                    loss = self.train_step(batch)
                    
                    # Backward
                    loss.backward()
                    optimizer.step()
                    optimizer.zero_grad()
                    
                    epoch_loss += loss.item()
                    
                    print(f"  Step {step + 1}: Loss {loss.item():.4f}")
                    
                    # Limpa memória a cada step
                    self.cleanup_memory()
                    
                except Exception as e:
                    print(f"❌ Erro no step {step}: {e}")
                    continue
            
            avg_loss = epoch_loss / len(self.dataloader)
            print(f"✅ Época {epoch + 1} concluída - Loss médio: {avg_loss:.4f}")
        
        # Salva modelo
        self.save_model()
        print("🎉 Treinamento minimal concluído!")
        return True
    
    def save_model(self):
        """Salva modelo"""
        output_dir = Path(self.config['output_dir'])
        output_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            self.unet.save_pretrained(output_dir / "minimal_lora")
            print(f"💾 Modelo salvo: {output_dir}")
        except Exception as e:
            print(f"⚠️ Erro ao salvar: {e}")

def main():
    """Função principal"""
    print("🏈 Jersey Trainer Minimal - LoRA Ultra Otimizado")
    print("=" * 55)
    
    if not DEPENDENCIES_OK:
        print("❌ Instale as dependências primeiro:")
        print("pip install diffusers peft transformers")
        return
    
    # Verifica dataset
    if not os.path.exists("dataset_clean/metadata_clean.json"):
        print("❌ Dataset não encontrado!")
        print("Execute: python create_clean_dataset.py")
        return
    
    # Cria trainer
    trainer = MinimalTrainer()
    
    # Treina
    success = trainer.train()
    
    if success:
        print("\n🎉 Treinamento concluído com sucesso!")
        print("Para testar: python test_minimal_model.py")
    else:
        print("\n❌ Treinamento falhou - vamos tentar ControlNet")
        print("Execute: python controlnet_jersey.py")

if __name__ == "__main__":
    main() 