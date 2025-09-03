#!/usr/bin/env python3
"""
Stadium Vision + DALL-E 3 System
GPT-4 Vision analisa imagem de referência → DALL-E 3 gera nova imagem
"""

import requests
import base64
import json
import os
from PIL import Image
from io import BytesIO
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# --- Modelos de Dados ---
class StadiumAnalysisRequest(BaseModel):
    reference_image_base64: str
    analysis_type: str = "comprehensive"  # "basic", "comprehensive", "atmosphere"
    
class StadiumGenerationRequest(BaseModel):
    reference_image_base64: str
    generation_style: str = "realistic"  # "realistic", "cinematic", "dramatic"
    atmosphere: str = "packed"  # "packed", "half_full", "empty"
    time_of_day: str = "day"  # "day", "night", "sunset"
    weather: str = "clear"  # "clear", "dramatic", "cloudy"
    quality: str = "standard"

class StadiumResponse(BaseModel):
    success: bool
    analysis: Optional[dict] = None
    generated_image_base64: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None

# --- Sistema Principal ---
class StadiumVisionSystem:
    def __init__(self):
        # OpenRouter para GPT-4 Vision
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.openrouter_api_key or not self.openai_api_key:
            raise Exception("OPENROUTER_API_KEY and OPENAI_API_KEY required")
        
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
        
        print("✅ Stadium Vision System initialized")
        print(f"🔍 GPT-4 Vision: OpenRouter")
        print(f"🎨 DALL-E 3: OpenAI Direct")
    
    def analyze_stadium_with_vision(self, image_base64: str, analysis_type: str = "comprehensive") -> dict:
        """Analisa estádio usando GPT-4 Vision via OpenRouter"""
        
        # Prompts específicos por tipo de análise
        analysis_prompts = {
            "basic": """
            Analyze this stadium image and provide:
            1. Stadium name (if recognizable)
            2. Architectural style (modern, classic, etc.)
            3. Capacity estimate (small, medium, large, massive)
            4. Main colors of the structure
            5. Time of day (day/night)
            6. Crowd density (empty, sparse, packed)
            
            Respond in JSON format.
            """,
            
            "comprehensive": """
            Perform a detailed analysis of this stadium image:
            
            ARCHITECTURE:
            - Architectural style and era
            - Roof structure (open, closed, retractable)
            - Seating configuration
            - Distinctive features
            
            ATMOSPHERE:
            - Time of day and lighting
            - Crowd density and distribution  
            - Fan colors and team identification
            - Atmosphere intensity (calm, electric, etc.)
            
            TECHNICAL:
            - Camera angle and perspective
            - Image quality and composition
            - Background elements (city, mountains, etc.)
            - Weather conditions
            
            GENERATION PROMPT:
            Based on this analysis, create a detailed DALL-E 3 prompt that would generate a similar stadium scene with the same characteristics but different perspective or conditions.
            
            Respond in JSON format with sections: architecture, atmosphere, technical, dalle3_prompt.
            """,
            
            "atmosphere": """
            Focus on the atmosphere and crowd analysis:
            1. Crowd density percentage
            2. Fan colors and team identification
            3. Atmosphere type (match day, training, event)
            4. Lighting and mood
            5. Special elements (flags, banners, pyrotechnics)
            
            Respond in JSON format.
            """
        }
        
        prompt = analysis_prompts.get(analysis_type, analysis_prompts["comprehensive"])
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json"
        }
        
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
            "max_tokens": 1000,
            "temperature": 0.3
        }
        
        try:
            print(f"🔍 Analyzing stadium with GPT-4 Vision ({analysis_type})...")
            
            response = requests.post(
                f"{self.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                analysis_text = data['choices'][0]['message']['content']
                
                # Tenta parsear como JSON
                try:
                    analysis_json = json.loads(analysis_text)
                    print("✅ Stadium analysis completed")
                    return analysis_json
                except json.JSONDecodeError:
                    # Se não for JSON válido, retorna como texto
                    print("⚠️ Analysis returned as text, not JSON")
                    return {"analysis_text": analysis_text}
                    
            else:
                error_msg = f"OpenRouter API error: {response.status_code}"
                print(f"❌ {error_msg}")
                return {"error": error_msg}
                
        except Exception as e:
            error_msg = f"Vision analysis error: {str(e)}"
            print(f"❌ {error_msg}")
            return {"error": error_msg}
    
    def generate_stadium_with_dalle3(self, analysis: dict, generation_params: dict) -> str:
        """Gera nova imagem do estádio usando DALL-E 3"""
        
        # Importa sistema de prompts base
        from stadium_base_prompts import build_stadium_prompt, STADIUM_BASE_PROMPTS
        
        # Determina o estádio baseado na análise (se disponível)
        stadium_id = generation_params.get('stadium_id', 'generic')
        
        # Mapeia parâmetros para atmosfera base
        atmosphere_mapping = {
            ('night', 'packed'): 'night_packed_vibrant',
            ('night', 'half_full'): 'night_derby_atmosphere', 
            ('sunset', 'packed'): 'sunset_golden_hour',
            ('day', 'packed'): 'day_classic_atmosphere',
            ('night', 'empty'): 'night_packed_vibrant'  # Fallback
        }
        
        time_of_day = generation_params.get('time_of_day', 'night')
        atmosphere = generation_params.get('atmosphere', 'packed')
        base_atmosphere = atmosphere_mapping.get((time_of_day, atmosphere), 'night_packed_vibrant')
        
        # Se temos análise do GPT-4 Vision, usa ela como base
        if analysis.get('dalle3_prompt'):
            # Usa prompt gerado pelo GPT-4 Vision
            base_prompt = analysis['dalle3_prompt']
            
            # Adiciona modificadores específicos
            style_modifiers = {
                "realistic": "photorealistic, documentary style, natural lighting",
                "cinematic": "cinematic wide-angle shot, dramatic composition, movie-like quality", 
                "dramatic": "dramatic lighting, epic atmosphere, moody and intense"
            }
            
            atmosphere_modifiers = {
                "packed": "completely packed stadium, sea of passionate fans",
                "half_full": "half-filled stadium, moderate crowd atmosphere",
                "empty": "empty stadium, training day or maintenance atmosphere"
            }
            
            time_modifiers = {
                "day": "bright daylight, clear visibility, natural lighting",
                "night": "stadium floodlights, night match atmosphere, dramatic lighting",
                "sunset": "golden hour lighting, warm sunset colors, magical atmosphere"
            }
            
            weather_modifiers = {
                "clear": "clear sky, perfect weather conditions",
                "dramatic": "dramatic cloudy sky, moody atmosphere, storm approaching",
                "cloudy": "overcast sky, diffused lighting, atmospheric conditions"
            }
            
            # Constrói prompt final combinando análise + parâmetros
            final_prompt = f"""
            {base_prompt}
            
            Enhanced with: {style_modifiers.get(generation_params.get('generation_style', 'realistic'))}
            Crowd atmosphere: {atmosphere_modifiers.get(generation_params.get('atmosphere', 'packed'))}
            Lighting conditions: {time_modifiers.get(generation_params.get('time_of_day', 'night'))}
            Weather: {weather_modifiers.get(generation_params.get('weather', 'clear'))}
            
            Professional stadium photography, ultra-high resolution, perfect composition, 
            award-winning sports photography, masterpiece quality
            """
        else:
            # Usa sistema de prompts base estruturados
            custom_params = {
                'time_of_day': generation_params.get('time_of_day', 'night'),
                'weather': generation_params.get('weather', 'clear'),
                'crowd_density': generation_params.get('atmosphere', 'packed')
            }
            
            final_prompt = build_stadium_prompt(
                stadium_id=stadium_id,
                base_atmosphere=base_atmosphere,
                generation_style=generation_params.get('generation_style', 'realistic'),
                custom_params=custom_params
            )
        
        print(f"🎨 Generating stadium with DALL-E 3...")
        print(f"📝 Prompt: {final_prompt[:100]}...")
        
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_api_key)
            
            response = client.images.generate(
                model="dall-e-3",
                prompt=final_prompt,
                size="1024x1024",
                quality=generation_params.get('quality', 'standard'),
                n=1
            )
            
            # Baixa a imagem
            image_url = response.data[0].url
            img_response = requests.get(image_url, timeout=60)
            
            if img_response.status_code == 200:
                image = Image.open(BytesIO(img_response.content))
                buffered = BytesIO()
                image.save(buffered, format="PNG")
                image_base64 = base64.b64encode(buffered.getvalue()).decode()
                
                print("✅ Stadium image generated successfully")
                return image_base64
            else:
                raise Exception(f"Failed to download image: {img_response.status_code}")
                
        except Exception as e:
            error_msg = f"DALL-E 3 generation error: {str(e)}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
    
    def process_stadium_complete(self, request: StadiumGenerationRequest) -> dict:
        """Pipeline completo: Análise + Geração"""
        
        total_cost = 0
        
        # Passo 1: Análise com GPT-4 Vision
        print("🔄 Step 1: Analyzing reference image...")
        analysis = self.analyze_stadium_with_vision(
            request.reference_image_base64, 
            "comprehensive"
        )
        
        if "error" in analysis:
            return {
                "success": False,
                "error": f"Analysis failed: {analysis['error']}"
            }
        
        # Custo GPT-4 Vision (estimativa)
        vision_cost = 0.01  # ~$0.01 por imagem
        total_cost += vision_cost
        
        # Passo 2: Geração com DALL-E 3
        print("🔄 Step 2: Generating new stadium image...")
        
        generation_params = {
            "generation_style": request.generation_style,
            "atmosphere": request.atmosphere,
            "time_of_day": request.time_of_day,
            "weather": request.weather,
            "quality": request.quality
        }
        
        try:
            generated_image = self.generate_stadium_with_dalle3(analysis, generation_params)
            
            # Custo DALL-E 3
            dalle_cost = 0.040 if request.quality == "standard" else 0.080
            total_cost += dalle_cost
            
            print(f"✅ Complete pipeline finished - Total cost: ${total_cost:.3f}")
            
            return {
                "success": True,
                "analysis": analysis,
                "generated_image_base64": generated_image,
                "cost_usd": total_cost
            }
            
        except Exception as e:
            return {
                "success": False,
                "analysis": analysis,
                "error": str(e),
                "cost_usd": total_cost
            }

