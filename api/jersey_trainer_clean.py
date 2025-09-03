#!/usr/bin/env python3
"""
Jersey Trainer Clean - Apenas Imagens de Referência de Alta Qualidade
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

class CleanJerseyDataset(Dataset):
    """Dataset limpo com apenas referências de alta qualidade"""
    
    def __init__(self, metadata_path, base_dir, tokenizer, size=512):
        self.base_dir = Path(base_dir)
        self.size = size
        self.tokenizer = tokenizer
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        print(f"📊 Dataset limpo carregado: {len(self.metadata)} imagens de alta qualidade")
        
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        item = self.metadata[idx]
        
        # Carrega imagem
        image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
        image = Image.open(image_path).convert('RGB')
        image = image.resize((self.size, self.size), Image.LANCZOS)
        image = np.array(image).astype(np.float32) / 255.0
        image = (image - 0.5) / 0.5
        image = torch.from_numpy(image).permute(2, 0, 1)
        
        # Usa prompt detalhado DALL-E 3 style
        prompt = item['detailed_prompt']
        
        # Tokeniza
        text_inputs = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=77,
            truncation=True,
            return_tensors="pt"
        )
        
        return {
            "pixel_values": image,
            "input_ids": text_inputs.input_ids.flatten(),
            "prompt": prompt,
            "team": item['team_name']
        }

class CleanJerseyTrainer:
    """Trainer otimizado para dataset limpo"""
    
    def __init__(self, config):
        self.config = config
        self.load_pipeline()
        self.setup_lora()
        self.setup_dataset()
        
    def load_pipeline(self):
        """Carrega pipeline com otimizações"""
        print("🔄 Carregando pipeline Stable Diffusion...")
        
        # Limpa memória
        torch.cuda.empty_cache()
        gc.collect()
        
        # Carrega pipeline
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
            
            # Otimizações
            self.pipe.vae.requires_grad_(False)
            self.pipe.text_encoder.requires_grad_(False)
            self.pipe.unet.enable_gradient_checkpointing()
            
            print("✅ Pipeline carregado na GPU")
        else:
            print("⚠️ Usando CPU")
            
    def setup_lora(self):
        """Configura LoRA para dataset limpo"""
        print("🔧 Configurando LoRA para alta qualidade...")
        
        lora_config = LoraConfig(
            r=self.config.lora_rank,
            lora_alpha=self.config.lora_alpha,
            target_modules=[
                "to_k", "to_q", "to_v", "to_out.0"
            ],
            lora_dropout=0.1,
            bias="none",
        )
        
        self.pipe.unet = get_peft_model(self.pipe.unet, lora_config)
        self.pipe.unet.print_trainable_parameters()
        
        print("✅ LoRA configurado para alta qualidade")
        
    def setup_dataset(self):
        """Configura dataset limpo"""
        print("📊 Configurando dataset limpo...")
        
        dataset = CleanJerseyDataset(
            metadata_path=self.config.metadata_path,
            base_dir=self.config.dataset_dir,
            tokenizer=self.pipe.tokenizer,
            size=self.config.resolution
        )
        
        self.dataloader = DataLoader(
            dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=0
        )
        
        print(f"✅ Dataset limpo configurado: {len(dataset)} amostras de alta qualidade")
        
    def compute_loss(self, batch):
        """Calcula loss"""
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
        """Treinamento focado em qualidade"""
        print("🚀 Iniciando treinamento com dataset limpo...")
        
        optimizer = torch.optim.AdamW(
            self.pipe.unet.parameters(),
            lr=self.config.learning_rate,
            weight_decay=0.01
        )
        
        # Learning rate scheduler
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=self.config.num_epochs
        )
        
        best_loss = float('inf')
        
        for epoch in range(self.config.num_epochs):
            print(f"\n📈 Época {epoch + 1}/{self.config.num_epochs}")
            
            epoch_loss = 0
            progress_bar = tqdm(self.dataloader, desc=f"Época {epoch + 1}")
            
            for step, batch in enumerate(progress_bar):
                # Forward pass
                loss = self.compute_loss(batch)
                
                # Backward pass
                loss.backward()
                
                # Update
                if (step + 1) % self.config.gradient_accumulation_steps == 0:
                    optimizer.step()
                    optimizer.zero_grad()
                    
                    # Limpa cache
                    torch.cuda.empty_cache()
                
                epoch_loss += loss.item()
                
                progress_bar.set_postfix({
                    "loss": f"{loss.item():.4f}",
                    "avg_loss": f"{epoch_loss / (step + 1):.4f}",
                    "lr": f"{scheduler.get_last_lr()[0]:.2e}"
                })
                
            avg_loss = epoch_loss / len(self.dataloader)
            scheduler.step()
            
            # Salva melhor modelo
            if avg_loss < best_loss:
                best_loss = avg_loss
                self.save_checkpoint(epoch, avg_loss, is_best=True)
                print(f"🏆 Novo melhor modelo salvo! Loss: {avg_loss:.4f}")
            
            print(f"✅ Época {epoch + 1} concluída - Loss: {avg_loss:.4f}")
            
        print("🎉 Treinamento limpo concluído!")
        self.save_model()
        
    def save_checkpoint(self, epoch, loss, is_best=False):
        """Salva checkpoint"""
        save_path = Path(self.config.output_dir) / "checkpoints"
        save_path.mkdir(parents=True, exist_ok=True)
        
        if is_best:
            checkpoint_path = save_path / "best_model"
            self.pipe.unet.save_pretrained(checkpoint_path)
        
    def save_model(self):
        """Salva modelo final"""
        save_path = Path(self.config.output_dir) / "clean_model"
        save_path.mkdir(parents=True, exist_ok=True)
        
        try:
            self.pipe.unet.save_pretrained(save_path)
            print(f"🎯 Modelo limpo salvo: {save_path}")
            
            # Salva info do treinamento
            info = {
                "model_type": "clean_jersey_lora",
                "dataset_size": len(self.dataloader.dataset),
                "epochs": self.config.num_epochs,
                "resolution": self.config.resolution,
                "quality": "high",
                "source": "user_reference_only"
            }
            
            with open(save_path / "training_info.json", 'w') as f:
                json.dump(info, f, indent=2)
                
        except Exception as e:
            print(f"⚠️ Erro ao salvar: {e}")

class CleanTrainingConfig:
    """Configurações para dataset limpo"""
    def __init__(self):
        self.dataset_dir = "dataset_clean"
        self.metadata_path = "dataset_clean/metadata_clean.json"
        self.output_dir = "jersey_lora_clean"
        self.resolution = 512  # Resolução maior para qualidade
        self.batch_size = 1
        self.num_epochs = 15   # Mais épocas para dataset menor
        self.learning_rate = 5e-5  # Learning rate menor
        self.gradient_accumulation_steps = 8
        self.lora_rank = 32
        self.lora_alpha = 64

def main():
    """Função principal"""
    print("🏈 Jersey AI Trainer Clean - Alta Qualidade")
    print("=" * 50)
    
    config = CleanTrainingConfig()
    
    if not os.path.exists(config.metadata_path):
        print("❌ Dataset limpo não encontrado!")
        print("Execute primeiro: python create_clean_dataset.py")
        return
    
    # Limpa memória
    torch.cuda.empty_cache()
    gc.collect()
    
    trainer = CleanJerseyTrainer(config)
    trainer.train()
    
    print("\n🎉 Treinamento limpo concluído!")
    print("Para testar: python test_clean_model.py")

if __name__ == "__main__":
    main() 