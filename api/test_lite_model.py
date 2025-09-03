#!/usr/bin/env python3
"""
Teste do Modelo Lite Treinado
"""

import torch
from diffusers import StableDiffusionPipeline
from peft import PeftModel
from PIL import Image
import os
from pathlib import Path

def test_lite_model():
    """Testa o modelo lite treinado"""
    print("🧪 Testando Modelo Lite Treinado")
    print("=" * 40)
    
    # Verifica se modelo existe
    model_path = "jersey_lora_lite/lite_model"
    if not os.path.exists(model_path):
        print("❌ Modelo lite não encontrado!")
        print("Execute primeiro: python jersey_trainer_lite.py")
        return
    
    # Carrega pipeline base
    print("🔄 Carregando pipeline base...")
    pipe = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float16,
        safety_checker=None,
        requires_safety_checker=False
    )
    
    # Carrega LoRA treinado
    print("🔄 Carregando LoRA treinado...")
    pipe.unet = PeftModel.from_pretrained(pipe.unet, model_path)
    
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print("✅ Modelo carregado na GPU")
    else:
        print("⚠️ Usando CPU")
    
    # Prompts de teste
    test_prompts = [
        "A hyper-realistic Vasco da Gama soccer jersey, back view, black with white diagonal sash, number 8, player name JEFF, premium fabric texture, 4K quality",
        "A hyper-realistic Palmeiras soccer jersey, back view, green with white details, number 10, player name ARIEL, premium fabric texture, 4K quality",
        "A hyper-realistic Flamengo soccer jersey, back view, red and black stripes, number 9, premium fabric texture, 4K quality",
        "A hyper-realistic Real Madrid soccer jersey, back view, white with gold details, number 7, premium fabric texture, 4K quality"
    ]
    
    # Cria pasta de resultados
    output_dir = Path("test_results_lite")
    output_dir.mkdir(exist_ok=True)
    
    # Gera imagens
    for i, prompt in enumerate(test_prompts):
        print(f"\n🎨 Gerando imagem {i+1}/4...")
        print(f"Prompt: {prompt[:50]}...")
        
        try:
            image = pipe(
                prompt,
                num_inference_steps=30,
                guidance_scale=7.5,
                height=256,  # Resolução menor
                width=256
            ).images[0]
            
            # Salva imagem
            filename = f"test_lite_{i+1}.png"
            image.save(output_dir / filename)
            print(f"✅ Salvo: {filename}")
            
        except Exception as e:
            print(f"❌ Erro: {e}")
    
    print(f"\n🎉 Teste concluído! Imagens salvas em: {output_dir}")
    print("Abra a pasta para ver os resultados.")

if __name__ == "__main__":
    test_lite_model() 