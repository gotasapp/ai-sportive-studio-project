#!/usr/bin/env python3
"""
Teste do Modelo LoRA Treinado
Gera jerseys personalizadas usando o modelo fine-tuned
"""

import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from peft import PeftModel
import argparse
from pathlib import Path
import base64
from io import BytesIO

class JerseyGenerator:
    """Gerador de jerseys usando modelo LoRA treinado"""
    
    def __init__(self, lora_model_path="jersey_lora_model/final_model"):
        self.lora_model_path = lora_model_path
        self.load_model()
        
    def load_model(self):
        """Carrega o modelo base e aplica LoRA"""
        print("🔄 Carregando modelo treinado...")
        
        # Carrega pipeline base
        base_model_id = "runwayml/stable-diffusion-v1-5"
        self.pipe = StableDiffusionPipeline.from_pretrained(
            base_model_id,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        # Aplica LoRA se existir
        if Path(self.lora_model_path).exists():
            print("🎯 Aplicando modelo LoRA treinado...")
            self.pipe.unet = PeftModel.from_pretrained(
                self.pipe.unet, 
                self.lora_model_path
            )
        else:
            print("⚠️ Modelo LoRA não encontrado, usando modelo base")
            
        # Otimizações
        self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            self.pipe.scheduler.config
        )
        
        # Move para GPU se disponível
        if torch.cuda.is_available():
            self.pipe = self.pipe.to("cuda")
            print("✅ Modelo carregado na GPU")
        else:
            print("⚠️ Usando CPU")
            
    def generate_jersey(self, prompt, negative_prompt=None, num_inference_steps=25, guidance_scale=7.5):
        """Gera uma jersey baseada no prompt"""
        
        if negative_prompt is None:
            negative_prompt = "ugly, blurry, low quality, distorted, deformed, text, watermark, signature, logo, brand"
            
        print(f"🎨 Gerando jersey: {prompt}")
        
        with torch.autocast("cuda" if torch.cuda.is_available() else "cpu"):
            image = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                width=512,
                height=512
            ).images[0]
            
        return image
        
    def generate_team_jersey(self, team_name, jersey_type="home", colors=None, pattern="solid"):
        """Gera jersey para um time específico"""
        
        # Constrói prompt baseado nos parâmetros
        prompt_parts = [
            f"a {jersey_type} soccer jersey",
            f"of {team_name}",
        ]
        
        # Adiciona cores
        if colors:
            if isinstance(colors, dict):
                primary = colors.get('primary', '')
                secondary = colors.get('secondary', '')
                if primary:
                    prompt_parts.append(f"with {primary} color")
                if secondary:
                    prompt_parts.append(f"and {secondary} accents")
            else:
                prompt_parts.append(f"with {colors} color")
                
        # Adiciona padrão
        if pattern == "vertical_stripes":
            prompt_parts.append("with vertical stripes")
        elif pattern == "horizontal_stripes":
            prompt_parts.append("with horizontal stripes")
        else:
            prompt_parts.append("with solid design")
            
        prompt_parts.extend([
            "professional football uniform",
            "high quality",
            "detailed",
            "clean design",
            "modern style"
        ])
        
        prompt = ", ".join(prompt_parts)
        
        return self.generate_jersey(prompt)
        
    def image_to_base64(self, image):
        """Converte imagem para base64"""
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return img_str

def test_predefined_jerseys():
    """Testa com jerseys pré-definidas"""
    generator = JerseyGenerator()
    
    test_cases = [
        {
            "team_name": "Barcelona",
            "jersey_type": "home",
            "colors": {"primary": "blue", "secondary": "red"},
            "pattern": "vertical_stripes"
        },
        {
            "team_name": "Real Madrid", 
            "jersey_type": "home",
            "colors": {"primary": "white", "secondary": "gold"},
            "pattern": "solid"
        },
        {
            "team_name": "Manchester United",
            "jersey_type": "away",
            "colors": {"primary": "black", "secondary": "red"},
            "pattern": "solid"
        },
        {
            "team_name": "Liverpool",
            "jersey_type": "home", 
            "colors": {"primary": "red", "secondary": "white"},
            "pattern": "solid"
        }
    ]
    
    print("🧪 Testando geração de jerseys...")
    
    for i, test_case in enumerate(test_cases):
        print(f"\n--- Teste {i+1}: {test_case['team_name']} ---")
        
        try:
            image = generator.generate_team_jersey(**test_case)
            
            # Salva imagem
            output_path = f"generated_jersey_{test_case['team_name'].lower().replace(' ', '_')}_{test_case['jersey_type']}.png"
            image.save(output_path)
            
            print(f"✅ Jersey gerada: {output_path}")
            
        except Exception as e:
            print(f"❌ Erro: {e}")

def interactive_mode():
    """Modo interativo para gerar jerseys"""
    generator = JerseyGenerator()
    
    print("\n🎮 Modo Interativo - Gerador de Jerseys")
    print("=" * 40)
    
    while True:
        print("\nOpções:")
        print("1. Gerar jersey por time")
        print("2. Gerar jersey por prompt livre")
        print("3. Sair")
        
        choice = input("\nEscolha uma opção (1-3): ").strip()
        
        if choice == "1":
            team_name = input("Nome do time: ").strip()
            jersey_type = input("Tipo (home/away/third) [home]: ").strip() or "home"
            primary_color = input("Cor primária: ").strip()
            secondary_color = input("Cor secundária (opcional): ").strip()
            pattern = input("Padrão (solid/vertical_stripes/horizontal_stripes) [solid]: ").strip() or "solid"
            
            colors = {"primary": primary_color}
            if secondary_color:
                colors["secondary"] = secondary_color
                
            try:
                image = generator.generate_team_jersey(
                    team_name=team_name,
                    jersey_type=jersey_type,
                    colors=colors,
                    pattern=pattern
                )
                
                filename = f"custom_{team_name.lower().replace(' ', '_')}_{jersey_type}.png"
                image.save(filename)
                print(f"✅ Jersey salva: {filename}")
                
            except Exception as e:
                print(f"❌ Erro: {e}")
                
        elif choice == "2":
            prompt = input("Digite o prompt: ").strip()
            
            try:
                image = generator.generate_jersey(prompt)
                filename = f"custom_prompt_{len(prompt)}.png"
                image.save(filename)
                print(f"✅ Jersey salva: {filename}")
                
            except Exception as e:
                print(f"❌ Erro: {e}")
                
        elif choice == "3":
            print("👋 Até logo!")
            break
        else:
            print("❌ Opção inválida")

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Teste do modelo LoRA treinado")
    parser.add_argument("--mode", choices=["test", "interactive"], default="test",
                       help="Modo de execução")
    parser.add_argument("--model-path", default="jersey_lora_model/final_model",
                       help="Caminho para o modelo LoRA")
    
    args = parser.parse_args()
    
    print("🏈 Jersey AI - Teste do Modelo Treinado")
    print("=" * 40)
    
    if args.mode == "test":
        test_predefined_jerseys()
    else:
        interactive_mode()

if __name__ == "__main__":
    main() 