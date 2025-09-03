#!/usr/bin/env python3
"""
API Completa de Estádios - OpenRouter + DALL-E 3
"""

import os
import json
import base64
from typing import Optional, Dict, Any

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
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY não encontrada no .env")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY não encontrada no .env")

# FastAPI app
app = FastAPI(title="Stadium Complete API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://localhost:3000",
        "https://*.vercel.app",
        "https://*.netlify.app",
        "https://*.railway.app", 
        "https://*.render.com"
    ],
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
    analysis: Optional[Dict[str, Any]] = None
    generated_image_base64: Optional[str] = None
    error: Optional[str] = None
    cost_usd: Optional[float] = None
    prompt_used: Optional[str] = None

# Stadium Generator
class CompleteStadiumGenerator:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        print("✅ Complete Stadium Generator initialized")
    
    def analyze_stadium_image(self, image_base64: str) -> Dict[str, Any]:
        """Analisa imagem de estádio usando OpenRouter GPT-4o"""
        
        try:
            print("🔍 Analyzing stadium image with OpenRouter...")
            
            prompt = """Analyze this stadium image and describe:
            1. Architecture style and features
            2. Atmosphere and crowd
            3. Lighting and time of day
            4. Colors and setting
            
            Create a detailed prompt for generating a similar stadium."""
            
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
                raise Exception(f"OpenRouter API error: {response.status_code}")
            
            result = response.json()
            analysis_text = result['choices'][0]['message']['content']
            
            print("✅ Stadium analysis completed")
            return {
                "description": analysis_text,
                "generation_prompt": f"Stadium based on analysis: {analysis_text[:300]}..."
            }
            
        except Exception as e:
            print(f"❌ Analysis error: {e}")
            return {
                "error": str(e),
                "generation_prompt": "Modern stadium based on reference image"
            }
    
    def build_enhanced_prompt(self, analysis: Dict[str, Any], request: StadiumGenerationRequest) -> str:
        """Constrói prompt aprimorado"""
        
        if "generation_prompt" in analysis:
            base = analysis["generation_prompt"]
        elif request.prompt:
            base = request.prompt
        else:
            base = "A modern football stadium"
        
        # Style modifiers
        style_map = {
            "realistic": "photorealistic, documentary style",
            "cinematic": "cinematic wide-angle shot, dramatic composition",
            "dramatic": "dramatic lighting, epic atmosphere"
        }
        
        # Atmosphere modifiers
        atmosphere_map = {
            "packed": "completely packed stadium, passionate fans",
            "half_full": "half-filled stadium, moderate crowd",
            "empty": "empty stadium, training atmosphere"
        }
        
        # Time modifiers
        time_map = {
            "day": "bright daylight, natural lighting",
            "night": "stadium floodlights, night atmosphere",
            "sunset": "golden hour lighting, warm colors"
        }
        
        style = style_map.get(request.generation_style, "realistic")
        atmosphere = atmosphere_map.get(request.atmosphere, "packed")
        time = time_map.get(request.time_of_day, "day")
        
        final_prompt = f"{base}, {style}, {atmosphere}, {time}, professional stadium photography, ultra-high resolution"
        
        return final_prompt
    
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
            
            print("✅ Stadium generation successful!")
            
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
    
    def generate_complete_stadium(self, request: StadiumGenerationRequest) -> StadiumResponse:
        """Pipeline completo"""
        
        try:
            total_cost = 0
            analysis = None
            
            # 1. Análise (se houver imagem)
            if request.reference_image_base64:
                analysis = self.analyze_stadium_image(request.reference_image_base64)
                total_cost += 0.01
            
            # 2. Construir prompt
            enhanced_prompt = self.build_enhanced_prompt(analysis or {}, request)
            
            # 3. Geração
            generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
            
            if generation_result["success"]:
                total_cost += generation_result["cost"]
                
                return StadiumResponse(
                    success=True,
                    analysis=analysis,
                    generated_image_base64=generation_result["image_base64"],
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

# Inicializar
try:
    stadium_generator = CompleteStadiumGenerator()
except Exception as e:
    print(f"❌ Failed to initialize: {e}")
    stadium_generator = None

# Endpoints
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Stadium Complete API",
        "pipeline": "OpenRouter + DALL-E 3"
    }

@app.post("/generate-stadium", response_model=StadiumResponse)
async def generate_stadium_endpoint(request: StadiumGenerationRequest):
    if not stadium_generator:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    if not request.prompt and not request.reference_image_base64:
        raise HTTPException(status_code=400, detail="Either prompt or reference_image_base64 is required")
    
    try:
        result = stadium_generator.generate_complete_stadium(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "gpt4_vision": "openrouter",
        "dalle3": "openai_direct"
    }

if __name__ == "__main__":
    print("🚀 Starting Complete Stadium API (port 8003)")
    uvicorn.run(app, host="0.0.0.0", port=8003) 