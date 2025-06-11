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

class GenerationRequest(BaseModel):
    prompt: str
    quality: str = "standard"

class GenerationResponse(BaseModel):
    success: bool
    image_base64: str = None
    cost_usd: float = None
    error: str = None

class Dalle3Generator:
    """Gerador DALL-E 3 para API"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise Exception("OPENAI_API_KEY não encontrada")
        
        self.client = OpenAI(api_key=self.api_key)
        
        # Times disponíveis - ainda útil para o seletor do frontend
        self.available_teams = [
            "Vasco da Gama", "Palmeiras", "São Paulo", 
            "Flamengo", "Corinthians", "Santos",
            "Barcelona", "Real Madrid", "Manchester United"
        ]
        
    def generate_image(self, prompt: str, quality: str = "standard"):
        """Gera imagem usando DALL-E 3 a partir de um prompt direto"""
        
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
generator = Dalle3Generator()

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

@app.post("/generate", response_model=GenerationResponse)
async def generate_image_endpoint(request: GenerationRequest):
    """Gera imagem personalizada a partir de um prompt"""
    
    try:
        # Calcula custo
        cost = 0.040 if request.quality == "standard" else 0.080
        
        # Gera imagem
        image_base64 = generator.generate_image(
            prompt=request.prompt,
            quality=request.quality
        )
        
        return GenerationResponse(
            success=True,
            image_base64=image_base64,
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