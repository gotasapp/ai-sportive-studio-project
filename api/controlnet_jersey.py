#!/usr/bin/env python3
"""
ControlNet Jersey - Força formato exato das referências
"""

import cv2
import numpy as np
from PIL import Image
import json
import requests
import base64
from io import BytesIO
from pathlib import Path

class JerseyControlNet:
    """Sistema ControlNet para jerseys"""
    
    def __init__(self):
        self.server_url = "http://localhost:8000"
        self.check_server()
        
    def check_server(self):
        """Verifica servidor"""
        try:
            response = requests.get(f"{self.server_url}/health")
            if response.status_code == 200:
                print("✅ Servidor AI funcionando")
                return True
        except:
            print("❌ Servidor AI não está rodando!")
            exit(1)
    
    def create_jersey_mask(self, image_path):
        """Cria máscara da silhueta do jersey"""
        print(f"🎭 Criando máscara: {image_path}")
        
        # Carrega imagem
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"❌ Erro ao carregar: {image_path}")
            return None
            
        # Converte para RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Cria máscara por cor (remove fundo branco)
        # Define range para fundo branco
        lower_white = np.array([240, 240, 240])
        upper_white = np.array([255, 255, 255])
        
        # Máscara do fundo branco
        white_mask = cv2.inRange(image_rgb, lower_white, upper_white)
        
        # Inverte para ter o jersey
        jersey_mask = cv2.bitwise_not(white_mask)
        
        # Limpa ruído
        kernel = np.ones((3,3), np.uint8)
        jersey_mask = cv2.morphologyEx(jersey_mask, cv2.MORPH_CLOSE, kernel)
        jersey_mask = cv2.morphologyEx(jersey_mask, cv2.MORPH_OPEN, kernel)
        
        # Detecta bordas para ControlNet
        edges = cv2.Canny(jersey_mask, 50, 150)
        
        # Dilata bordas para melhor detecção
        kernel = np.ones((2,2), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
        
        return edges
    
    def create_all_masks(self):
        """Cria máscaras para todas as referências"""
        print("🎭 Criando Máscaras de Controle")
        print("=" * 35)
        
        # Pasta de referências
        ref_dir = Path("dataset_clean/jerseys/reference")
        masks_dir = Path("dataset_clean/masks")
        masks_dir.mkdir(exist_ok=True)
        
        if not ref_dir.exists():
            print("❌ Pasta de referências não encontrada!")
            return
        
        # Processa cada imagem
        mask_files = {}
        for img_file in ref_dir.glob("*.png"):
            print(f"\n📸 Processando: {img_file.name}")
            
            # Cria máscara
            mask = self.create_jersey_mask(img_file)
            
            if mask is not None:
                # Salva máscara
                mask_filename = f"mask_{img_file.stem}.png"
                mask_path = masks_dir / mask_filename
                cv2.imwrite(str(mask_path), mask)
                
                # Detecta time pelo nome
                if "palmeiras" in img_file.name.lower():
                    team = "Palmeiras"
                elif "vasco" in img_file.name.lower():
                    team = "Vasco da Gama"
                elif "flamengo" in img_file.name.lower():
                    team = "Flamengo"
                else:
                    team = "Unknown"
                
                mask_files[team] = mask_filename
                print(f"✅ Máscara criada: {mask_filename}")
            else:
                print(f"❌ Falha ao criar máscara")
        
        # Salva mapeamento
        masks_info = {
            "masks": mask_files,
            "description": "ControlNet masks for jersey generation",
            "type": "canny_edges"
        }
        
        with open(masks_dir / "masks_info.json", 'w') as f:
            json.dump(masks_info, f, indent=2)
        
        print(f"\n🎯 Máscaras criadas: {len(mask_files)}")
        print(f"📁 Pasta: {masks_dir}")
        
        return mask_files
    
    def generate_with_controlnet(self, team_name, prompt, negative_prompt=""):
        """Gera imagem usando ControlNet"""
        print(f"🎨 Gerando com ControlNet: {team_name}")
        
        # Carrega máscara
        masks_dir = Path("dataset_clean/masks")
        masks_info_path = masks_dir / "masks_info.json"
        
        if not masks_info_path.exists():
            print("❌ Máscaras não encontradas! Execute create_all_masks() primeiro")
            return None
        
        with open(masks_info_path, 'r') as f:
            masks_info = json.load(f)
        
        if team_name not in masks_info['masks']:
            print(f"❌ Máscara não encontrada para {team_name}")
            return None
        
        mask_filename = masks_info['masks'][team_name]
        mask_path = masks_dir / mask_filename
        
        # Carrega máscara
        mask_image = Image.open(mask_path).convert('RGB')
        
        # Converte máscara para base64
        buffer = BytesIO()
        mask_image.save(buffer, format='PNG')
        mask_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Gera via API (simulando ControlNet)
        try:
            response = requests.post(
                f"{self.server_url}/generate-image",
                json={
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "controlnet_conditioning_image": mask_base64,
                    "controlnet_conditioning_scale": 1.0
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["image"]
            else:
                print(f"❌ Erro na API: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Erro: {e}")
            return None

def main():
    """Função principal"""
    print("🎭 Jersey ControlNet System")
    print("=" * 30)
    
    controlnet = JerseyControlNet()
    
    # Cria máscaras
    masks = controlnet.create_all_masks()
    
    if masks:
        print(f"\n🎯 Sistema ControlNet configurado!")
        print(f"📁 Máscaras disponíveis: {list(masks.keys())}")
        print(f"\n🚀 Para usar:")
        print(f"   python test_controlnet.py")
    else:
        print("❌ Falha ao criar máscaras")

if __name__ == "__main__":
    main() 