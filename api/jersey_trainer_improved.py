#!/usr/bin/env python3
"""
Jersey Trainer Melhorado - Foco em Alta Qualidade
Treina modelo LoRA com prompts detalhados baseados nas suas referências
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
from pathlib import Path

class ImprovedJerseyDataset(Dataset):
    """Dataset melhorado com prompts detalhados"""
    
    def __init__(self, metadata_path, base_dir, tokenizer, size=512):
        self.base_dir = Path(base_dir)
        self.size = size
        self.tokenizer = tokenizer
        
        # Carrega metadata melhorada
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        # Filtra apenas jerseys que existem
        self.valid_metadata = []
        for item in self.metadata:
            image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
            if image_path.exists():
                self.valid_metadata.append(item)
            else:
                print(f"⚠️ Imagem não encontrada: {image_path}")
                
        print(f"Dataset melhorado carregado: {len(self.valid_metadata)} jerseys válidas")
        
    def __len__(self):
        return len(self.valid_metadata)
    
    def __getitem__(self, idx):
        item = self.valid_metadata[idx]
        
        # Carrega e processa imagem
        image_path = self.base_dir / "jerseys" / item['type'] / item['filename']
        image = Image.open(image_path).convert('RGB')
        image = image.resize((self.size, self.size), Image.LANCZOS)
        image = np.array(image).astype(np.float32) / 255.0
        image = (image - 0.5) / 0.5  # Normaliza para [-1, 1]
        image = torch.from_numpy(image).permute(2, 0, 1)
        
        # Usa prompt detalhado se disponível
        if 'detailed_prompt' in item:
            prompt = item['detailed_prompt']
        else:
            prompt = self.create_detailed_prompt(item)
        
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
    
    def create_detailed_prompt(self, item):
        """Cria prompt detalhado baseado nos metadados"""
        team_name = item['team_name']
        jersey_type = item.get('jersey_type', item['type'])
        colors = item.get('colors', {})
        style_elements = item.get('style_elements', [])
        
        # Base do prompt (foco na parte traseira)
        prompt_parts = [
            "A hyper-realistic soccer jersey",
            "back view",
            f"of {team_name}",
        ]
        
        # Adiciona cores
        if colors:
            primary = colors.get('primary', '')
            secondary = colors.get('secondary', '')
            if primary:
                prompt_parts.append(f"{primary} color")
            if secondary:
                prompt_parts.append(f"with {secondary} accents")
        
        # Adiciona elementos de estilo
        if 'sponsor_logos' in style_elements:
            prompt_parts.append("sponsor logos")
        if 'player_name' in style_elements:
            prompt_parts.append("player name")
        if 'player_number' in style_elements:
            prompt_parts.append("player number")
        if 'vertical_stripes' in style_elements:
            prompt_parts.append("vertical stripes")
        if 'diagonal_stripe' in style_elements:
            prompt_parts.append("diagonal white stripe")
        if 'white_collar' in style_elements:
            prompt_parts.append("white collar")
        if 'white_cuffs' in style_elements:
            prompt_parts.append("white cuffs")
            
        # Adiciona qualificadores de qualidade (padrão DALL-E 3)
        prompt_parts.extend([
            "premium fabric texture",
            "professional soccer jersey fit",
            "clean dark background",
            "studio lighting",
            "photorealistic rendering",
            "4K quality",
            "official soccer merchandise style"
        ])
        
        return ", ".join(prompt_parts)

class ImprovedJerseyTrainer:
    """Trainer melhorado para alta qualidade"""
    
    def __init__(self, config):
        self.config = config
        self.accelerator = Accelerator(
            gradient_accumulation_steps=config.gradient_accumulation_steps,
            mixed_precision=config.mixed_precision
        )
        
        # Carrega modelo base
        self.load_base_model()
        
        # Configura LoRA melhorado
        self.setup_improved_lora()
        
        # Carrega dataset melhorado
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
            self.vae.requires_grad_(False)
            self.text_encoder.requires_grad_(False)
            
            # Habilita gradient checkpointing
            self.unet.enable_gradient_checkpointing()
            
            print("✅ Modelo carregado na GPU com otimizações")
        else:
            print("⚠️ Usando CPU")
            
    def setup_improved_lora(self):
        """Configura LoRA melhorado para alta qualidade"""
        print("🔧 Configurando LoRA melhorado...")
        
        # Configuração LoRA otimizada
        lora_config = LoraConfig(
            r=32,  # Rank maior para mais capacidade
            lora_alpha=64,  # Alpha maior para mais influência
            target_modules=[
                "to_k", "to_q", "to_v", "to_out.0",
                "proj_in", "proj_out",
                "ff.net.0.proj", "ff.net.2"
            ],
            lora_dropout=0.05,  # Dropout menor para preservar detalhes
            bias="none",
        )
        
        # Aplica LoRA ao UNet
        self.unet = get_peft_model(self.unet, lora_config)
        self.unet.print_trainable_parameters()
        
        print("✅ LoRA melhorado configurado")
        
    def setup_dataset(self):
        """Configura dataset melhorado"""
        print("📊 Configurando dataset melhorado...")
        
        dataset = ImprovedJerseyDataset(
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
        
        print(f"✅ Dataset melhorado configurado: {len(dataset)} amostras")
        
    def compute_loss(self, batch):
        """Calcula loss melhorado"""
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
        
        # Sample timesteps (foco em timesteps médios para melhor qualidade)
        timesteps = torch.randint(
            100, self.scheduler.config.num_train_timesteps - 100,  # Evita extremos
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
        
    def train(self):
        """Executa treinamento melhorado"""
        print("🚀 Iniciando treinamento melhorado...")
        
        # Configura otimizador com learning rate menor para estabilidade
        optimizer = torch.optim.AdamW(
            self.unet.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            betas=(0.9, 0.999),
            eps=1e-8
        )
        
        # Scheduler de learning rate
        from torch.optim.lr_scheduler import CosineAnnealingLR
        scheduler = CosineAnnealingLR(optimizer, T_max=self.config.num_epochs)
        
        # Prepara para treinamento
        self.unet, optimizer, self.dataloader = self.accelerator.prepare(
            self.unet, optimizer, self.dataloader
        )
        
        # Loop de treinamento
        global_step = 0
        best_loss = float('inf')
        
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
                        "avg_loss": f"{epoch_loss / (step + 1):.4f}",
                        "lr": f"{optimizer.param_groups[0]['lr']:.2e}"
                    })
                    
                    # Limpa cache periodicamente
                    if global_step % 5 == 0:
                        torch.cuda.empty_cache()
                        
            # Atualiza learning rate
            scheduler.step()
            
            avg_loss = epoch_loss / len(self.dataloader)
            print(f"✅ Época {epoch + 1} concluída - Loss médio: {avg_loss:.4f}")
            
            # Salva melhor modelo
            if avg_loss < best_loss:
                best_loss = avg_loss
                self.save_best_model()
                print(f"🏆 Novo melhor modelo salvo! Loss: {best_loss:.4f}")
                
        print("🎉 Treinamento melhorado concluído!")
        self.save_final_model()
        
    def save_best_model(self):
        """Salva o melhor modelo"""
        save_path = Path(self.config.output_dir) / "best_model"
        save_path.mkdir(parents=True, exist_ok=True)
        
        try:
            self.unet.save_pretrained(save_path)
        except Exception as e:
            print(f"⚠️ Erro ao salvar melhor modelo: {e}")
            
    def save_final_model(self):
        """Salva modelo final"""
        save_path = Path(self.config.output_dir) / "final_model"
        save_path.mkdir(parents=True, exist_ok=True)
        
        self.unet.save_pretrained(save_path)
        print(f"🎯 Modelo final melhorado salvo: {save_path}")

class ImprovedTrainingConfig:
    """Configurações melhoradas de treinamento"""
    def __init__(self):
        self.dataset_dir = "dataset_improved"
        self.metadata_path = "dataset_improved/metadata_improved.json"
        self.output_dir = "jersey_lora_improved"
        self.resolution = 512  # Resolução maior para qualidade
        self.batch_size = 1
        self.num_epochs = 15  # Mais épocas para convergência
        self.learning_rate = 5e-5  # Learning rate menor para estabilidade
        self.weight_decay = 0.01
        self.gradient_accumulation_steps = 8
        self.mixed_precision = "fp16"

def main():
    """Função principal"""
    print("🏈 Jersey AI Trainer Melhorado - Alta Qualidade")
    print("=" * 50)
    
    # Verifica se o dataset melhorado existe
    config = ImprovedTrainingConfig()
    
    if not os.path.exists(config.metadata_path):
        print("❌ Dataset melhorado não encontrado!")
        print("Execute primeiro: python improve_dataset.py")
        return
        
    if not torch.cuda.is_available():
        print("⚠️ GPU não detectada - treinamento será muito lento")
        response = input("Continuar mesmo assim? (y/n): ")
        if response.lower() != 'y':
            return
    
    # Inicia treinamento melhorado
    trainer = ImprovedJerseyTrainer(config)
    trainer.train()
    
    print("\n🎉 Treinamento melhorado concluído!")
    print(f"Modelo salvo em: {config.output_dir}")
    print("Para testar: python test_improved_model.py")

if __name__ == "__main__":
    main() 