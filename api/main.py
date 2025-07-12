#!/usr/bin/env python3
"""
API Unificada - Jerseys + Stadiums
Combina as funcionalidades de geração de jerseys e estádios em uma única API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI, AsyncOpenAI # Importar o cliente Async
import requests
import base64
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from pathlib import Path
import json
import pymongo # Adicionar import
from datetime import datetime # Adicionar import
import io # Para manipulação de bytes da imagem
import time # Adicionar import para medir tempo de análise
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Importar sistema de prompts premium para stadiums
from stadium_base_prompts import build_enhanced_stadium_prompt, STADIUM_NFT_BASE_PROMPT

# Importar router de geração de imagens
from generate_image import router as generate_image_router

# Importar nova função de composição vision-enhanced
from vision_prompts.base_prompts import compose_vision_enhanced_prompt

load_dotenv()

# --- Conexão MongoDB ---
DB_NAME = "chz-app-db" # Nome do banco de dados principal
MONGO_URI = os.getenv("MONGODB_URI") # CORRIGIDO para o nome da sua variável
db_client = None
db = None

try:
    if not MONGO_URI:
        print("⚠️ MONGODB_URI não encontrada no .env. As operações de banco de dados estarão desativadas.")
    else:
        print("⚙️ Conectando ao MongoDB...")
        db_client = pymongo.MongoClient(MONGO_URI)
        db_client.admin.command('ping')
        db = db_client[DB_NAME]
        print(f"✅ Conexão com o MongoDB estabelecida com sucesso ao banco '{DB_NAME}'.")
except Exception as e:
    print(f"❌ Falha na conexão com o MongoDB: {e}")
    db = None

# --- FUNÇÃO PARA GERAR PROMPTS DALLE-3 OTIMIZADOS ---
def generate_dalle_prompt_from_analysis(analysis_result: dict, player_name: str, player_number: str) -> str:
    """
    Gera prompt otimizado para DALL-E 3 baseado na análise Vision JSON estruturada
    Formato otimizado seguindo as melhores práticas para geração fiel
    """
    try:
        # Extrai dados da análise com fallbacks seguros
        colors = analysis_result.get("dominantColors", ["white", "black"])
        if isinstance(colors, dict):
            # Se é objeto com primary/secondary, extrair como lista
            colors_list = [colors.get("primary", "white"), colors.get("secondary", "black")]
            colors_text = ", ".join(colors_list)
        elif isinstance(colors, list):
            colors_text = ", ".join(colors)
        else:
            colors_text = "white, black"
        
        # Extrai pattern
        pattern = analysis_result.get("pattern", "plain")
        if isinstance(pattern, dict):
            pattern = pattern.get("description", "plain")
        
        # Extrai número style com formatação específica
        number_style = analysis_result.get("numberStyle", {})
        if isinstance(number_style, dict):
            font = number_style.get("font", "bold")
            fill_pattern = number_style.get("fillPattern", "solid fill")
            outline = number_style.get("outline", "no outline")
            number_style_text = f"{font}, with {fill_pattern} and {outline}"
        else:
            number_style_text = "bold, with solid fill and no outline"
        
        # Extrai outros elementos
        name_placement = analysis_result.get("namePlacement", "above the number, centered")
        collar = analysis_result.get("collar", "round, white")
        sleeves = analysis_result.get("sleeves", "standard")
        style = analysis_result.get("style", "modern")
        texture = analysis_result.get("texture", "smooth fabric")
        logos = analysis_result.get("logos", "none")
        
        # Detecta view (principalmente para soccer)
        view = "back"
        if "front" in str(analysis_result).lower():
            view = "front"
        
        # Detecta sport
        sport = "soccer"
        if "basketball" in str(analysis_result).lower():
            sport = "basketball"
        elif "nfl" in str(analysis_result).lower():
            sport = "nfl"
        
        # Constrói prompt seguindo formato otimizado
        optimized_prompt = f"""
Create a photorealistic image of a {sport} jersey viewed from the {view}, with the following characteristics:

- Dominant colors: {colors_text}
- Jersey pattern: {pattern}
- Number style: {number_style_text}
- Name placement: {name_placement}
- Collar: {collar}
- Sleeves: {sleeves}
- Style: {style}
- Texture: {texture}
- Logos: {logos}

Use the following player info:
- Name: **{player_name.upper()}**
- Number: **{player_number}**

Render the jersey in high quality, centered, from {view} view, on a plain white background. No mannequins, no brand names, no additional items.
""".strip()
        
        print(f"✅ [DALLE PROMPT] Generated optimized prompt: {len(optimized_prompt)} chars")
        print(f"🎨 [DALLE PROMPT] Style details: {sport} {view}, colors: {colors_text}")
        return optimized_prompt
        
    except Exception as e:
        print(f"⚠️ [DALLE PROMPT] Error generating optimized prompt: {e}")
        # Fallback para prompt simples
        return f"""
Create a photorealistic image of a soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: white, black
- Jersey pattern: plain
- Number style: bold, with solid fill and no outline
- Name placement: above the number, centered
- Collar: round, white
- Sleeves: standard
- Style: modern
- Texture: smooth fabric
- Logos: none

Use the following player info:
- Name: **{player_name.upper()}**
- Number: **{player_number}**

