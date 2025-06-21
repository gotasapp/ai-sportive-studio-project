#!/usr/bin/env python3
"""
API Simplificada de Estádios - Apenas DALL-E 3
Para testar sem OpenRouter primeiro
"""

import os
import json
import base64
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from openai import OpenAI

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

# Configurações
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY não encontrada no .env")

# FastAPI app
app = FastAPI(title="Stadium Simple API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class StadiumGenerationRequest(BaseModel):
    reference_image_base64: Optional[str] = None
    prompt: Optional[str] = None
    generation_style: str = "realistic"
    atmosphere: str = "packed"
    time_of_day: str = "day"
    weather: str = "clear"
    quality: str = "standard"

class StadiumResponse(BaseModel):
    success: bool
    generated_image_base64: Optional[str] = None
    error: Optional[str] = None
    cost_usd: Optional[float] = None
    prompt_used: Optional[str] = None

# Stadium Generator
class SimpleStadiumGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        print("✅ Simple Stadium Generator initialized")
    
    def build_prompt(self, request: StadiumGenerationRequest) -> str:
        """Constrói prompt para DALL-E 3"""
        
        # Base prompt
        if request.prompt:
            base = request.prompt
        else:
            base = "A modern football stadium"
        
        # Style modifiers
        style_modifiers = {
            "realistic": "photorealistic, documentary style, natural lighting",
            "cinematic": "cinematic wide-angle shot, dramatic composition, movie-like quality",
            "dramatic": "dramatic lighting, epic atmosphere, moody and intense"
        }
        
        # Atmosphere modifiers
        atmosphere_modifiers = {
            "packed": "completely packed stadium, sea of passionate fans",
            "half_full": "half-filled stadium, moderate crowd atmosphere",
            "empty": "empty stadium, training day or maintenance atmosphere"
        }
        
        # Time modifiers
        time_modifiers = {
            "day": "bright daylight, clear visibility, natural lighting",
            "night": "stadium floodlights, night match atmosphere, dramatic lighting",
            "sunset": "golden hour lighting, warm sunset colors, magical atmosphere"
        }
        
        # Weather modifiers
        weather_modifiers = {
            "clear": "clear sky, perfect weather conditions",
            "dramatic": "dramatic cloudy sky, moody atmosphere, storm approaching",
            "cloudy": "overcast sky, diffused lighting, atmospheric conditions"
        }
        
        # Combinar tudo
        final_prompt = f"""
        {base}, {style_modifiers.get(request.generation_style, 'realistic')}, 
        {atmosphere_modifiers.get(request.atmosphere, 'packed')}, 
        {time_modifiers.get(request.time_of_day, 'day')}, 
        {weather_modifiers.get(request.weather, 'clear')}.
        
        Professional stadium photography, ultra-high resolution, perfect composition, 
        award-winning sports photography, masterpiece quality.
        """
        
        return final_prompt.strip()
    
    def generate_stadium(self, request: StadiumGenerationRequest) -> StadiumResponse:
        """Gera estádio usando apenas DALL-E 3"""
        
        try:
            # Construir prompt
            prompt = self.build_prompt(request)
            print(f"🎨 Generating stadium with DALL-E 3...")
            print(f"📝 Prompt: {prompt[:100]}...")
            
            # Configurar qualidade
            size = "1024x1024" if request.quality == "standard" else "1024x1792"
            quality = "standard" if request.quality == "standard" else "hd"
            
            # Chamar DALL-E 3
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size=size,
                quality=quality,
                response_format="b64_json"
            )
            
            # Extrair imagem base64
            image_b64 = response.data[0].b64_json
            
            # Calcular custo
            cost = 0.04 if request.quality == "standard" else 0.08
            
            print("✅ Stadium generation successful!")
            
            return StadiumResponse(
                success=True,
                generated_image_base64=image_b64,
                cost_usd=cost,
                prompt_used=prompt
            )
            
        except Exception as e:
            error_msg = f"DALL-E 3 generation error: {str(e)}"
            print(f"❌ {error_msg}")
            return StadiumResponse(
                success=False,
                error=error_msg
            )

# Inicializar gerador
try:
    stadium_generator = SimpleStadiumGenerator()
except Exception as e:
    print(f"❌ Failed to initialize: {e}")
    stadium_generator = None

# Endpoints
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Stadium Simple API",
        "version": "1.0.0",
        "pipeline": "DALL-E 3 Only"
    }

@app.post("/generate-stadium", response_model=StadiumResponse)
async def generate_stadium_endpoint(request: StadiumGenerationRequest):
    """Gera estádio usando apenas DALL-E 3"""
    if not stadium_generator:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    # Validar entrada
    if not request.prompt and not request.reference_image_base64:
        raise HTTPException(status_code=400, detail="Either prompt or reference_image_base64 is required")
    
    try:
        result = stadium_generator.generate_stadium(request)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "dalle3": "openai_direct" if stadium_generator else "not_initialized"
    }

if __name__ == "__main__":
    print("🚀 Starting Simple Stadium API (DALL-E 3 only)")
    print("📋 Available endpoints:")
    print("   • Generate: http://localhost:8002/generate-stadium")
    print("   • Health: http://localhost:8002/health")
    print("   • Docs: http://localhost:8002/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8002) 