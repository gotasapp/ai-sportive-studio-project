#!/usr/bin/env python3
"""
API Unificada - Jerseys + Stadiums para Render Deploy
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

load_dotenv()

# Configurações
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
STADIUM_REFERENCES_PATH = Path("stadium_references")

# --- STADIUM PROMPTS SYSTEM (inline for Render) ---
STADIUM_NFT_BASE_PROMPT_EXTERNAL = """
Create a premium NFT-quality stadium image featuring: {architectural_analysis}

VISUAL REQUIREMENTS:
- Stunning architectural photography showcasing stadium grandeur
- Professional sports venue composition with perfect lighting
- Ultra-high resolution detail suitable for NFT artwork
- Dramatic perspective highlighting architectural excellence
- Clean composition without text, logos, or distracting elements

TECHNICAL SPECS:
- Hyperrealistic architectural rendering
- Premium NFT artwork quality with exceptional detail
- Professional stadium photography aesthetic
- Perfect lighting and atmospheric conditions
"""

STADIUM_STYLE_PROMPTS = {
    "realistic_external": STADIUM_NFT_BASE_PROMPT_EXTERNAL,
    "realistic": STADIUM_NFT_BASE_PROMPT_EXTERNAL,
    "cinematic": STADIUM_NFT_BASE_PROMPT_EXTERNAL + "\nCINEMATIC: Wide-angle shot, dramatic depth of field, epic scale, movie-quality lighting.",
    "dramatic": STADIUM_NFT_BASE_PROMPT_EXTERNAL + "\nDRAMATIC: High contrast lighting, intense floodlights, epic larger-than-life presentation.",
}

ATMOSPHERE_MODIFIERS = {
    "packed": "Stadium filled with passionate fans, electric atmosphere",
    "half_full": "Stadium moderately filled, balanced crowd energy", 
    "empty": "Empty stadium showcasing pure architectural beauty"
}

TIME_MODIFIERS = {
    "day": "Bright daylight, natural sun illumination, vibrant colors",
    "night": "Stadium floodlights, dramatic night atmosphere, city lights",
    "sunset": "Golden hour lighting, warm sunset colors, romantic atmosphere"
}

WEATHER_MODIFIERS = {
    "clear": "Perfect clear weather, optimal visibility",
    "dramatic": "Dramatic sky, interesting cloud formations, dynamic lighting",
    "cloudy": "Overcast sky, soft diffused lighting, moody atmosphere"
}

def build_enhanced_stadium_prompt(
    architectural_analysis: str,
    style: str = "realistic",
    perspective: str = "external", 
    atmosphere: str = "packed",
    time_of_day: str = "day",
    weather: str = "clear",
    custom_additions: str = ""
) -> str:
    """
    Constrói prompt conciso para geração de estádio NFT
    """
    
    prompt_key = f"{style}_{perspective}"
    if prompt_key not in STADIUM_STYLE_PROMPTS:
        prompt_key = style if style in STADIUM_STYLE_PROMPTS else "realistic"
    
    base_prompt = STADIUM_STYLE_PROMPTS[prompt_key]
    enhanced_prompt = base_prompt.format(architectural_analysis=architectural_analysis)
    
    # Adicionar modificadores
    modifiers = []
    
    if atmosphere in ATMOSPHERE_MODIFIERS:
        modifiers.append(ATMOSPHERE_MODIFIERS[atmosphere])
    
    if time_of_day in TIME_MODIFIERS:
        modifiers.append(TIME_MODIFIERS[time_of_day])
    
    if weather in WEATHER_MODIFIERS:
        modifiers.append(WEATHER_MODIFIERS[weather])
    
    if modifiers:
        enhanced_prompt += f"\n\nSPECIFIC: {', '.join(modifiers)}"
    
    if custom_additions:
        custom_limited = custom_additions[:200] if len(custom_additions) > 200 else custom_additions
        enhanced_prompt += f"\nCUSTOM: {custom_limited}"
    
    if len(enhanced_prompt) > 3800:
        lines = enhanced_prompt.split('\n')
        essential_lines = []
        current_length = 0
        
        for line in lines:
            if current_length + len(line) + 1 <= 3800:
                essential_lines.append(line)
                current_length += len(line) + 1
            else:
                break
        
        enhanced_prompt = '\n'.join(essential_lines)
        enhanced_prompt += "\nPremium NFT quality, architectural excellence."
    
    return enhanced_prompt

# --- MODELOS DE DADOS ---
class ImageGenerationRequest(BaseModel):
    model_id: Optional[str] = None
    player_name: Optional[str] = None
    player_number: Optional[str] = None
    quality: str = "standard"
    prompt: Optional[str] = None  # Para estádios
    type: str = "jersey"  # "jersey" ou "stadium"
    reference_image_base64: Optional[str] = None  # Para análise com GPT-4 Vision

class GenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None

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

# --- GERADOR UNIFICADO ---
class UnifiedGenerator:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            raise Exception("OPENAI_API_KEY não encontrada")
        if not self.openrouter_api_key:
            raise Exception("OPENROUTER_API_KEY não encontrada")
        self.client = OpenAI(api_key=self.api_key)
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
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

    def generate_jersey(self, request: ImageGenerationRequest) -> str:
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
        print(f"INFO: Prompt: {final_prompt[:100]}...")
        
        return self._generate_dalle3_image(final_prompt, request.quality)

    def analyze_stadium_with_vision(self, image_base64: str, base_prompt: str) -> str:
        """Analisa estádio usando GPT-4 Vision via OpenRouter"""
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json"
        }
        
        prompt = f"""
        Analyze this stadium image and enhance this base description: "{base_prompt}"
        
        Provide a detailed DALL-E 3 prompt that captures:
        1. Architectural details you see
        2. Atmosphere and crowd characteristics  
        3. Lighting and time of day
        4. Unique features and elements
        5. Camera perspective and composition
        
        Enhance the base description with specific visual details from the image.
        Return only the enhanced prompt text, no JSON or extra formatting.
        """
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 500,
            "temperature": 0.3
        }
        
        try:
            print(f"🔍 Analyzing stadium with GPT-4 Vision...")
            
            response = requests.post(
                f"{self.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                enhanced_prompt = data['choices'][0]['message']['content']
                print("✅ Stadium analysis completed")
                return enhanced_prompt.strip()
            else:
                print(f"❌ OpenRouter error: {response.status_code}")
                return base_prompt  # Fallback para prompt base
                
        except Exception as e:
            print(f"❌ Vision analysis error: {str(e)}")
            return base_prompt  # Fallback para prompt base

    def generate_stadium(self, request: ImageGenerationRequest) -> str:
        """Gera um estádio usando o prompt fornecido, com análise opcional de imagem de referência."""
        
        if not request.prompt:
            raise ValueError("Prompt é obrigatório para geração de estádios")
        
        base_prompt = request.prompt
        
        # Se tem imagem de referência, usa GPT-4 Vision para analisar e melhorar o prompt
        if request.reference_image_base64:
            print(f"🔍 Stadium generation with reference image analysis...")
            final_prompt = self.analyze_stadium_with_vision(request.reference_image_base64, base_prompt)
        else:
            print(f"🏟️ Stadium generation with text prompt only...")
            final_prompt = base_prompt
        
        print(f"INFO: Final prompt: {final_prompt[:150]}...")
        
        return self._generate_dalle3_image(final_prompt, request.quality)

    def _generate_dalle3_image(self, prompt: str, quality: str = "standard") -> str:
        """Gera imagem usando DALL-E 3"""
        
        generation_response = self.client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality=quality,
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

# --- CONFIGURAÇÃO DA API FASTAPI ---
app = FastAPI(title="Unified Generator API - Jerseys + Stadiums", version="4.0.0")

# Lista de domínios permitidos
origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://jersey-generator-ai2-git-master-jeffnight15s-projects.vercel.app",
    "https://jersey-generator-ai2.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

generator = UnifiedGenerator()

@app.get("/")
async def root():
    return {
        "status": "online", 
        "service": "Unified Generator API - Jerseys + Stadiums", 
        "version": "4.0.0",
        "endpoints": {
            "generate": "POST /generate - Gera jerseys ou estádios baseado no type",
            "teams": "GET /teams - Lista times disponíveis",
            "health": "GET /health - Health check"
        }
    }

@app.post("/generate", response_model=GenerationResponse)
async def generate_image_endpoint(request: ImageGenerationRequest):
    try:
        print(f"📦 Request: {request}")
        
        if request.type == "stadium":
            # Validação para estádio
            if not request.prompt:
                return GenerationResponse(
                    success=False,
                    error="Prompt é obrigatório para geração de estádios"
                )
            
            # Geração de estádio
            print("🏟️ Generating stadium...")
            image_base64 = generator.generate_stadium(request)
            cost = 0.04 if request.quality == "standard" else 0.08
        else:
            # Validação para jersey
            if not request.model_id or not request.player_name or not request.player_number:
                return GenerationResponse(
                    success=False,
                    error="model_id, player_name e player_number são obrigatórios para jerseys"
                )
            
            # Geração de jersey (padrão)
            print("👕 Generating jersey...")
            image_base64 = generator.generate_jersey(request)
            cost = 0.045
        
        return GenerationResponse(
            success=True,
            image_base64=image_base64,
            cost_usd=cost
        )
    except Exception as e:
        print(f"ERROR: {e}")
        return GenerationResponse(
            success=False,
            error=str(e)
        )

# --- Health Check Endpoint ---
@app.get("/health")
async def health_check():
    """Endpoint to check if the API is running."""
    return {"status": "ok"}

# --- Get Available Teams Endpoint ---
@app.get("/teams")
async def get_available_teams():
    """
    Scans the image_references directory for subdirectories (teams) and returns a list of available team names.
    """
    image_dir = Path("image_references")
    if not image_dir.is_dir():
        return {"error": "Image references directory not found."}

    teams = []
    for subdir in image_dir.iterdir():
        if subdir.is_dir():
            team_name = subdir.name.replace("_", " ").title()
            teams.append(team_name)
    
    return sorted(teams)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 