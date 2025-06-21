#!/usr/bin/env python3
"""
API de Estádios com Referências Locais + Prompts Premium NFT
"""

import os
import json
import base64
from typing import Optional, Dict, Any, List
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from openai import OpenAI

# Importar sistema de prompts premium
from stadium_base_prompts import build_enhanced_stadium_prompt, STADIUM_NFT_BASE_PROMPT

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

# Configurações
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Caminhos
STADIUM_REFERENCES_PATH = Path("stadium_references")

# FastAPI app
app = FastAPI(title="Stadium Reference API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class StadiumReferenceRequest(BaseModel):
    stadium_id: str
    reference_type: str = "atmosphere"
    generation_style: str = "realistic"
    perspective: str = "external"  # external, internal, mixed
    atmosphere: str = "packed"
    time_of_day: str = "day"
    weather: str = "clear"
    quality: str = "standard"
    # Campos opcionais para upload manual
    custom_prompt: Optional[str] = None
    custom_reference_base64: Optional[str] = None

class CustomStadiumRequest(BaseModel):
    prompt: str
    reference_image_base64: Optional[str] = None
    generation_style: str = "realistic"
    perspective: str = "external"  # external, internal, mixed
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
    reference_source: Optional[str] = None  # "local" ou "custom"
    error: Optional[str] = None
    cost_usd: Optional[float] = None
    prompt_used: Optional[str] = None

# Stadium Reference Generator
class StadiumReferenceGenerator:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        print("✅ Stadium Reference Generator initialized with Premium NFT Prompts")
    
    def get_available_stadiums(self) -> List[StadiumInfo]:
        """Lista estádios disponíveis"""
        stadiums = []
        
        if not STADIUM_REFERENCES_PATH.exists():
            return stadiums
        
        for stadium_dir in STADIUM_REFERENCES_PATH.iterdir():
            if stadium_dir.is_dir():
                # Buscar imagens
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
        
        # Buscar primeira imagem disponível
        for ext in ['jpg', 'jpeg', 'png', 'webp']:
            files = list(stadium_path.glob(f"*.{ext}"))
            if files:
                image_file = files[0]  # Pegar primeira imagem
                try:
                    with open(image_file, 'rb') as f:
                        image_data = f.read()
                        return base64.b64encode(image_data).decode('utf-8')
                except Exception as e:
                    print(f"❌ Error loading {image_file}: {e}")
                    continue
        
        return None
    
    def analyze_reference_image(self, image_base64: str, stadium_name: str) -> Dict[str, Any]:
        """Analisa imagem de referência com foco em características arquiteturais para NFT"""
        
        try:
            print(f"🔍 Analyzing {stadium_name} for premium NFT generation...")
            
            prompt = f"""Analyze this {stadium_name} stadium image for premium NFT artwork generation. Focus on:

ARCHITECTURAL ANALYSIS:
- Distinctive architectural features and design elements
- Structural characteristics (roof design, seating configuration, facades)
- Unique visual elements that make this stadium iconic
- Materials and textures visible in the structure
- Geometric patterns and architectural style

AESTHETIC QUALITIES:
- Color scheme and visual identity
- Lighting characteristics and atmosphere
- Proportions and scale relationships
- Distinctive design elements for NFT representation

Provide a detailed architectural description that can be used to generate a premium quality NFT artwork of a similar stadium."""
            
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
            
            print(f"✅ Premium architectural analysis completed for {stadium_name}")
            
            return {
                "architectural_description": analysis_text,
                "stadium_name": stadium_name,
                "analysis_type": "premium_nft_focused"
            }
            
        except Exception as e:
            print(f"❌ Analysis error: {e}")
            return {
                "error": str(e),
                "architectural_description": f"Modern {stadium_name} stadium with distinctive architectural features",
                "stadium_name": stadium_name,
                "analysis_type": "fallback"
            }
    
    def generate_stadium_dalle3(self, prompt: str, quality: str = "standard") -> Dict[str, Any]:
        """Gera estádio usando DALL-E 3"""
        
        try:
            print(f"🎨 Generating premium NFT stadium with DALL-E 3...")
            
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
            
            print("✅ Premium NFT stadium generation successful!")
            
            return {
                "success": True,
                "image_base64": image_b64,
                "cost": cost
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_from_reference(self, request: StadiumReferenceRequest) -> StadiumResponse:
        """Gera estádio baseado em referência local OU upload manual com prompts premium"""
        
        try:
            total_cost = 0
            reference_source = "local"
            reference_used = f"{request.stadium_id}_{request.reference_type}"
            
            # PRIORIDADE 1: Verificar se há referência local disponível
            image_base64 = self.load_reference_image(request.stadium_id, request.reference_type)
            
            # PRIORIDADE 2: Se não há referência local, usar upload manual
            if not image_base64 and request.custom_reference_base64:
                print(f"📤 Using custom uploaded reference for {request.stadium_id}")
                image_base64 = request.custom_reference_base64
                reference_source = "custom"
                reference_used = f"custom_{request.stadium_id}"
            
            # Se não há nenhuma referência disponível
            if not image_base64:
                # FALLBACK: Usar apenas prompt customizado se fornecido
                if request.custom_prompt:
                    print(f"📝 Using custom prompt only for {request.stadium_id}")
                    
                    # Usar prompt premium mesmo sem análise
                    enhanced_prompt = build_enhanced_stadium_prompt(
                        architectural_analysis=f"Custom stadium design: {request.custom_prompt}",
                        style=request.generation_style,
                        perspective=request.perspective,
                        atmosphere=request.atmosphere,
                        time_of_day=request.time_of_day,
                        weather=request.weather,
                        custom_additions=request.custom_prompt
                    )
                    
                    generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
                    
                    if generation_result["success"]:
                        return StadiumResponse(
                            success=True,
                            generated_image_base64=generation_result["image_base64"],
                            reference_used="custom_prompt_only",
                            reference_source="custom",
                            cost_usd=generation_result["cost"],
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
            
            # Se temos uma imagem (local ou custom), analisar
            stadium_name = request.stadium_id.replace('_', ' ').title()
            analysis = self.analyze_reference_image(image_base64, stadium_name)
            total_cost += 0.01
            
            # Construir prompt premium baseado na análise
            architectural_description = analysis.get("architectural_description", f"Modern {stadium_name} stadium")
            
            enhanced_prompt = build_enhanced_stadium_prompt(
                architectural_analysis=architectural_description,
                style=request.generation_style,
                perspective=request.perspective,
                atmosphere=request.atmosphere,
                time_of_day=request.time_of_day,
                weather=request.weather,
                custom_additions=request.custom_prompt or ""
            )
            
            print(f"🎯 Generated premium NFT prompt ({len(enhanced_prompt)} chars)")
            
            # Gerar imagem
            generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
            
            if generation_result["success"]:
                total_cost += generation_result["cost"]
                
                return StadiumResponse(
                    success=True,
                    analysis=analysis,
                    generated_image_base64=generation_result["image_base64"],
                    reference_used=reference_used,
                    reference_source=reference_source,
                    cost_usd=total_cost,
                    prompt_used=enhanced_prompt
                )
            else:
                return StadiumResponse(
                    success=False,
                    error=generation_result["error"],
                    reference_source=reference_source
                )
                
        except Exception as e:
            return StadiumResponse(
                success=False,
                error=str(e)
            )

# Inicializar
try:
    generator = StadiumReferenceGenerator()
except Exception as e:
    print(f"❌ Failed to initialize: {e}")
    generator = None

# Endpoints
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Stadium Reference API",
        "features": ["Premium NFT Prompts", "Local References", "Custom Upload"]
    }

@app.get("/stadiums", response_model=List[StadiumInfo])
async def list_stadiums():
    """Lista estádios disponíveis"""
    if not generator:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        stadiums = generator.get_available_stadiums()
        return stadiums
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-from-reference", response_model=StadiumResponse)
async def generate_from_reference(request: StadiumReferenceRequest):
    """Gera estádio baseado em referência local com prompts premium NFT"""
    if not generator:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        result = generator.generate_from_reference(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-custom", response_model=StadiumResponse)
async def generate_custom_stadium(request: CustomStadiumRequest):
    """Gera estádio com prompt e referência customizados usando prompts premium NFT"""
    if not generator:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        total_cost = 0
        
        # Se há imagem de referência, analisar
        if request.reference_image_base64:
            analysis = generator.analyze_reference_image(request.reference_image_base64, "custom stadium")
            total_cost += 0.01
            
            # Usar análise + prompt customizado
            architectural_description = analysis.get("architectural_description", "Custom stadium design")
        else:
            # Apenas prompt customizado
            architectural_description = f"Custom stadium design: {request.prompt}"
            analysis = None
        
        # Construir prompt premium
        enhanced_prompt = build_enhanced_stadium_prompt(
            architectural_analysis=architectural_description,
            style=request.generation_style,
            perspective=request.perspective,
            atmosphere=request.atmosphere,
            time_of_day=request.time_of_day,
            weather="clear",  # Default para custom
            custom_additions=request.prompt
        )
        
        print(f"🎯 Generated custom premium NFT prompt ({len(enhanced_prompt)} chars)")
        
        # Gerar imagem
        generation_result = generator.generate_stadium_dalle3(enhanced_prompt, request.quality)
        
        if generation_result["success"]:
            total_cost += generation_result["cost"]
            
            return StadiumResponse(
                success=True,
                analysis=analysis,
                generated_image_base64=generation_result["image_base64"],
                reference_used="custom_only",
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
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "stadiums_available": len(generator.get_available_stadiums()) if generator else 0,
        "features": ["Premium NFT Quality", "Architectural Analysis", "Enhanced Prompts"]
    }

if __name__ == "__main__":
    print("🚀 Starting Stadium Reference API with Premium NFT Prompts (port 8004)")
    
    if generator:
        stadiums = generator.get_available_stadiums()
        print(f"🏟️ Available stadiums: {len(stadiums)}")
        for stadium in stadiums:
            print(f"   • {stadium.name} ({stadium.id}) - {len(stadium.available_references)} images")
    
    print("🎨 Premium NFT prompt system loaded")
    print("✨ Ready to generate high-quality stadium NFT artwork")
    
    uvicorn.run(app, host="0.0.0.0", port=8004) 