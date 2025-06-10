#!/usr/bin/env python3
"""
Sistema de Treinamento LoRA para Jerseys
Fine-tuning do Stable Diffusion com dataset personalizado
"""

import os
import json
import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np
from diffusers import StableDiffusionPipeline, UNet2DConditionModel, DDPMScheduler, AutoencoderKL
from transformers import CLIPTextModel, CLIPTokenizer
from peft import LoraConfig, get_peft_model
import accelerate
from accelerate import Accelerator
from tqdm import tqdm
import argparse
from pathlib import Path

class JerseyDataset(Dataset):
    """Dataset personalizado para jerseys"""
    
    def __init__(self, metadata_path, base_dir, tokenizer, size=512):
        self.base_dir = Path(base_dir)
        self.size = size
        self.tokenizer = tokenizer
        
        # Carrega metadata
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        print(f"Dataset carregado: {len(self.metadata)} jerseys")
        
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        item = self.metadata[idx]
        
        # Carrega e processa imagem
        image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
        image = Image.open(image_path).convert('RGB')
        image = image.resize((self.size, self.size), Image.LANCZOS)
        image = np.array(image).astype(np.float32) / 255.0
        image = (image - 0.5) / 0.5  # Normaliza para [-1, 1]
        image = torch.from_numpy(image).permute(2, 0, 1)
        
        # Cria prompt baseado nos metadados
        prompt = self.create_prompt(item)
        
        # Tokeniza o prompt
        text_inputs = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=self.tokenizer.model_max_length,
            truncation=True,
            return_tensors="pt"
        )
        
        return {
            "pixel_values": image,
            "input_ids": text_inputs.input_ids.flatten(),
            "attention_mask": text_inputs.attention_mask.flatten(),
            "prompt": prompt
        }
    
    def create_prompt(self, item):
        """Cria prompt descritivo baseado nos metadados"""
        team_name = item['team_name']
        jersey_type = item['type']
        colors = item.get('team_colors', {})
        patterns = item.get('patterns', ['solid'])
        
        # Constrói prompt descritivo
        prompt_parts = [
            f"a {jersey_type} soccer jersey",
            f"of {team_name}",
        ]
        
        # Adiciona cores se disponível
        if colors:
            primary = colors.get('primary', '')
            secondary = colors.get('secondary', '')
            if primary:
                prompt_parts.append(f"with {primary} color")
            if secondary:
                prompt_parts.append(f"and {secondary} accents")
        
        # Adiciona padrões
        if 'vertical_stripes' in patterns:
            prompt_parts.append("with vertical stripes")
        elif 'horizontal_stripes' in patterns:
            prompt_parts.append("with horizontal stripes")
        else:
            prompt_parts.append("with solid design")
            
        prompt_parts.extend([
            "professional football uniform",
            "high quality",
            "detailed",
            "clean design"
        ])
        
        return ", ".join(prompt_parts)

