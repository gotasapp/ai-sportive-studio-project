#!/usr/bin/env python3
"""
API FastAPI para geração de jerseys DALL-E 3
Integração com frontend React
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
import json
from typing import Optional

load_dotenv()

app = FastAPI(title="Jersey Generator API", version="1.0.0")

# CORS atualizado para produção
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JerseyRequest(BaseModel):
    team_name: str
    player_name: str
    player_number: str
    quality: str = "standard"  # "standard" ou "hd"

class JerseyResponse(BaseModel):
    success: bool
    image_base64: str = None
    team_name: str = None
    player_name: str = None
    player_number: str = None
    cost_usd: float = None
    error: str = None

class JerseyGenerator:
    """Gerador DALL-E 3 para API"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise Exception("OPENAI_API_KEY não encontrada")
        
        self.client = OpenAI(api_key=self.api_key)
        
        # Times disponíveis
        self.available_teams = [
            "Vasco da Gama", "Palmeiras", "São Paulo", 
            "Flamengo", "Corinthians", "Santos",
            "Barcelona", "Real Madrid", "Manchester United"
        ]
        
        # Template otimizado
        self.prompt_template = """A photorealistic back view of a professional soccer jersey on a white studio background, designed for jersey customization interfaces. The jersey is centered and fully visible, with a clean flat fit and realistic texture. At the top, display the player name "{PLAYER_NAME}" in bold uppercase letters. Below it, a large centered number "{PLAYER_NUMBER}".

The jersey must exactly match the official home design of the "{TEAM_NAME}" team: use authentic team colors, patterns, sponsors, and jersey layout. Ensure high contrast between text and background for readability. Use realistic lighting and subtle shadows to reflect fabric quality.

Do not show any mannequin, human body, hanger, or background elements. No angled views or tilted perspectives. Avoid front view, 3D rotation, folds, blurs or wrinkles. The format, layout and proportions must exactly match the Vasco da Gama example with "JEFF" and number "8". Keep the name and number aligned and consistent in size across all generations. 4K resolution."""
    
    def generate_jersey(self, team_name: str, player_name: str, player_number: str, quality: str = "standard"):
        """Gera jersey usando DALL-E 3"""
        
        # Validações
        if team_name not in self.available_teams:
            raise ValueError(f"Time não disponível. Times: {', '.join(self.available_teams)}")
        
        # Cria prompt
        prompt = self.prompt_template.format(
            PLAYER_NAME=player_name.upper(),
            PLAYER_NUMBER=player_number,
            TEAM_NAME=team_name
        )
        
        try:
            # Gera imagem
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality=quality,
                n=1
            )
            
            # Baixa imagem
            image_url = response.data[0].url
            img_response = requests.get(image_url, timeout=60)
            
            if img_response.status_code == 200:
                # Converte para base64
                image = Image.open(BytesIO(img_response.content))
                buffered = BytesIO()
                image.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode()
                
                return img_base64
            else:
                raise Exception(f"Erro ao baixar imagem: {img_response.status_code}")
                
        except Exception as e:
            raise Exception(f"Erro DALL-E 3: {str(e)}")

# Inicializa gerador
generator = JerseyGenerator()

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "service": "Jersey Generator API",
        "version": "1.0.0",
        "dalle3": "ready"
    }

@app.get("/teams")
async def get_teams():
    """Lista times disponíveis"""
    return {
        "teams": generator.available_teams,
        "total": len(generator.available_teams)
    }

@app.post("/generate-jersey", response_model=JerseyResponse)
async def generate_jersey(request: JerseyRequest):
    """Gera jersey personalizado"""
    
    try:
        # Calcula custo
        cost = 0.040 if request.quality == "standard" else 0.080
        
        # Gera jersey
        image_base64 = generator.generate_jersey(
            team_name=request.team_name,
            player_name=request.player_name,
            player_number=request.player_number,
            quality=request.quality
        )
        
        return JerseyResponse(
            success=True,
            image_base64=image_base64,
            team_name=request.team_name,
            player_name=request.player_name,
            player_number=request.player_number,
            cost_usd=cost
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/health")
async def health_check():
    """Verifica status da API"""
    return {
        "api": "healthy",
        "dalle3": "configured",
        "teams_available": len(generator.available_teams)
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando Jersey Generator API...")
    print("📡 Endpoint: http://localhost:8000")
    print("📋 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 