Render the jersey in high quality, centered, from back view, on a plain white background. No mannequins, no brand names, no additional items.
""".strip()

def _generate_intelligent_fallback(sport: str, view: str, context: str = "") -> dict:
    """Gera fallback inteligente baseado no esporte e contexto"""
    fallback_data = {
        "soccer": {
            "dominantColors": ["white", "blue"],
            "pattern": "solid color with minimal details",
            "numberStyle": {
                "font": "bold sans-serif",
                "fillPattern": "solid color",
                "outline": "white border"
            },
            "namePlacement": "centered above number",
            "collar": "round collar",
            "sleeves": "short sleeves",
            "style": "modern",
            "texture": "smooth fabric",
            "logos": "none",
            "view": view
        },
        "basketball": {
            "dominantColors": ["purple", "gold"],
            "pattern": "solid color with minimal details", 
            "numberStyle": {
                "font": "bold athletic font",
                "fillPattern": "solid color",
                "outline": "contrasting border"
            },
            "namePlacement": "centered above number",
            "style": "modern basketball",
            "texture": "lightweight mesh fabric",
            "logos": "none",
            "view": view
        },
        "nfl": {
            "dominantColors": ["team colors"],
            "pattern": "solid NFL design",
            "numberStyle": {
                "font": "bold NFL font",
                "fillPattern": "solid color",
                "outline": "team border"
            },
            "namePlacement": "centered above number",
            "style": "modern NFL",
            "texture": "durable NFL fabric",
            "logos": "none",
            "view": view
        }
    }
    
    base_data = fallback_data.get(sport, fallback_data["soccer"])
    
    # Se há contexto adicional, tentar extrair cores
    if "Lakers" in context:
        base_data["dominantColors"] = ["#FDB927", "#552583"]  # Lakers colors
    elif "Barcelona" in context:
        base_data["dominantColors"] = ["#A50044", "#004D98"]  # Barca colors
    elif "Real Madrid" in context:
        base_data["dominantColors"] = ["#FFFFFF", "#000000"]  # Real colors
    
    return {
        "success": True,
        "analysis": base_data,
        "model_used": "intelligent_fallback",
        "cost_estimate": 0
    }

def generate_dalle_prompt_from_text_analysis(analysis_text: str, player_name: str, player_number: str, sport: str = "soccer", view: str = "back") -> str:
    """
    Gera prompt otimizado para DALL-E 3 baseado em análise textual descritiva
    Mais flexível que JSON estruturado, mantém fidelidade à análise
    """
    try:
        # Prompt base estruturado seguindo as melhores práticas
        base_prompt = f"""
Create a photorealistic image of a {sport} jersey viewed from the {view}, faithfully reproducing the following analyzed characteristics:

{analysis_text}

CRITICAL PLAYER CUSTOMIZATION:
- Display player name "{player_name.upper()}" in bold letters at the TOP BACK area of the jersey
- Display player number "{player_number}" prominently in the CENTER BACK area below the name
- Use high contrast colors for name and number text to ensure visibility
- Position name and number exactly as they would appear on a professional {sport} jersey

Technical requirements:
- High quality, professional photography style
- Centered composition on plain white background
- No mannequins, no people, no brand logos, no extra objects
- Focus on textile details and authentic jersey appearance
- Render the jersey flat and clearly visible from {view} view
- Ensure name "{player_name.upper()}" and number "{player_number}" are clearly readable and properly sized

The final image must show an authentic {sport} jersey that matches the analyzed design with the specified player name and number clearly visible.
""".strip()
        
        print(f"✅ [TEXT PROMPT] Generated optimized prompt: {len(base_prompt)} chars")
        print(f"🎨 [TEXT PROMPT] Analysis length: {len(analysis_text)} chars")
        return base_prompt
        
    except Exception as e:
        print(f"⚠️ [TEXT PROMPT] Error generating prompt: {e}")
        # Fallback para prompt simples
        return f"""
Create a photorealistic image of a {sport} jersey viewed from the {view}, with the following characteristics:

- Modern athletic design with team colors
- Professional jersey fabric and construction

CRITICAL PLAYER DETAILS:
- Player name "{player_name.upper()}" displayed in BOLD letters at the TOP BACK area
- Player number "{player_number}" prominently displayed in the CENTER BACK area below the name
- Name and number must be clearly visible with high contrast colors
- Use standard professional {sport} jersey font and positioning

Technical specs:
- High quality, professional photography style
- Centered composition on plain white background
- No mannequins, no people, no brand names, no additional items
- Render the jersey flat and clearly visible from {view} view
- Ensure both name "{player_name.upper()}" and number "{player_number}" are clearly readable

