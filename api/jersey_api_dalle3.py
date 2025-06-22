#!/usr/bin/env python3
"""
API FastAPI para Geração de Jerseys e Estádios com DALL-E 3
Sistema baseado em prompts otimizados específicos para cada time e estádio.
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
from typing import Optional
from pathlib import Path

load_dotenv()

# --- Modelos de Dados ---
class ImageGenerationRequest(BaseModel):
    model_id: Optional[str] = None
    player_name: Optional[str] = None
    player_number: Optional[str] = None
    quality: str = "standard"
    prompt: Optional[str] = None  # Para estádios
    type: str = "jersey"  # "jersey" ou "stadium"

class GenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None

# --- Gerador Principal ---
class UnifiedGenerator:
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

    def generate_jersey(self, request: ImageGenerationRequest) -> str:
        """Gera uma camisa usando prompt otimizado específico do time."""
        
        team_name = self._get_team_name_from_model_id(request.model_id)
        
        if team_name not in self.team_prompts:
            raise ValueError(f"Time '{team_name}' não tem prompt configurado")
        
        # Pega o template do prompt e substitui os placeholders
        prompt_template = self.team_prompts[team_name]
        final_prompt = prompt_template.format(
            PLAYER_NAME=request.player_name.upper(),
            PLAYER_NUMBER=request.player_number
        )
        
        print(f"INFO: Gerando {team_name} com prompt otimizado")
        print(f"INFO: Prompt: {final_prompt[:100]}...")
        
        return self._generate_dalle3_image(final_prompt, request.quality)

    def generate_stadium(self, request: ImageGenerationRequest) -> str:
        """Gera um estádio usando o prompt fornecido."""
        
        if not request.prompt:
            raise ValueError("Prompt é obrigatório para geração de estádios")
        
        # Usar o prompt do frontend diretamente
        final_prompt = request.prompt
        
        print(f"INFO: Gerando estádio com prompt customizado")
        print(f"INFO: Prompt: {final_prompt[:100]}...")
        
        return self._generate_dalle3_image(final_prompt, request.quality)

    def _generate_dalle3_image(self, prompt: str, quality: str = "standard") -> str:
        """Gera imagem usando DALL-E 3"""
        
        # Geração da imagem
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

# --- Configuração da API FastAPI ---
app = FastAPI(title="Unified Generator API - Jerseys + Stadiums", version="3.0.0")

# Lista de domínios permitidos
origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://jersey-generator-ai2-git-master-jeffnight15s-projects.vercel.app",
    "https://jersey-generator-ai2.vercel.app" # Adicionando o domínio principal também
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
        "version": "3.0.0",
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