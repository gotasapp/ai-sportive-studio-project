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

app = FastAPI(title="Jersey Generator API", version="1.1.0")

# CORS (mantém a política aberta)
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
    image_base64: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None

class ImageGenerationRequest(BaseModel):
    model_id: str
    player_name: str
    player_number: str
    quality: str = "standard"

class VisionEnhancedGenerator:
    """
    Usa GPT-4o para analisar uma imagem de referência e instrui DALL-E 3
    a recriá-la com modificações.
    """
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise Exception("OPENAI_API_KEY não encontrada")
        self.client = OpenAI(api_key=self.api_key)
        self.reference_path = "api/image_references"

    def _get_image_as_base64(self, model_id: str) -> str:
        # Foco na imagem das costas para a geração
        image_path = os.path.join(self.reference_path, f"{model_id.replace('_', '/')}_back.jpg")
        if not os.path.exists(image_path):
            raise ValueError(f"Modelo de referência não encontrado: {image_path}")
        
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def generate_image(self, request: ImageGenerationRequest) -> str:
        base64_image = self._get_image_as_base64(request.model_id)
        
        # 1. Primeira chamada: GPT-4o para descrever a imagem
        description_response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze the design of this soccer jersey. Ignore the angle and lighting. Focus on the core design elements: base color, pattern (e.g., stripes, abstract shapes), collar type, sleeve cuff style, and any logos or text visible. Describe it as if you were instructing a designer to recreate it."
                        },
                        {
                            "type": "image_url",
                            "image_url": { "url": f"data:image/jpeg;base64,{base64_image}" }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        design_description = description_response.choices[0].message.content
        
        # 2. Construir o prompt final para DALL-E 3
        final_prompt = f"""
        Based on this exact design description: "{design_description}".

        Now, create a new image of this jersey with the following specifications:

        CRITICAL INSTRUCTIONS:
        - The view MUST be the BACK of the jersey, perfectly centered and laid flat.
        - The player name "{request.player_name.upper()}" MUST appear EXACTLY as written at the top.
        - The number "{request.player_number}" MUST appear EXACTLY as written below the name.
        - DO NOT show any human, mannequin, or hanger. The background MUST be a clean, neutral studio background.
        - The style should be photorealistic, high quality, 4K resolution.
        """
        
        # 3. Segunda chamada: DALL-E 3 para gerar a imagem
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

# Inicializa o novo gerador
generator = VisionEnhancedGenerator()

@app.get("/")
async def root():
    return {"status": "online", "service": "Vision-Enhanced Jersey API", "version": "1.1.0"}

@app.get("/teams")
async def get_teams():
    return {
        "teams": ["Corinthians", "Vasco da Gama", "Palmeiras", "São Paulo", "Flamengo"],
        "total": 5
    }

@app.post("/generate", response_model=GenerationResponse)
async def generate_image_endpoint(request: ImageGenerationRequest):
    try:
        cost = 0.040 if request.quality == "standard" else 0.080
        # Adicionar custo da chamada de visão (GPT-4o)
        cost += 0.005 # Custo estimado por chamada de visão

        image_base64 = generator.generate_image(request)
        
        return GenerationResponse(
            success=True,
            image_base64=image_base64,
            cost_usd=cost
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")

@app.get("/health")
async def health_check():
    return {"api": "healthy", "vision_model": "gpt-4o", "image_model": "dall-e-3"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando Jersey Generator API...")
    print("📡 Endpoint: http://localhost:8000")
    print("📋 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 