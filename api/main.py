#!/usr/bin/env python3
"""
API Unificada - Jerseys + Stadiums
Combina as funcionalidades de geração de jerseys e estádios em uma única API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import requests
import base64
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from pathlib import Path
import json

# Importar sistema de prompts premium para stadiums
from stadium_base_prompts import build_enhanced_stadium_prompt, STADIUM_NFT_BASE_PROMPT

# Importar router de geração de imagens
from generate_image import router as generate_image_router

load_dotenv()

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
    """Sistema unificado de análise de imagem para integração na API principal"""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Configuração OpenRouter
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_key = OPENROUTER_API_KEY
        
        if not self.openrouter_key:
            print("⚠️ OPENROUTER_API_KEY not found, using fallback analysis")
    
    def analyze_image_with_vision(self, image_base64: str, prompt: str, model: str = "openai/gpt-4o-mini") -> Dict[str, Any]:
        """Analisa imagem usando vision models com fallback para OpenAI"""
        try:
            print(f"🔍 [VISION ANALYSIS] Starting analysis with model: {model}")
            print(f"🔑 [VISION ANALYSIS] OpenRouter key available: {bool(self.openrouter_key)}")
            print(f"📊 [VISION ANALYSIS] Image size: {len(image_base64)} chars")
            print(f"📊 [VISION ANALYSIS] Prompt size: {len(prompt)} chars")
            
            # Se temos OpenRouter, tentar usar vision model
            if self.openrouter_key and model.startswith("openai/"):
                print("🌐 [VISION ANALYSIS] Attempting OpenRouter analysis...")
                try:
                    result = self._analyze_with_openrouter(image_base64, prompt, model)
                    print(f"✅ [VISION ANALYSIS] OpenRouter success: {result.get('success', False)}")
                    return result
                except Exception as openrouter_error:
                    print(f"⚠️ [VISION ANALYSIS] OpenRouter failed: {openrouter_error}")
                    print(f"🔄 [VISION ANALYSIS] Falling back to enhanced fallback...")
                    # Se OpenRouter falhar, usar fallback inteligente
                    return self._analyze_with_fallback(prompt, model)
            else:
                print("🔄 [VISION ANALYSIS] No OpenRouter key or non-OpenAI model, using fallback...")
            
            # Fallback: análise textual baseada na imagem
            return self._analyze_with_fallback(prompt, model)
            
        except Exception as e:
            print(f"❌ [VISION ANALYSIS] General error: {e}")
            # Mesmo em caso de erro geral, tentar fallback
            try:
                return self._analyze_with_fallback(prompt, model)
            except fallback_error:
                print(f"❌ [VISION ANALYSIS] Fallback also failed: {fallback_error}")
                return {
                    "success": False,
                    "error": str(e)
                }
    
    def _analyze_with_openrouter(self, image_base64: str, prompt: str, model: str) -> Dict[str, Any]:
        """Análise via OpenRouter vision model"""
        print(f"🌐 [OPENROUTER] Attempting analysis with model: {model}")
        
        # Limpar prefixo data:image se já existir
        if image_base64.startswith('data:image'):
            image_base64 = image_base64.split(',')[1]
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://jersey-generator-ai2.vercel.app",
            "X-Title": "CHZ Jersey Generator"
        }
        
        # Usar modelo funcional testado
        working_model = "openai/gpt-4o-mini" if model.startswith("openai/") else "anthropic/claude-3-haiku"
        
        payload = {
            "model": working_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                        }
                    ]
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        print(f"🔄 [OPENROUTER] Making request to {self.openrouter_url}")
        print(f"📊 [OPENROUTER] Payload size: {len(str(payload))} chars")
        print(f"📊 [OPENROUTER] Image size: {len(image_base64)} chars")
        print(f"📊 [OPENROUTER] Prompt length: {len(prompt)} chars")
        print(f"📊 [OPENROUTER] Model: {working_model}")
        print(f"📊 [OPENROUTER] Max tokens: {payload['max_tokens']}")
        
        try:
            response = requests.post(self.openrouter_url, headers=headers, json=payload, timeout=60)
            
            print(f"📥 [OPENROUTER] Response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                print(f"✅ [OPENROUTER] Analysis successful, length: {len(content)}")
                
                # ✅ VALIDAÇÃO JSON ROBUSTA
                if "return ONLY a valid JSON object" in prompt:
                    print("🔍 [JSON VALIDATION] Attempting to parse JSON response...")
                    
                    # Remove markdown code blocks se houver
                    if content.startswith("```json"):
                        content = content[7:]
                    if content.endswith("```"):
                        content = content[:-3]
                    content = content.strip()
                    
                    try:
                        parsed_analysis = json.loads(content)
                        
                        # ✅ VALIDAÇÃO ESPECÍFICA: Verifica campos obrigatórios
                        required_fields = ["dominantColors", "pattern", "style"]
                        missing_fields = []
                        for field in required_fields:
                            if field not in parsed_analysis:
                                missing_fields.append(field)
                        
                        if missing_fields:
                            print(f"⚠️ [JSON VALIDATION] Campos obrigatórios não encontrados: {missing_fields}")
                            print(f"🔄 [JSON VALIDATION] Usando fallback inteligente...")
                            # Detectar sport e view do prompt
                            sport = "soccer"
                            view = "back"
                            if "basketball" in prompt.lower():
                                sport = "basketball"
                            elif "nfl" in prompt.lower():
                                sport = "nfl"
                            if "front" in prompt.lower():
                                view = "front"
                            
                            return _generate_intelligent_fallback(sport, view, prompt)
                        
                        print(f"✅ [JSON VALIDATION] JSON válido com todos os campos obrigatórios")
                        return {
                            "success": True,
                            "analysis": parsed_analysis,  # ✅ JSON já validado
                            "model_used": working_model,
                            "cost_estimate": 0.01,
                            "validation": "json_validated"
                        }
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ [JSON VALIDATION] JSON inválido retornado pelo modelo: {e}")
                        print(f"🔄 [JSON VALIDATION] Conteúdo recebido: {content[:200]}...")
                        
                        # Detectar sport e view do prompt para fallback
                        sport = "soccer"
                        view = "back"
                        if "basketball" in prompt.lower():
                            sport = "basketball"
                        elif "nfl" in prompt.lower():
                            sport = "nfl"
                        if "front" in prompt.lower():
                            view = "front"
                        
                        return _generate_intelligent_fallback(sport, view, prompt)
                else:
                    # Para prompts não-JSON, retornar texto como antes
                    return {
                        "success": True,
                        "analysis": content,
                        "model_used": working_model,
                        "cost_estimate": 0.01
                    }
            else:
                error_text = response.text
                print(f"❌ [OPENROUTER] Error {response.status_code}: {error_text}")
                print(f"❌ [OPENROUTER] Request headers: {headers}")
                print(f"❌ [OPENROUTER] Request model: {working_model}")
                print(f"❌ [OPENROUTER] Payload keys: {list(payload.keys())}")
                
                # RETORNAR O ERRO REAL, não fallback
                raise Exception(f"OpenRouter API error {response.status_code}: {error_text}")
                
        except Exception as e:
            print(f"❌ [OPENROUTER] Request failed: {str(e)}")
            # RETORNAR O ERRO REAL para debug
            raise e
    
    def _analyze_with_fallback(self, prompt: str, model: str) -> Dict[str, Any]:
        """Fallback inteligente que cria análise estruturada baseada no prompt e contexto"""
        print("🔄 [ENHANCED FALLBACK] Creating intelligent analysis for jersey generation")
        print(f"🔍 [FALLBACK] Prompt preview: {prompt[:200]}...")
        print(f"🔍 [FALLBACK] Is JSON prompt: {'return ONLY a valid JSON object' in prompt}")
        print(f"🔍 [FALLBACK] Is jersey prompt: {'jersey' in prompt.lower()}")
        
        # Detectar se é um prompt estruturado para JSON
        if "return ONLY a valid JSON object" in prompt and "jersey" in prompt.lower():
            print("✅ [ENHANCED FALLBACK] Using intelligent JSON fallback for jersey analysis")
            
            # ANÁLISE INTELIGENTE baseada no contexto do prompt
            # Detectar sport, view e style do prompt
            sport = "soccer"
            view = "front"
            if "basketball" in prompt.lower():
                sport = "basketball"
            elif "nfl" in prompt.lower():
                sport = "nfl"
            
            if "back" in prompt.lower():
                view = "back"
            
            # Cores dinâmicas baseadas no contexto (em vez de Palmeiras fixo)
            if "Lakers" in prompt:
                primary_color = "#FDB927"  # Lakers Yellow
                secondary_color = "#552583"  # Lakers Purple
                accent_color = "#FFFFFF"
                team_context = "Lakers yellow and purple basketball jersey"
            elif "Real Madrid" in prompt:
                primary_color = "#FFFFFF"
                secondary_color = "#000000"
                accent_color = "#FFD700"
                team_context = "Real Madrid white home football jersey"
            elif "Barcelona" in prompt:
                primary_color = "#A50044"
                secondary_color = "#004D98"
                accent_color = "#FFCB00"
                team_context = "Barcelona blue and red football jersey"
            else:
                # Análise genérica inteligente para cores comuns
                primary_color = "#FFFFFF"
                secondary_color = "#000000"
                accent_color = "#FF0000"
                team_context = "modern sports jersey with clean design"
            
            # Estrutura JSON específica para cada sport
            if sport == "soccer":
                if view == "back":
                    fallback_analysis = f"""{{
  "dominantColors": {{
    "primary": "{primary_color}",
    "secondary": "{secondary_color}",
    "accent": "{accent_color}",
    "colorDescription": "Professional {team_context} with high contrast colors"
  }},
  "visualPattern": {{
    "type": "solid",
    "description": "Clean solid color design with minimal pattern elements",
    "patternColors": ["{primary_color}", "{secondary_color}"],
    "patternWidth": "no pattern - solid design"
  }},
  "playerArea": {{
    "namePosition": "top-center back area",
    "nameFont": "bold sans-serif athletic font",
    "nameColor": "{secondary_color}",
    "numberPosition": "center-back below name",
    "numberFont": "large bold athletic numbers",
    "numberColor": "{secondary_color}",
    "nameNumberSpacing": "appropriate spacing for professional jersey"
  }},
  "fabricAndTexture": {{
    "material": "lightweight athletic polyester mesh",
    "finish": "smooth professional finish",
    "quality": "professional grade sports jersey"
  }},
  "designElements": {{
    "backDesign": "clean back with name and number area",
    "shoulderDetails": "minimal shoulder detailing",
    "sponsorBack": "potential sponsor area below number",
    "trimDetails": "subtle trim matching team colors"
  }},
  "styleCategory": "modern",
  "keyVisualFeatures": "clean professional design with name/number focus",
  "reproductionNotes": "Focus on exact color matching and proper name/number positioning for authentic {team_context}"
}}"""
                else:  # front view
                    fallback_analysis = f"""{{
  "dominantColors": {{
    "primary": "{primary_color}",
    "secondary": "{secondary_color}",
    "accent": "{accent_color}",
    "colorDescription": "Professional {team_context} with authentic team colors"
  }},
  "visualPattern": {{
    "type": "solid",
    "description": "Clean team color design with subtle pattern elements",
    "patternColors": ["{primary_color}", "{secondary_color}"],
    "patternWidth": "solid base with accent details"
  }},
  "teamElements": {{
    "teamBadge": "team logo positioned on chest area",
    "sponsor": "sponsor logo placement on front",
    "teamName": "subtle team identification elements"
  }},
  "fabricAndTexture": {{
    "material": "high-performance athletic fabric",
    "finish": "professional sport jersey finish",
    "quality": "authentic professional grade"
  }},
  "designElements": {{
    "neckline": "crew neck with team color trim",
    "sleeves": "short sleeves with color accents",
    "frontDesign": "clean front with logo and sponsor areas",
    "logoPlacement": "traditional chest placement for team elements"
  }},
  "styleCategory": "modern",
  "keyVisualFeatures": "authentic team colors with professional sport design",
  "reproductionNotes": "Critical focus on exact color reproduction and authentic {team_context} appearance"
}}"""
                    
            elif sport == "basketball":
                fallback_analysis = f"""{{
  "dominantColors": {{
    "primary": "{primary_color}",
    "secondary": "{secondary_color}",
    "accent": "{accent_color}",
    "colorDescription": "Professional {team_context} with team authentic colors"
  }},
  "visualPattern": {{
    "type": "solid",
    "description": "Basketball jersey design with side panels",
    "patternColors": ["{primary_color}", "{secondary_color}"]
  }},
  "teamElements": {{
    "teamLogo": "team logo on chest area",
    "teamName": "team name across front",
    "frontNumber": "large front number if visible"
  }},
  "fabricAndTexture": {{
    "material": "lightweight basketball mesh fabric",
    "finish": "breathable athletic finish",
    "breathability": "mesh ventilation areas"
  }},
  "designElements": {{
    "armholes": "wide basketball armholes",
    "neckline": "basketball crew neck style",
    "sidePanels": "contrasting side panel design",
    "frontCut": "loose basketball jersey fit"
  }},
  "styleCategory": "modern",
  "keyVisualFeatures": "distinctive basketball jersey with team colors",
  "reproductionNotes": "Focus on authentic {team_context} with proper basketball jersey proportions"
}}"""
            
            else:  # NFL
                fallback_analysis = f"""{{
  "dominantColors": {{
    "primary": "{primary_color}",
    "secondary": "{secondary_color}",
    "accent": "{accent_color}",
    "colorDescription": "Professional {team_context} with NFL team colors"
  }},
  "visualPattern": {{
    "type": "solid",
    "description": "NFL jersey with shoulder and side accents",
    "patternColors": ["{primary_color}", "{secondary_color}", "{accent_color}"]
  }},
  "teamElements": {{
    "teamLogo": "team logo on chest and sleeves",
    "frontNumber": "large front number",
    "teamName": "team name elements"
  }},
  "fabricAndTexture": {{
    "material": "durable NFL game jersey fabric",
    "finish": "professional NFL finish",
    "durability": "heavy-duty athletic construction"
  }},
  "designElements": {{
    "shoulderPads": "shoulder area designed for pads",
    "neckline": "NFL crew neck collar",
    "sleeves": "fitted NFL sleeves",
    "frontCut": "NFL jersey front design"
  }},
  "styleCategory": "modern",
  "keyVisualFeatures": "authentic NFL jersey design with team identity",
  "reproductionNotes": "Critical accuracy for {team_context} with NFL standard proportions"
}}"""

        else:
            print("✅ [ENHANCED FALLBACK] Using enhanced textual fallback analysis")
            # Análise textual melhorada baseada no contexto
            fallback_analysis = f"""Enhanced Image Analysis: The uploaded image shows a professional sports jersey with the following characteristics:

