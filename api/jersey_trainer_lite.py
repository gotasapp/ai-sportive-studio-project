#!/usr/bin/env python3
"""
Jersey Trainer Lite - Versão Otimizada para Memória Limitada
"""

import os
import json
import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
from diffusers import StableDiffusionPipeline
from peft import LoraConfig, get_peft_model
from tqdm import tqdm
from pathlib import Path
import gc

class LiteJerseyDataset(Dataset):
    """Dataset simplificado"""
    
    def __init__(self, metadata_path, base_dir, tokenizer, size=256):  # Resolução menor
        self.base_dir = Path(base_dir)
        self.size = size
        self.tokenizer = tokenizer
        
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
        image = image.resize((self.size, self.size), Image.LANCZOS)
        image = np.array(image).astype(np.float32) / 255.0
        image = (image - 0.5) / 0.5
        image = torch.from_numpy(image).permute(2, 0, 1)
        
        # Prompt simplificado
        if 'detailed_prompt' in item:
            prompt = item['detailed_prompt']
        else:
            prompt = f"A hyper-realistic {item['team_name']} soccer jersey, back view, premium fabric texture, 4K quality"
        
        # Tokeniza
        text_inputs = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=77,  # Limite menor
            truncation=True,
            return_tensors="pt"
        )
        
        return {
            "pixel_values": image,
            "input_ids": text_inputs.input_ids.flatten(),
            "prompt": prompt
        }

class LiteJerseyTrainer:
    """Trainer otimizado para memória"""
    
    def __init__(self, config):
        self.config = config
        self.load_pipeline()
        self.setup_lora()
        self.setup_dataset()
        
    def load_pipeline(self):
        """Carrega pipeline completo de uma vez"""
        print("🔄 Carregando pipeline Stable Diffusion...")
        
        # Limpa memória primeiro
        torch.cuda.empty_cache()
        gc.collect()
        
        # Carrega pipeline completo
        self.pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16,
            safety_checker=None,
            requires_safety_checker=False,
            low_cpu_mem_usage=True,
            use_safetensors=True
        )
        
        if torch.cuda.is_available():
            self.pipe = self.pipe.to("cuda")
            
            # Otimizações de memória
            self.pipe.vae.requires_grad_(False)
            self.pipe.text_encoder.requires_grad_(False)
            self.pipe.unet.enable_gradient_checkpointing()
            
            print("✅ Pipeline carregado na GPU")
        else:
            print("⚠️ Usando CPU")
            
    def setup_lora(self):
        """Configura LoRA simplificado"""
        print("🔧 Configurando LoRA...")
        
        lora_config = LoraConfig(
            r=16,  # Rank menor para economizar memória
            lora_alpha=32,
            target_modules=[
                "to_k", "to_q", "to_v", "to_out.0"
            ],
            lora_dropout=0.1,
            bias="none",
        )
        
        self.pipe.unet = get_peft_model(self.pipe.unet, lora_config)
        self.pipe.unet.print_trainable_parameters()
        
        print("✅ LoRA configurado")
        
    def setup_dataset(self):
        """Configura dataset"""
        print("📊 Configurando dataset...")
        
        dataset = LiteJerseyDataset(
            metadata_path=self.config.metadata_path,
            base_dir=self.config.dataset_dir,
            tokenizer=self.pipe.tokenizer,
            size=self.config.resolution
        )
        
        self.dataloader = DataLoader(
            dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=0  # Sem multiprocessing
        )
        
        print(f"✅ Dataset configurado: {len(dataset)} amostras")
        
    def compute_loss(self, batch):
        """Calcula loss simplificado"""
        pixel_values = batch["pixel_values"]
        input_ids = batch["input_ids"]
        
        # Encode text
        encoder_hidden_states = self.pipe.text_encoder(input_ids)[0]
        
        # Encode images
        with torch.no_grad():
            latents = self.pipe.vae.encode(pixel_values).latent_dist.sample()
            latents = latents * self.pipe.vae.config.scaling_factor
        
        # Sample noise e timesteps
        noise = torch.randn_like(latents)
        timesteps = torch.randint(
            0, self.pipe.scheduler.config.num_train_timesteps,
            (latents.shape[0],), device=latents.device
        ).long()
        
        # Add noise
        noisy_latents = self.pipe.scheduler.add_noise(latents, noise, timesteps)
        
        # Predict noise
        noise_pred = self.pipe.unet(
            noisy_latents, timesteps, encoder_hidden_states
        ).sample
        
        # Loss
        loss = F.mse_loss(noise_pred, noise, reduction="mean")
        
        return loss
        
    def train(self):
        """Treinamento simplificado"""
        print("🚀 Iniciando treinamento lite...")
        
        optimizer = torch.optim.AdamW(
            self.pipe.unet.parameters(),
            lr=self.config.learning_rate,
            weight_decay=0.01
        )
        
        for epoch in range(self.config.num_epochs):
            print(f"\n📈 Época {epoch + 1}/{self.config.num_epochs}")
            
            epoch_loss = 0
            progress_bar = tqdm(self.dataloader, desc=f"Época {epoch + 1}")
            
            for step, batch in enumerate(progress_bar):
                # Forward pass
                loss = self.compute_loss(batch)
                
                # Backward pass
                loss.backward()
                
                # Update a cada gradient_accumulation_steps
                if (step + 1) % self.config.gradient_accumulation_steps == 0:
                    optimizer.step()
                    optimizer.zero_grad()
                    
                    # Limpa cache
                    torch.cuda.empty_cache()
                
                epoch_loss += loss.item()
                
                progress_bar.set_postfix({
                    "loss": f"{loss.item():.4f}",
                    "avg_loss": f"{epoch_loss / (step + 1):.4f}"
                })
                
            print(f"✅ Época {epoch + 1} concluída - Loss: {epoch_loss / len(self.dataloader):.4f}")
            
        print("🎉 Treinamento concluído!")
        self.save_model()
        
    def save_model(self):
        """Salva modelo"""
        save_path = Path(self.config.output_dir) / "lite_model"
        save_path.mkdir(parents=True, exist_ok=True)
        
        try:
            self.pipe.unet.save_pretrained(save_path)
            print(f"🎯 Modelo lite salvo: {save_path}")
        except Exception as e:
            print(f"⚠️ Erro ao salvar: {e}")

class LiteTrainingConfig:
    """Configurações otimizadas"""
    def __init__(self):
        self.dataset_dir = "dataset_improved"
        self.metadata_path = "dataset_improved/metadata_improved.json"
        self.output_dir = "jersey_lora_lite"
        self.resolution = 256  # Resolução menor
        self.batch_size = 1
        self.num_epochs = 8  # Menos épocas
        self.learning_rate = 1e-4
        self.gradient_accumulation_steps = 4

def main():
    """Função principal"""
    print("🏈 Jersey AI Trainer Lite - Otimizado para Memória")
    print("=" * 55)
    
    config = LiteTrainingConfig()
    
    if not os.path.exists(config.metadata_path):
        print("❌ Dataset não encontrado!")
        print("Execute: python improve_dataset.py")
        return
    
    # Limpa memória antes de começar
    torch.cuda.empty_cache()
    gc.collect()
    
    trainer = LiteJerseyTrainer(config)
    trainer.train()
    
    print("\n🎉 Treinamento lite concluído!")
    print("Para testar: python test_lite_model.py")

if __name__ == "__main__":
    main() 