The jersey must show the player customization prominently and authentically.
""".strip()

# Configurações
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
STADIUM_REFERENCES_PATH = Path("stadium_references")

# --- Configuração do Cloudinary ---
try:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )
    print("✅ Cloudinary configurado com sucesso.")
except Exception as e:
    print(f"⚠️ Alerta: Configuração do Cloudinary falhou. Uploads estarão desabilitados. Erro: {e}")

# --- MODELOS DE DADOS PARA JERSEYS ---
class ImageGenerationRequest(BaseModel):
    model_id: str
    player_name: str
    player_number: str
    quality: str = "standard"

class VisionEnhancedGenerationRequest(BaseModel):
    player_name: str
    player_number: str
    quality: str = "standard"
    generation_mode: str = "vision_enhanced"
    vision_analysis: Optional[Dict[str, Any]] = None

class GenerateFromReferenceRequest(BaseModel):
    teamName: str
    player_name: str
    player_number: str
    quality: str = "standard"
    sport: str = "soccer"
    view: str = "back"

# RESPOSTA DA GERAÇÃO POR REFERÊNCIA - CORRIGIDO
class ReferenceGenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None # CORRIGIDO: Deve ser image_base64
    prompt: Optional[str] = None
    error: Optional[str] = None

class CompleteVisionFlowRequest(BaseModel):
    image_base64: str
    player_name: str
    player_number: str
    sport: str = "soccer"
    view: str = "back"
    model: str = "openai/gpt-4o-mini"
    quality: str = "standard"

class GenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None

# --- MODELOS DE DADOS PARA STADIUMS ---
class StadiumReferenceRequest(BaseModel):
    stadium_id: str
    reference_type: str = "atmosphere"
    generation_style: str = "realistic"
    perspective: str = "external"
    atmosphere: str = "packed"
    time_of_day: str = "day"
    weather: str = "clear"
    quality: str = "standard"
    custom_prompt: Optional[str] = None
    custom_reference_base64: Optional[str] = None

class CustomStadiumRequest(BaseModel):
    prompt: str
    reference_image_base64: Optional[str] = None
    generation_style: str = "realistic"
    perspective: str = "external"
    atmosphere: str = "packed"
    time_of_day: str = "day"
    quality: str = "standard"

class StadiumInfo(BaseModel):
    id: str
    name: str
    available_references: List[str]

class StadiumResponse(BaseModel):
    success: bool
    analysis: Optional[Dict[str, Any]] = None
    generated_image_base64: Optional[str] = None
    reference_used: Optional[str] = None
    reference_source: Optional[str] = None
    error: Optional[str] = None
    cost_usd: Optional[float] = None
    prompt_used: Optional[str] = None

# --- MODELOS PARA VISION ANALYSIS ---
class VisionAnalysisRequest(BaseModel):
    image_base64: str
    prompt: str
    model: str = "openai/gpt-4o-mini"
    type: str = "vision-analysis"

class VisionAnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[str] = None
    model_used: Optional[str] = None
    cost_estimate: Optional[float] = None
    error: Optional[str] = None

# --- GERADOR DE JERSEYS ---
class JerseyGenerator:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise Exception("OPENAI_API_KEY não encontrada")
        self.client = OpenAI(api_key=self.api_key)
        self.setup_team_prompts()

    def setup_team_prompts(self):
        """Define prompts otimizados específicos para cada time"""
        self.team_prompts = {
            "flamengo": """A photorealistic back view of a professional Flamengo soccer jersey on a white studio background. The jersey features the classic Flamengo design with HORIZONTAL red and black stripes (never vertical). The stripes are bold, equal width, and alternate between vibrant red and deep black colors. The jersey has modern athletic fabric texture with subtle sheen. At the top back, display the player name "{PLAYER_NAME}" in bold white uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}" in white. The layout is centered and flat, no mannequin or human body. 4K resolution, professional lighting.""",
            
            "corinthians": """A photorealistic back view of a professional Corinthians soccer jersey on a white studio background. The jersey is primarily white with the distinctive Corinthians design pattern - clean white base with subtle modern details or patterns typical of Corinthians jerseys. At the top back, display the player name "{PLAYER_NAME}" in bold black uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}" in black. The jersey has modern athletic fabric texture. The layout is centered and flat, no mannequin or human body. 4K resolution, professional lighting.""",
            
            "palmeiras": """A photorealistic back view of a professional Palmeiras soccer jersey on a white studio background. The jersey is vibrant green (Palmeiras green) with modern athletic fabric texture. At the top back, display the player name "{PLAYER_NAME}" in bold white uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}" in white. The layout is centered and flat, no mannequin or human body. 4K resolution, professional lighting.""",
            
            "santos": """A photorealistic back view of a professional Santos soccer jersey on a white studio background. The jersey is white with black details/trim typical of Santos jerseys. At the top back, display the player name "{PLAYER_NAME}" in bold black uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}" in black. The layout is centered and flat, no mannequin or human body. 4K resolution, professional lighting.""",
            
            "vasco": """A photorealistic back view of a professional Vasco da Gama soccer jersey on a white studio background. The jersey is white with the classic black diagonal stripe across the chest (Vasco's signature design). At the top back, display the player name "{PLAYER_NAME}" in bold black uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}" in black. The layout is centered and flat, no mannequin or human body. 4K resolution, professional lighting."""
        }

    def _get_team_name_from_model_id(self, model_id: str) -> str:
        """Extrai o nome do time do model_id"""
        return model_id.split('_')[0].lower()

    def generate_image(self, request: ImageGenerationRequest) -> str:
        """Gera uma camisa usando prompt otimizado específico do time."""
        
        team_name = self._get_team_name_from_model_id(request.model_id)
        
        if team_name not in self.team_prompts:
            raise ValueError(f"Time '{team_name}' não tem prompt configurado")
        
        prompt_template = self.team_prompts[team_name]
        final_prompt = prompt_template.format(
            PLAYER_NAME=request.player_name.upper(),
            PLAYER_NUMBER=request.player_number
        )
        
        print(f"INFO: Gerando {team_name} com prompt otimizado")
        
        generation_response = self.client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1024x1024",
            quality=request.quality,
            n=1
        )
        
        image_url = generation_response.data[0].url
        img_response = requests.get(image_url, timeout=60)
        
        if img_response.status_code == 200:
            image = Image.open(BytesIO(img_response.content))
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode()
        else:
            raise Exception(f"Erro ao baixar imagem do DALL-E 3: {img_response.status_code}")