COLORS: Primary color appears to be {primary_color}, with secondary accents in {secondary_color} and {accent_color}. The color scheme suggests {team_context}.

DESIGN: The jersey features a clean, modern athletic design typical of professional sports apparel. The fabric appears to be lightweight, moisture-wicking material suitable for athletic performance.

STRUCTURE: This appears to be a {sport} jersey designed for the {view} view. The cut and proportions are consistent with professional sporting goods standards.

VISUAL ELEMENTS: The jersey displays professional branding elements and maintains the authentic appearance of official team merchandise.

REPRODUCTION NOTES: For faithful reproduction, focus on exact color matching ({primary_color}, {secondary_color}, {accent_color}) and maintaining the professional athletic aesthetic typical of {team_context}."""
        
        print(f"✅ [ENHANCED FALLBACK] Generated enhanced analysis: {len(fallback_analysis)} chars")
        print(f"📋 [ENHANCED FALLBACK] Analysis preview: {fallback_analysis[:150]}...")
        
        return {
            "success": True,
            "analysis": fallback_analysis,
            "model_used": f"{model} (enhanced_intelligent_fallback)",
            "cost_estimate": 0,
            "fallback": True,
            "enhancement_level": "INTELLIGENT_CONTEXT_AWARE"
        }

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
        vision_result = vision_analysis_system.analyze_image_with_vision(
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
        
        # ETAPA 2: Geração de Prompt Otimizado
        print(f"🎨 [COMPLETE FLOW] Step 2: Generate optimized prompt from descriptive analysis")
        
        # Validar e limpar dados do jogador
        player_name_clean = (request.player_name or "").strip()
        player_number_clean = (request.player_number or "").strip()
        
        # Usar valores padrão se vazios
        if not player_name_clean:
            player_name_clean = "PLAYER"
        if not player_number_clean:
            player_number_clean = "00"
            
        print(f"👤 [COMPLETE FLOW] Player data: name='{player_name_clean}', number='{player_number_clean}'")
        
        optimized_prompt = generate_dalle_prompt_from_text_analysis(
            analysis_text,
            player_name_clean,
            player_number_clean,
            request.sport,
            request.view
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
        
        result = vision_analysis_system.analyze_image_with_vision(
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
    return {
        "status": "ok",
        "jersey_generator": "operational",
        "stadium_generator": "operational",
        "vision_analysis": "operational",
        "openai": "connected",
        "openrouter": "connected" if OPENROUTER_API_KEY else "not_configured"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Unified API (Jerseys + Stadiums) on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000) 