# --- API FastAPI ---
app = FastAPI(title="Stadium Vision + DALL-E 3 API", version="1.0.0")

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
    stadium_system = StadiumVisionSystem()
except Exception as e:
    print(f"❌ Failed to initialize: {e}")
    stadium_system = None

@app.get("/")
async def root():
    return {
        "status": "online", 
        "service": "Stadium Vision + DALL-E 3 API", 
        "version": "1.0.0",
        "pipeline": "GPT-4 Vision → DALL-E 3"
    }

@app.post("/analyze-stadium", response_model=StadiumResponse)
async def analyze_stadium_endpoint(request: StadiumAnalysisRequest):
    """Apenas analisa o estádio com GPT-4 Vision"""
    if not stadium_system:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        analysis = stadium_system.analyze_stadium_with_vision(
            request.reference_image_base64,
            request.analysis_type
        )
        
        return StadiumResponse(
            success=True,
            analysis=analysis,
            cost_usd=0.01
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-stadium", response_model=StadiumResponse)
async def generate_stadium_endpoint(request: StadiumGenerationRequest):
    """Pipeline completo: Análise + Geração"""
    if not stadium_system:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        result = stadium_system.process_stadium_complete(request)
        
        return StadiumResponse(
            success=result["success"],
            analysis=result.get("analysis"),
            generated_image_base64=result.get("generated_image_base64"),
            cost_usd=result.get("cost_usd"),
            error=result.get("error")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "gpt4_vision": "openrouter" if stadium_system else "not_initialized",
        "dalle3": "openai_direct" if stadium_system else "not_initialized"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 