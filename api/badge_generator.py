#!/usr/bin/env python3
"""
Gerador de Badges/Logos Esportivos
Sistema modular para geração de badges e logos de times usando DALL-E 3
"""

import openai
import requests
from PIL import Image, ImageEnhance, ImageFilter
import io
import base64
import logging
from typing import Dict, Any, Optional, Tuple
from badge_prompts import build_badge_prompt, get_available_styles, get_supported_teams

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BadgeGenerator:
    """Gerador especializado para badges e logos esportivos"""
    
    def __init__(self, openai_api_key: str):
        """
        Inicializa o gerador de badges
        
        Args:
            openai_api_key: Chave da API OpenAI para DALL-E 3
        """
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.supported_styles = get_available_styles()
        self.supported_teams = get_supported_teams()
    
    def generate_badge(
        self, 
        team_name: str, 
        badge_name: str, 
        badge_number: str,
        style: str = "modern",
        size: str = "1024x1024",
        quality: str = "hd"
    ) -> Dict[str, Any]:
        """
        Gera um badge/logo usando DALL-E 3
        
        Args:
            team_name: Nome do time
            badge_name: Nome/texto do badge
            badge_number: Número do badge
            style: Estilo do badge (modern, retro, national, urban, classic)
            size: Tamanho da imagem (1024x1024, 1792x1024, 1024x1792)
            quality: Qualidade (standard, hd)
            
        Returns:
            Dict com resultado da geração
        """
        try:
            logger.info(f"🎨 Gerando badge: {team_name} - {badge_name} #{badge_number} ({style})")
            
            # Validar estilo
            if style not in self.supported_styles:
                logger.warning(f"Estilo '{style}' não suportado. Usando 'modern'.")
                style = "modern"
            
            # Construir prompt específico para badge
            prompt = build_badge_prompt(team_name, badge_name, badge_number, style)
            
            logger.info(f"📝 Prompt gerado: {len(prompt)} caracteres")
            
            # Gerar imagem com DALL-E 3
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                n=1
            )
            
            # Obter URL da imagem
            image_url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt
            
            logger.info(f"✅ Badge gerado com sucesso: {image_url}")
            
            # Download e otimização da imagem
            optimized_image_data = self._download_and_optimize_image(image_url)
            
            return {
                "success": True,
                "image_url": image_url,
                "revised_prompt": revised_prompt,
                "optimized_image": optimized_image_data,
                "metadata": {
                    "team_name": team_name,
                    "badge_name": badge_name,
                    "badge_number": badge_number,
                    "style": style,
                    "size": size,
                    "quality": quality,
                    "type": "badge"
                }
            }
            
        except Exception as e:
            error_msg = f"Erro na geração do badge: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "metadata": {
                    "team_name": team_name,
                    "badge_name": badge_name,
                    "badge_number": badge_number,
                    "style": style
                }
            }
    
    def _download_and_optimize_image(self, image_url: str) -> Optional[str]:
        """
        Download e otimização da imagem gerada
        
        Args:
            image_url: URL da imagem gerada pelo DALL-E
            
        Returns:
            Imagem otimizada em base64 ou None se erro
        """
        try:
            logger.info("📥 Fazendo download da imagem...")
            
            # Download da imagem
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Abrir imagem com PIL
            image = Image.open(io.BytesIO(response.content))
            
            logger.info(f"🖼️ Imagem original: {image.size} - {image.mode}")
            
            # Otimizações específicas para badges
            optimized_image = self._optimize_badge_image(image)
            
            # Converter para base64
            buffer = io.BytesIO()
            optimized_image.save(buffer, format='PNG', optimize=True, quality=95)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            logger.info("✅ Imagem otimizada com sucesso")
            
            return image_base64
            
        except Exception as e:
            logger.error(f"Erro no download/otimização: {str(e)}")
            return None
    
    def _optimize_badge_image(self, image: Image.Image) -> Image.Image:
        """
        Otimizações específicas para badges/logos
        
        Args:
            image: Imagem original
            
        Returns:
            Imagem otimizada para badge
        """
        try:
            # Converter para RGBA se necessário
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            # Melhorar contraste para badges
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)  # Aumentar contraste em 20%
            
            # Melhorar nitidez para bordas de logos
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.3)  # Aumentar nitidez em 30%
            
            # Slight desaturação para look mais profissional
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(0.95)  # Reduzir saturação em 5%
            
            logger.info("🎨 Otimizações de badge aplicadas")
            
            return image
            
        except Exception as e:
            logger.error(f"Erro na otimização do badge: {str(e)}")
            return image
    
    def generate_badge_variations(
        self, 
        team_name: str, 
        badge_name: str, 
        badge_number: str,
        styles: list = None
    ) -> Dict[str, Any]:
        """
        Gera múltiplas variações de um badge
        
        Args:
            team_name: Nome do time
            badge_name: Nome/texto do badge
            badge_number: Número do badge
            styles: Lista de estilos para gerar (None = todos)
            
        Returns:
            Dict com todas as variações geradas
        """
        if styles is None:
            styles = self.supported_styles
        
        results = {
            "team_name": team_name,
            "badge_name": badge_name,
            "badge_number": badge_number,
            "variations": {},
            "summary": {
                "total_requested": len(styles),
                "successful": 0,
                "failed": 0
            }
        }
        
        for style in styles:
            logger.info(f"🔄 Gerando variação: {style}")
            
            result = self.generate_badge(team_name, badge_name, badge_number, style)
            results["variations"][style] = result
            
            if result["success"]:
                results["summary"]["successful"] += 1
            else:
                results["summary"]["failed"] += 1
        
        logger.info(f"📊 Variações completas: {results['summary']['successful']}/{results['summary']['total_requested']}")
        
        return results
    
    def get_info(self) -> Dict[str, Any]:
        """Retorna informações sobre o gerador"""
        return {
            "generator_type": "BadgeGenerator",
            "version": "1.0.0",
            "supported_styles": self.supported_styles,
            "supported_teams": self.supported_teams,
            "capabilities": [
                "badge_generation",
                "logo_creation", 
                "style_variations",
                "team_specific_prompts",
                "image_optimization"
            ]
        }

# Função de teste
def test_badge_generator():
    """Teste básico do gerador de badges"""
    import os
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY não configurada")
        return
    
    generator = BadgeGenerator(api_key)
    
    # Teste de geração
    result = generator.generate_badge(
        team_name="Flamengo",
        badge_name="CHAMPION",
        badge_number="1",
        style="modern"
    )
    
    print("=== TESTE DE GERAÇÃO DE BADGE ===")
    print(f"Sucesso: {result['success']}")
    if result['success']:
        print(f"URL: {result['image_url']}")
        print(f"Metadados: {result['metadata']}")
    else:
        print(f"Erro: {result['error']}")

if __name__ == "__main__":
    test_badge_generator() 