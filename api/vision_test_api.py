#!/usr/bin/env python3
"""
Vision Test API - Sistema separado para testes de GPT-4 Vision
Baseado na estrutura OpenRouter + FastAPI fornecida pelo usuário
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import requests
import os
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# --- Configurações ---
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "openai/gpt-4o-mini"  # Modelo vision do OpenRouter

if not OPENROUTER_KEY:
    raise Exception("OPENROUTER_API_KEY é obrigatório")

# --- Modelos de Dados ---
class VisionAnalysisRequest(BaseModel):
    image_base64: str
    analysis_prompt: str = "Analyze this image in detail"
    model: str = "openai/gpt-4o-mini"

class VisionResponse(BaseModel):
    success: bool
    analysis: Optional[str] = None
    model_used: Optional[str] = None
    cost_estimate: Optional[float] = None
    error: Optional[str] = None

# --- Sistema Principal ---
class VisionTestSystem:
    def __init__(self):
        self.openrouter_url = OPENROUTER_URL
        self.openrouter_key = OPENROUTER_KEY
        self.headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json"
        }
        print("✅ Vision Test System initialized")
        print(f"🔍 Model: {MODEL_NAME}")
        print(f"📡 API: OpenRouter")
    
    def analyze_image_vision(self, image_base64: str, prompt: str, model: str = MODEL_NAME) -> Dict[str, Any]:
        """Analisa imagem usando OpenRouter Vision"""
        
        # Ensure base64 has proper format
        if not image_base64.startswith('data:'):
            image_data = f"data:image/jpeg;base64,{image_base64}"
        else:
            image_data = image_base64
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_data}}
                    ]
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.3
        }
        
        try:
            print(f"🔍 Analyzing image with {model}...")
            print(f"📝 Prompt: {prompt[:100]}...")
            
            response = requests.post(
                self.openrouter_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                analysis_text = data['choices'][0]['message']['content']
                
                # Estimativa de custo (varia por modelo)
                cost_estimate = 0.01  # ~$0.01 por imagem para gpt-4o-mini
                
                print("✅ Vision analysis completed")
                
                return {
                    "success": True,
                    "analysis": analysis_text,
                    "model_used": model,
                    "cost_estimate": cost_estimate,
                    "raw_response": data
                }
            else:
                error_msg = f"OpenRouter API error: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
                
        except Exception as e:
            error_msg = f"Vision analysis error: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def process_file_upload(self, file_content: bytes, content_type: str) -> str:
        """Converte arquivo para base64"""
        try:
            b64 = base64.b64encode(file_content).decode()
            return f"data:{content_type};base64,{b64}"
        except Exception as e:
            raise Exception(f"Failed to process file: {str(e)}")

# --- FastAPI App ---
app = FastAPI(
    title="Vision Test API",
    description="Sistema separado para testes de GPT-4 Vision via OpenRouter",
    version="1.0.0"
)

# CORS
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

# Inicializa sistema
try:
    vision_system = VisionTestSystem()
except Exception as e:
    print(f"❌ Failed to initialize: {e}")
    vision_system = None

# --- Endpoints ---

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Vision Test API",
        "version": "1.0.0",
        "model": MODEL_NAME,
        "pipeline": "OpenRouter Vision Only"
    }

@app.post("/analyze-image-upload", response_model=VisionResponse)
async def analyze_image_upload(
    file: UploadFile = File(...),
    prompt: str = "Analyze this image in detail"
):
    """Endpoint para upload de arquivo direto"""
    if not vision_system:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        # Ler arquivo
        file_content = await file.read()
        
        # Processar para base64
        image_data = vision_system.process_file_upload(file_content, file.content_type)
        
        # Analisar
        result = vision_system.analyze_image_vision(
            image_data, 
            prompt, 
            MODEL_NAME
        )
        
        return VisionResponse(
            success=result["success"],
            analysis=result.get("analysis"),
            model_used=result.get("model_used"),
            cost_estimate=result.get("cost_estimate"),
            error=result.get("error")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-image-base64", response_model=VisionResponse)
async def analyze_image_base64(request: VisionAnalysisRequest):
    """Endpoint para análise via base64 (igual estrutura atual)"""
    if not vision_system:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        result = vision_system.analyze_image_vision(
            request.image_base64,
            request.analysis_prompt,
            request.model
        )
        
        return VisionResponse(
            success=result["success"],
            analysis=result.get("analysis"),
            model_used=result.get("model_used"),
            cost_estimate=result.get("cost_estimate"),
            error=result.get("error")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/available-models")
async def get_available_models():
    """Lista modelos vision disponíveis"""
    return {
        "models": [
            "openai/gpt-4o-mini",
            "openai/gpt-4o",
            "meta-llama/llama-3.2-11b-vision-instruct",
            "qwen/qwen-2-vl-72b-instruct",
            "google/gemini-pro-vision"
        ],
        "default": MODEL_NAME,
        "recommended": "openai/gpt-4o-mini"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "vision_system": "initialized" if vision_system else "not_initialized",
        "openrouter_key": "configured" if OPENROUTER_KEY else "missing",
        "model": MODEL_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)  # Porta diferente da API principal 