class JerseyTrainer:
    """Classe principal para treinamento LoRA"""
    
    def __init__(self, config):
        self.config = config
        self.accelerator = Accelerator(
            gradient_accumulation_steps=config.gradient_accumulation_steps,
            mixed_precision=config.mixed_precision
        )
        
        # Carrega modelo base
        self.load_base_model()
        
        # Configura LoRA
        self.setup_lora()
        
        # Carrega dataset
        self.setup_dataset()
        
    def load_base_model(self):
        """Carrega o modelo Stable Diffusion base"""
        print("🔄 Carregando modelo Stable Diffusion...")
        
        model_id = "runwayml/stable-diffusion-v1-5"
        
        # Carrega componentes
        self.tokenizer = CLIPTokenizer.from_pretrained(
            model_id, subfolder="tokenizer"
        )
        self.text_encoder = CLIPTextModel.from_pretrained(
            model_id, subfolder="text_encoder"
        )
        self.unet = UNet2DConditionModel.from_pretrained(
            model_id, subfolder="unet"
        )
        self.vae = AutoencoderKL.from_pretrained(
            model_id, subfolder="vae"
        )
        self.scheduler = DDPMScheduler.from_pretrained(
            model_id, subfolder="scheduler"
        )
        
        # Move para device apropriado
        if torch.cuda.is_available():
            self.text_encoder = self.text_encoder.to("cuda")
            self.unet = self.unet.to("cuda")
            self.vae = self.vae.to("cuda")
            
            # Otimizações de memória
            self.vae.requires_grad_(False)  # VAE não treina
            self.text_encoder.requires_grad_(False)  # Text encoder não treina
            
            # Habilita gradient checkpointing para economizar memória
            self.unet.enable_gradient_checkpointing()
            
            print("✅ Modelo carregado na GPU com otimizações de memória")
        else:
            print("⚠️ Usando CPU (será mais lento)")
            
    def setup_lora(self):
        """Configura LoRA para o UNet"""
        print("🔧 Configurando LoRA...")
        
        # Configuração LoRA
        lora_config = LoraConfig(
            r=16,  # rank
            lora_alpha=32,
            target_modules=[
                "to_k", "to_q", "to_v", "to_out.0",
                "proj_in", "proj_out",
                "ff.net.0.proj", "ff.net.2"
            ],
            lora_dropout=0.1,
            bias="none",
        )
        
        # Aplica LoRA ao UNet
        self.unet = get_peft_model(self.unet, lora_config)
        self.unet.print_trainable_parameters()
        
        print("✅ LoRA configurado")
        
    def setup_dataset(self):
        """Configura dataset e dataloader"""
        print("📊 Configurando dataset...")
        
        dataset = JerseyDataset(
            metadata_path=self.config.metadata_path,
            base_dir=self.config.dataset_dir,
            tokenizer=self.tokenizer,
            size=self.config.resolution
        )
        
        self.dataloader = DataLoader(
            dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=2
        )
        
        print(f"✅ Dataset configurado: {len(dataset)} amostras")
        
    def train(self):
        """Executa o treinamento"""
        print("🚀 Iniciando treinamento...")
        
        # Configura otimizador
        optimizer = torch.optim.AdamW(
            self.unet.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay
        )
        
        # Prepara para treinamento distribuído
        self.unet, optimizer, self.dataloader = self.accelerator.prepare(
            self.unet, optimizer, self.dataloader
        )
        
        # Loop de treinamento
        global_step = 0
        
        for epoch in range(self.config.num_epochs):
            print(f"\n📈 Época {epoch + 1}/{self.config.num_epochs}")
            
            epoch_loss = 0
            progress_bar = tqdm(
                self.dataloader, 
                desc=f"Época {epoch + 1}",
                disable=not self.accelerator.is_local_main_process
            )
            
            for step, batch in enumerate(progress_bar):
                with self.accelerator.accumulate(self.unet):
                    # Forward pass
                    loss = self.compute_loss(batch)
                    
                    # Backward pass
                    self.accelerator.backward(loss)
                    
                    if self.accelerator.sync_gradients:
                        self.accelerator.clip_grad_norm_(self.unet.parameters(), 1.0)
                    
                    optimizer.step()
                    optimizer.zero_grad()
                    
                    epoch_loss += loss.item()
                    global_step += 1
                    
                    # Atualiza progress bar
                    progress_bar.set_postfix({
                        "loss": f"{loss.item():.4f}",
                        "avg_loss": f"{epoch_loss / (step + 1):.4f}"
                    })
                    
                    # Salva checkpoint (menos frequente para economizar memória)
                    if global_step % (self.config.save_steps * 2) == 0:
                        torch.cuda.empty_cache()  # Limpa antes de salvar
                        self.save_checkpoint(global_step)
                        torch.cuda.empty_cache()  # Limpa depois de salvar
                        
                    # Limpa cache da GPU periodicamente
                    if global_step % 5 == 0:
                        torch.cuda.empty_cache()
                        
            print(f"✅ Época {epoch + 1} concluída - Loss médio: {epoch_loss / len(self.dataloader):.4f}")
            
        print("🎉 Treinamento concluído!")
        self.save_final_model()
        
    def compute_loss(self, batch):
        """Calcula loss para o batch"""
        pixel_values = batch["pixel_values"]
        input_ids = batch["input_ids"]
        
        # Encode text
        encoder_hidden_states = self.text_encoder(input_ids)[0]
        
        # Encode images to latent space
        with torch.no_grad():
            latents = self.vae.encode(pixel_values).latent_dist.sample()
            latents = latents * self.vae.config.scaling_factor
        
        # Sample noise
        noise = torch.randn_like(latents)
        
        # Sample timesteps
        timesteps = torch.randint(
            0, self.scheduler.config.num_train_timesteps,
            (latents.shape[0],), device=latents.device
        ).long()
        
        # Add noise to latents
        noisy_latents = self.scheduler.add_noise(latents, noise, timesteps)
        
        # Predict noise
        noise_pred = self.unet(
            noisy_latents, timesteps, encoder_hidden_states
        ).sample
        
        # Compute loss
        loss = F.mse_loss(noise_pred, noise, reduction="mean")
        
        return loss
        
    def save_checkpoint(self, step):
        """Salva checkpoint do modelo (simplificado)"""
        save_path = Path(self.config.output_dir) / f"checkpoint-{step}"
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Salva apenas os pesos LoRA (mais leve)
        try:
            self.unet.save_pretrained(save_path)
            print(f"💾 Checkpoint LoRA salvo: {save_path}")
        except Exception as e:
            print(f"⚠️ Erro ao salvar checkpoint: {e}")
            # Continua treinamento mesmo se falhar o salvamento
        
    def save_final_model(self):
        """Salva modelo final"""
        save_path = Path(self.config.output_dir) / "final_model"
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Salva apenas os pesos LoRA
        self.unet.save_pretrained(save_path)
        
        print(f"🎯 Modelo final salvo: {save_path}")

class TrainingConfig:
    """Configurações de treinamento"""
    def __init__(self):
        self.dataset_dir = "dataset_v2"
        self.metadata_path = "dataset_v2/metadata.json"
        self.output_dir = "jersey_lora_model"
        self.resolution = 256  # Reduzido para economizar memória
        self.batch_size = 1  # Pequeno para GPU limitada
        self.num_epochs = 5  # Reduzido para teste
        self.learning_rate = 1e-4
        self.weight_decay = 0.01
        self.gradient_accumulation_steps = 8  # Aumentado para compensar batch menor
        self.save_steps = 50
        self.mixed_precision = "fp16"

def main():
    """Função principal"""
    print("🏈 Jersey AI Trainer - Sistema de Treinamento LoRA")
    print("=" * 50)
    
    # Verifica se o dataset existe
    config = TrainingConfig()
    
    if not os.path.exists(config.metadata_path):
        print("❌ Dataset não encontrado!")
        print(f"Execute primeiro: python process_existing_jerseys.py")
        return
        
    if not torch.cuda.is_available():
        print("⚠️ GPU não detectada - treinamento será muito lento")
        response = input("Continuar mesmo assim? (y/n): ")
        if response.lower() != 'y':
            return
    
    # Inicia treinamento
    trainer = JerseyTrainer(config)
    trainer.train()
    
    print("\n🎉 Treinamento concluído!")
    print(f"Modelo salvo em: {config.output_dir}")
    print("Para usar o modelo treinado, execute: python test_trained_model.py")

if __name__ == "__main__":
    main() 