# --- GERADOR DE STADIUMS ---
class StadiumReferenceGenerator:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        print("✅ Stadium Reference Generator initialized")
    
    def get_available_stadiums(self) -> List[StadiumInfo]:
        """Lista estádios disponíveis"""
        stadiums = []
        
        if not STADIUM_REFERENCES_PATH.exists():
            return stadiums
        
        for stadium_dir in STADIUM_REFERENCES_PATH.iterdir():
            if stadium_dir.is_dir():
                image_files = []
                for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
                    image_files.extend(stadium_dir.glob(ext))
                
                stadium_name = stadium_dir.name.replace('_', ' ').title()
                
                stadiums.append(StadiumInfo(
                    id=stadium_dir.name,
                    name=stadium_name,
                    available_references=[f.name for f in image_files]
                ))
        
        return stadiums
    
    def load_reference_image(self, stadium_id: str, reference_type: str) -> Optional[str]:
        """Carrega imagem de referência"""
        stadium_path = STADIUM_REFERENCES_PATH / stadium_id
        
        if not stadium_path.exists():
            return None
        
        for ext in ['jpg', 'jpeg', 'png', 'webp']:
            files = list(stadium_path.glob(f"*.{ext}"))
            if files:
                image_file = files[0]
                try:
                    with open(image_file, 'rb') as f:
                        image_data = f.read()
                        return base64.b64encode(image_data).decode('utf-8')
                except Exception as e:
                    print(f"❌ Error loading {image_file}: {e}")
                    continue
        
        return None
    
    def analyze_reference_image(self, image_base64: str, stadium_name: str) -> Dict[str, Any]:
        """Analisa imagem de referência"""
        try:
            print(f"🔍 Analyzing {stadium_name}...")
            
            prompt = f"""Analyze this {stadium_name} stadium image for premium NFT artwork generation. Focus on:

ARCHITECTURAL ANALYSIS:
- Distinctive architectural features and design elements
- Structural characteristics (roof design, seating configuration, facades)
- Unique visual elements that make this stadium iconic
- Materials and textures visible in the structure

AESTHETIC QUALITIES:
- Color scheme and visual identity
- Lighting characteristics and atmosphere
- Proportions and scale relationships

Provide a detailed architectural description for NFT generation."""
            
            payload = {
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(
                self.openrouter_url,
                headers=self.openrouter_headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenRouter error: {response.status_code}")
            
            result = response.json()
            analysis_text = result['choices'][0]['message']['content']
            
            return {
                "architectural_description": analysis_text,
                "stadium_name": stadium_name,
                "analysis_type": "premium_nft_focused"
            }
            
        except Exception as e:
            print(f"❌ Analysis error: {e}")
            return {
                "error": str(e),
                "stadium_name": stadium_name
            }
    
    def generate_stadium_dalle3(self, prompt: str, quality: str = "standard") -> Dict[str, Any]:
        """Gera estádio usando DALL-E 3"""
        try:
            print(f"🎨 Generating stadium with DALL-E 3...")
            
            size = "1024x1024" if quality == "standard" else "1024x1792"
            dalle_quality = "standard" if quality == "standard" else "hd"
            
            response = self.openai_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size=size,
                quality=dalle_quality,
                response_format="b64_json"
            )
            
            image_b64 = response.data[0].b64_json
            cost = 0.04 if quality == "standard" else 0.08
            
            return {
                "success": True,
                "image_base64": image_b64,
                "cost": cost
            }
            
        except Exception as e:
            print(f"❌ Generation error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_from_reference(self, request: StadiumReferenceRequest) -> StadiumResponse:
        """Gera estádio baseado em referência"""
        try:
            total_cost = 0
            analysis = None
            reference_used = f"{request.stadium_id}_{request.reference_type}"
            
            # Carregar imagem de referência
            image_base64 = self.load_reference_image(request.stadium_id, request.reference_type)
            
            if image_base64:
                # Analisar referência
                analysis = self.analyze_reference_image(image_base64, request.stadium_id)
                total_cost += 0.01
                
                # Construir prompt baseado na análise
                if "architectural_description" in analysis:
                    base_prompt = analysis["architectural_description"]
                else:
                    base_prompt = f"A modern stadium similar to {request.stadium_id}"
                
                # Usar sistema de prompts premium
                enhanced_prompt = build_enhanced_stadium_prompt(
                    architectural_analysis=base_prompt,
                    style=request.generation_style,
                    perspective=request.perspective,
                    atmosphere=request.atmosphere,
                    time_of_day=request.time_of_day,
                    weather=request.weather
                )
                
                # Gerar imagem
                generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
                
                if generation_result["success"]:
                    total_cost += generation_result["cost"]
                    
                    return StadiumResponse(
                        success=True,
                        analysis=analysis,
                        generated_image_base64=generation_result["image_base64"],
                        reference_used=reference_used,
                        reference_source="local",
                        cost_usd=total_cost,
                        prompt_used=enhanced_prompt
                    )
                else:
                    return StadiumResponse(
                        success=False,
                        error=generation_result["error"]
                    )
            
            # Fallback para prompt customizado
            elif request.custom_prompt or request.custom_reference_base64:
                if request.custom_reference_base64:
                    analysis = self.analyze_reference_image(request.custom_reference_base64, "custom")
                    total_cost += 0.01
                    base_prompt = analysis.get("architectural_description", request.custom_prompt or "Modern stadium")
                else:
                    base_prompt = request.custom_prompt or "Modern stadium"
                
                enhanced_prompt = build_enhanced_stadium_prompt(
                    architectural_analysis=base_prompt,
                    style=request.generation_style,
                    perspective=request.perspective,
                    atmosphere=request.atmosphere,
                    time_of_day=request.time_of_day,
                    weather=request.weather
                )
                
                generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
                
                if generation_result["success"]:
                    total_cost += generation_result["cost"]
                    
                    return StadiumResponse(
                        success=True,
                        analysis=analysis,
                        generated_image_base64=generation_result["image_base64"],
                        reference_used="custom",
                        reference_source="custom",
                        cost_usd=total_cost,
                        prompt_used=enhanced_prompt
                    )
                else:
                    return StadiumResponse(
                        success=False,
                        error=generation_result["error"]
                    )
            
            else:
                return StadiumResponse(
                    success=False,
                    error=f"No reference found for {request.stadium_id} and no custom reference/prompt provided"
                )
                
        except Exception as e:
            return StadiumResponse(
                success=False,
                error=str(e)
            )
    
    def generate_custom(self, request: CustomStadiumRequest) -> StadiumResponse:
        """Gera estádio customizado"""
        try:
            total_cost = 0
            analysis = None
            
            # Analisar imagem de referência se fornecida
            if request.reference_image_base64:
                analysis = self.analyze_reference_image(request.reference_image_base64, "custom")
                total_cost += 0.01
                base_prompt = analysis.get("architectural_description", request.prompt)
            else:
                base_prompt = request.prompt
            
            # Construir prompt aprimorado
            enhanced_prompt = build_enhanced_stadium_prompt(
                architectural_analysis=base_prompt,
                style=request.generation_style,
                perspective=request.perspective,
                atmosphere=request.atmosphere,
                time_of_day=request.time_of_day
            )
            
            # Gerar imagem
            generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
            
            if generation_result["success"]:
                total_cost += generation_result["cost"]
                
                return StadiumResponse(
                    success=True,
                    analysis=analysis,
                    generated_image_base64=generation_result["image_base64"],
                    reference_used="custom_prompt",
                    reference_source="custom",
                    cost_usd=total_cost,
                    prompt_used=enhanced_prompt
                )
            else:
                return StadiumResponse(
                    success=False,
                    error=generation_result["error"]
                )
                
        except Exception as e:
            return StadiumResponse(
                success=False,
                error=str(e)
            )

# --- SISTEMA DE ANÁLISE DE IMAGEM (Vision Analysis) ---
class VisionAnalysisSystem:
    """
    Sistema para análise de imagens usando modelos Vision (OpenRouter/OpenAI).
    Modificado para aceitar diretamente URLs de imagem.
    """
    def __init__(self):
        # Tenta carregar a chave da API do OpenRouter, com fallback para OpenAI
        self.api_key = os.getenv("OPENROUTER_API_KEY", os.getenv("OPENAI_API_KEY"))
        self.api_base = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        # CORRIGIDO: Usar o cliente AsyncOpenAI para chamadas 'await'
        self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.api_base)
        print("✅ Vision Analysis System initialized.")

    async def analyze_image_with_vision(self, image_url: str, prompt: str, model: str = "openai/gpt-4o-mini") -> Dict[str, Any]:
        """
        Analisa uma imagem a partir de uma URL usando um modelo de visão.
        """
        print(f"👁️  [VISION] Iniciando análise com o modelo '{model}' para a URL: {image_url}")
        try:
            # Chama o método principal de análise, agora passando a URL
            return await self._analyze_with_provider(image_url=image_url, prompt=prompt, model=model)
        except Exception as e:
            print(f"❌ [VISION] Erro inesperado na análise da imagem: {e}")
            return {"success": False, "error": str(e)}

    async def _analyze_with_provider(self, image_url: str, prompt: str, model: str) -> Dict[str, Any]:
        """
        Lógica central que interage com a API (OpenAI/OpenRouter) usando uma URL de imagem.
        """
        start_time = time.time()
        try:
            chat_completion = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url, # Passa a URL diretamente
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            analysis_content = chat_completion.choices[0].message.content
            print(f"✅ [VISION] Análise recebida em {duration:.2f} segundos.")
            
            return {
                "success": True,
                "analysis": analysis_content,
                "model_used": model,
            }
        except Exception as e:
            print(f"❌ [VISION] Falha na chamada da API para o modelo '{model}': {e}")
            return {"success": False, "error": f"API call failed: {e}"}

# --- CONFIGURAÇÃO DA API FASTAPI ---
app = FastAPI(title="Unified API - Jerseys + Stadiums", version="1.0.0")

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000", 
    "https://localhost:3000",
    "https://jersey-generator-ai2-git-master-jeffnight15s-projects.vercel.app",
    "https://jersey-generator-ai2.vercel.app",
    "https://*.vercel.app",
    "https://*.netlify.app",
    "https://*.railway.app",
    "https://*.render.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Inicializar geradores
jersey_generator = JerseyGenerator()
stadium_generator = StadiumReferenceGenerator()
vision_analysis_system = VisionAnalysisSystem()

# Incluir router de geração de imagens
app.include_router(generate_image_router, prefix="/api", tags=["image-generation"])

# --- ENDPOINTS PRINCIPAIS ---
@app.get("/")
async def root():
    return {
        "status": "online", 
        "service": "Unified API - Jerseys + Stadiums + Vision Analysis", 
        "version": "1.3.0",
        "endpoints": {
            "jerseys": "/generate, /generate-vision-enhanced, /complete-vision-flow, /teams",
            "stadiums": "/stadiums, /generate-from-reference, /generate-custom",
            "vision": "/analyze-image",
            "images": "/api/generate-image, /api/models"
        },
        "features": [
            "Jersey Generation (DALL-E 3)",
            "Vision-Enhanced Jersey Generation",
            "JSON-Validated Vision Analysis", 
            "Direct DALL-E 3 Image Generation",
            "OpenRouter & OpenAI Support",
            "Stadium Generation with References", 
            "Image Analysis (Vision AI)"
        ]
    }

# --- ENDPOINTS DE JERSEYS ---
@app.post("/generate", response_model=GenerationResponse)
async def generate_jersey_endpoint(request: ImageGenerationRequest):
    try:
        image_base64 = jersey_generator.generate_image(request)
        return GenerationResponse(
            success=True,
            image_base64=image_base64,
            cost_usd=0.045
        )
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-vision-enhanced", response_model=GenerationResponse)
async def generate_vision_enhanced_jersey(request: VisionEnhancedGenerationRequest):
    """Endpoint para geração de jersey usando análise Vision otimizada"""
    try:
        print(f"🎨 [VISION ENHANCED] Starting generation with analysis")
        
        if not request.vision_analysis:
            raise HTTPException(status_code=400, detail="vision_analysis é obrigatório para modo vision_enhanced")
        
        # ✅ Usar nova função otimizada para gerar prompt
        optimized_prompt = generate_dalle_prompt_from_analysis(
            request.vision_analysis,
            request.player_name,
            request.player_number
        )
        
        print(f"🎨 [VISION ENHANCED] Generated optimized prompt: {len(optimized_prompt)} chars")
        print(f"🎨 [VISION ENHANCED] Prompt preview: {optimized_prompt[:200]}...")
        
        # Gerar usando DALL-E 3 com prompt otimizado
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        
        generation_response = openai_client.images.generate(
            model="dall-e-3",
            prompt=optimized_prompt,
            size="1024x1024",
            quality=request.quality,
            n=1
        )
        
        image_url = generation_response.data[0].url
        img_response = requests.get(image_url, timeout=60)
        
        if img_response.status_code == 200:
            image = Image.open(BytesIO(img_response.content))
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            image_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            print(f"✅ [VISION ENHANCED] Generation successful")
            
            return GenerationResponse(
                success=True,
                image_base64=image_base64,
                cost_usd=0.045
            )
        else:
            raise Exception(f"Erro ao baixar imagem do DALL-E 3: {img_response.status_code}")
            
    except Exception as e:
        print(f"❌ [VISION ENHANCED] Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-vision-flow", response_model=GenerationResponse)
async def complete_vision_flow(request: CompleteVisionFlowRequest):
    """
    Endpoint completo: Análise Vision + Geração de Prompt + DALL-E 3
    Faz todo o fluxo em uma única chamada
    """
    try:
        print(f"🔄 [COMPLETE FLOW] Starting complete vision flow")
        print(f"🔄 [COMPLETE FLOW] Player: {request.player_name} #{request.player_number}")
        print(f"🔄 [COMPLETE FLOW] Sport: {request.sport}, View: {request.view}")
        
        # Usar prompt de análise descritivo e flexível
        analysis_prompt = f"""
Você é um especialista em design de camisas de futebol. Observe a imagem da jersey cuidadosamente e descreva em detalhes todos os elementos visuais e estilísticos presentes na parte de trás da camisa.

Inclua:
- cores dominantes e secundárias
- padrões visuais (ex: faixas horizontais, diagonais, símbolos)
- estilo e posição do nome e número
- formato da gola, mangas e possíveis texturas
- qualquer detalhe adicional como símbolos ocultos, mensagens, datas, brasões, inscrições ou costuras visíveis

Seja técnico, descritivo e preciso. Não invente, apenas descreva o que está visivelmente presente.
A resposta deve ser clara e separada por tópicos, sem formato de JSON.
"""
        print(f"✅ [COMPLETE FLOW] Using flexible descriptive analysis prompt")
        
        # ETAPA 1: Análise Vision
        print(f"🔍 [COMPLETE FLOW] Step 1: Vision Analysis")
        vision_result = await vision_analysis_system.analyze_image_with_vision(
            request.image_base64,
            analysis_prompt,
            request.model
        )
        
        if not vision_result["success"]:
            raise Exception(f"Vision analysis failed: {vision_result.get('error')}")
        
        analysis_text = vision_result["analysis"]
        print(f"✅ [COMPLETE FLOW] Analysis completed: {type(analysis_text)}")
        print(f"📝 [COMPLETE FLOW] Analysis preview: {str(analysis_text)[:200]}...")
        
        # A análise agora é texto descritivo, não JSON
        if not analysis_text or len(str(analysis_text).strip()) < 50:
            print(f"⚠️ [COMPLETE FLOW] Analysis too short, using fallback")
            analysis_text = f"Professional {request.sport} jersey with modern design, featuring team colors and standard athletic fit. Clean back view with space for player name and number placement."
        
        # ETAPA 2: Geração de Prompt Otimizado usando NOVA COMPOSIÇÃO
        print(f"🎨 [COMPLETE FLOW] Step 2: Generate optimized prompt using NEW COMPOSITION with sport-specific base prompts")
        
        # Validar e limpar dados do jogador
        player_name_clean = (request.player_name or "").strip()
        player_number_clean = (request.player_number or "").strip()
        
        # Usar valores padrão se vazios
        if not player_name_clean:
            player_name_clean = "PLAYER"
        if not player_number_clean:
            player_number_clean = "00"
            
        print(f"👤 [COMPLETE FLOW] Player data: name='{player_name_clean}', number='{player_number_clean}'")
        print(f"🏃‍♂️ [COMPLETE FLOW] Using NEW COMPOSITION: sport={request.sport}, view={request.view}")
        
        # USAR NOVA FUNÇÃO DE COMPOSIÇÃO COM PROMPTS BASE ESPECÍFICOS
        optimized_prompt = compose_vision_enhanced_prompt(
            sport=request.sport,
            view=request.view,
            player_name=player_name_clean,
            player_number=player_number_clean,
            analysis_text=analysis_text,
            style="classic"
        )
        
        print(f"✅ [COMPLETE FLOW] Prompt generated: {len(optimized_prompt)} chars")
        
        # ETAPA 3: Geração de Imagem
        print(f"🖼️ [COMPLETE FLOW] Step 3: Generate image with DALL-E 3")
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        
        generation_response = openai_client.images.generate(
            model="dall-e-3",
            prompt=optimized_prompt,
            size="1024x1024",
            quality=request.quality,
            n=1
        )
        
        image_url = generation_response.data[0].url
        img_response = requests.get(image_url, timeout=60)
        
        if img_response.status_code == 200:
            image = Image.open(BytesIO(img_response.content))
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            image_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            print(f"✅ [COMPLETE FLOW] Complete flow successful!")
            
            return {
                "success": True,
                "image_url": image_url,
                "image_base64": image_base64,
                "analysis": analysis_text,
                "prompt": optimized_prompt,
                "cost_usd": 0.08 if request.quality == "hd" else 0.04,
                "player_name_used": player_name_clean,
                "player_number_used": player_number_clean
            }
        else:
            raise Exception(f"Erro ao baixar imagem do DALL-E 3: {img_response.status_code}")
            
    except Exception as e:
        print(f"❌ [COMPLETE FLOW] Complete flow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/teams")
async def get_available_teams():
    """Lista times disponíveis para jerseys"""
    image_dir = Path("image_references")
    if not image_dir.is_dir():
        return {"error": "Image references directory not found."}

    teams = []
    for subdir in image_dir.iterdir():
        if subdir.is_dir():
            team_name = subdir.name.replace("_", " ").title()
            teams.append(team_name)
    
    return sorted(teams)

# --- ENDPOINTS DE STADIUMS ---
@app.get("/stadiums", response_model=List[StadiumInfo])
async def list_stadiums():
    """Lista estádios disponíveis"""
    try:
        stadiums = stadium_generator.get_available_stadiums()
        return stadiums
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-from-reference", response_model=StadiumResponse)
async def generate_stadium_from_reference(request: StadiumReferenceRequest):
    """Gera estádio baseado em referência local"""
    try:
        result = stadium_generator.generate_from_reference(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-custom", response_model=StadiumResponse)
async def generate_custom_stadium(request: CustomStadiumRequest):
    """Gera estádio customizado"""
    try:
        result = stadium_generator.generate_custom(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- VISION ANALYSIS ENDPOINT ---
@app.post("/analyze-image", response_model=VisionAnalysisResponse)
async def analyze_image_endpoint(request: VisionAnalysisRequest):
    """Endpoint para análise de imagem - unificado na API principal"""
    try:
        print(f"🔍 [VISION ANALYSIS] Received request: model={request.model}, prompt_length={len(request.prompt)}")
        
        result = await vision_analysis_system.analyze_image_with_vision(
            request.image_base64,
            request.prompt,
            request.model
        )
        
        if result["success"]:
            print(f"✅ [VISION ANALYSIS] Analysis completed successfully")
            return VisionAnalysisResponse(
                success=True,
                analysis=result["analysis"],
                model_used=result["model_used"],
                cost_estimate=result.get("cost_estimate", 0)
            )
        else:
            print(f"❌ [VISION ANALYSIS] Analysis failed: {result.get('error')}")
            return VisionAnalysisResponse(
                success=False,
                error=result.get("error", "Vision analysis failed")
            )
            
    except Exception as e:
        print(f"❌ [VISION ANALYSIS] Endpoint error: {str(e)}")
        return VisionAnalysisResponse(
            success=False,
            error=str(e)
        )

# --- HEALTH CHECK ---
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now()}

@app.get("/test-connection")
async def test_connection():
    """Endpoint de teste para verificar a conexão do servidor."""
    print("✅ /test-connection endpoint foi acessado com sucesso!")
    return {"message": "Conexão com o servidor Python (main.py) bem-sucedida!"}

@app.post("/generate-jersey-from-reference", response_model=ReferenceGenerationResponse)
async def generate_jersey_from_reference(request: GenerateFromReferenceRequest):
    """
    Gera uma camisa usando uma referência de time do banco de dados.
    Busca o `teamBasePrompt` e as `referenceImages` do MongoDB.
    """
    print(f"✅ [DB] Rota /generate-jersey-from-reference chamada para o time: '{request.teamName}'")

    if db is None:
        print("❌ [DB] ERRO: Conexão com o banco de dados não disponível.")
        raise HTTPException(status_code=500, detail="Database connection is not available.")

    try:
        query_name = request.teamName.strip()
        print(f"🔍 [DB] Buscando referência para '{query_name}' na coleção 'team_references'...")
        
        team_reference = db.team_references.find_one({"teamName": {"$regex": f"^{query_name}$", "$options": "i"}})

        if not team_reference:
            print(f"❌ [DB] ERRO: Time '{query_name}' não foi encontrado na coleção 'team_references' (busca case-insensitive).")
            raise HTTPException(status_code=404, detail=f"Team '{query_name}' not found in database.")

        print(f"✅ [DB] Referência encontrada para '{query_name}'.")
        
        metadata = team_reference.get("metadata", {})
        team_base_prompt = metadata.get("teamBasePrompt", "")
        
        if not team_base_prompt:
            print(f"⚠️ [DB] Alerta: `teamBasePrompt` está vazio ou ausente para o time '{query_name}'.")

        # --- INÍCIO DA LÓGICA DA FASE 2 ---
        reference_images = team_reference.get("referenceImages", [])
        image_url_to_analyze = None
        if reference_images and isinstance(reference_images, list) and len(reference_images) > 0:
            image_url_to_analyze = reference_images[0].get("url")
        
        if not image_url_to_analyze:
            print("❌ [VISION] ERRO: Nenhuma URL de imagem de referência encontrada. Abortando análise Vision.")
            raise HTTPException(status_code=400, detail="Reference image URL is missing.")

        print(f"🖼️ [VISION] Iniciando análise para a imagem: {image_url_to_analyze}")
        
        # 1. Chamar o sistema de análise Vision (agora passando a URL diretamente)
        vision_analyzer = VisionAnalysisSystem()
        analysis_prompt = "Analyze this soccer jersey image. Describe its main colors, pattern (stripes, solid, etc.), collar style, and any other relevant visual details. Be descriptive and concise."
        
        vision_result = await vision_analyzer.analyze_image_with_vision(
            image_url=image_url_to_analyze, # Passa a URL
            prompt=analysis_prompt
        )

        if not vision_result.get("success"):
            error_msg = vision_result.get("error", "Unknown vision analysis error.")
            print(f"❌ [VISION] ERRO na análise: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Vision analysis failed: {error_msg}")

        analysis_text = vision_result["analysis"]
        print(f"✅ [VISION] Análise concluída com sucesso:\n{analysis_text}")

        # 3. Combinar os prompts
        # Corrigido: `base_prompt` não é um argumento esperado. A função usa sport/view.
        final_prompt = compose_vision_enhanced_prompt(
            analysis_text=analysis_text,
            player_name=request.player_name,
            player_number=request.player_number,
            sport=request.sport,
            view=request.view,
            style=request.quality # 'quality' na UI pode mapear para 'style' aqui
        )
        print("✅ [PROMPT] Super-prompt combinado gerado com sucesso.")

        # --- ETAPA FINAL: GERAÇÃO COM DALL-E 3 ---
        print("🤖 [DALL-E] Iniciando a geração final da imagem...")
        dalle_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        try:
            generation_response = dalle_client.images.generate(
                model="dall-e-3",
                prompt=final_prompt,
                size="1024x1024",
                quality=request.quality,
                n=1,
                response_format="url"
            )
            
            generated_image_url = generation_response.data[0].url
            print(f"✅ [DALL-E] Imagem gerada com sucesso. Baixando para processamento...")

            # Etapa extra para resolver CORS: O backend baixa a imagem e converte
            image_response = requests.get(generated_image_url)
            image_response.raise_for_status() # Garante que o download foi bem sucedido
            
            image_base64 = base64.b64encode(image_response.content).decode("utf-8")
            print("✅ [PROCESS] Imagem convertida para base64.")

            # --- ETAPA DE UPLOAD E SALVAMENTO NO DB ---
            try:
                print("📤 [CLOUDINARY] Iniciando upload...")
                upload_result = cloudinary.uploader.upload(
                    f"data:image/png;base64,{image_base64}",
                    folder="jerseys_generated",
                    public_id=f"{request.teamName.replace(' ', '_')}_{request.player_name}_{int(time.time())}"
                )
                cloudinary_url = upload_result.get("secure_url")
                print(f"✅ [CLOUDINARY] Upload concluído: {cloudinary_url}")

                print("💾 [DB] Salvando a nova camisa na coleção 'jerseys'...")
                jerseys_collection = db["jerseys"]
                new_jersey_doc = {
                    "name": f"{request.teamName} - {request.player_name} #{request.player_number}",
                    "description": f"AI-generated {request.teamName} jersey for {request.player_name} #{request.player_number}. Style: {request.quality}. Based on Vision analysis.",
                    "imageUrl": cloudinary_url,
                    "teamName": request.teamName,
                    "playerName": request.player_name,
                    "playerNumber": request.player_number,
                    "style": request.quality,
                    "generationType": "vision_reference",
                    "promptUsed": final_prompt,
                    "createdAt": datetime.utcnow(),
                    "createdBy": "system_vision_flow"
                }
                jerseys_collection.insert_one(new_jersey_doc)
                print("✅ [DB] Nova camisa salva com sucesso no MongoDB.")

            except Exception as post_processing_error:
                # Opcional: Se o upload ou o salvamento falharem, não quebramos a experiência do usuário.
                # A imagem ainda é retornada. Apenas registramos o erro no log do servidor.
                print(f"⚠️ [POST-PROCESS] Alerta: Falha no upload para Cloudinary ou salvamento no DB: {post_processing_error}")
                print("⚠️ [POST-PROCESS] A imagem gerada ainda será retornada para o usuário.")

            # Retorna a imagem em base64 para o frontend, independentemente do sucesso do post-processing
            return ReferenceGenerationResponse(
                success=True,
                image_base64=image_base64,
                prompt=final_prompt
            )

        except Exception as dalle_error:
            print(f"❌ [DALL-E] Erro durante a geração ou download: {dalle_error}")
            raise HTTPException(status_code=500, detail=f"DALL-E process failed: {dalle_error}")

    except Exception as e:
        print(f"❌ [CRITICAL] Erro crítico na rota: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")

# --- PONTO DE ENTRADA DA APLICAÇÃO ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Unified API (Jerseys + Stadiums) on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000) 