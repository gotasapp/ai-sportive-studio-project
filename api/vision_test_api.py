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

# ===== STADIUM-SPECIFIC MODELS =====
class StadiumAnalysisRequest(BaseModel):
    image_base64: str
    model: str = "openai/gpt-4o-mini"
    stadium_type: str = "external"  # external or internal

class StadiumGenerationRequest(BaseModel):
    analysis_result: Dict[str, Any]
    image_base64: str
    model: str = "openai/gpt-4o-mini"
    stadium_type: str = "external"
    generation_style: str = "realistic"
    perspective: str = "external"
    atmosphere: str = "packed"
    time_of_day: str = "day"
    weather: str = "clear"

class StadiumResponse(BaseModel):
    success: bool
    generated_image_base64: Optional[str] = None
    analysis_used: Optional[Dict[str, Any]] = None
    final_prompt: Optional[str] = None
    model_used: Optional[str] = None
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
        
        # ===== STADIUM ANALYSIS PROMPTS =====
        self.stadium_analysis_prompts = {
            "external": """Analyze this stadium image and return a JSON object with the following structure:
{
  "architectural_style": "modern/classic/traditional/futuristic",
  "structure_type": "bowl/horseshoe/oval/rectangular", 
  "capacity_estimate": "small/medium/large/massive",
  "roof_type": "open/partial/closed/retractable",
  "facade_materials": "concrete/steel/glass/mixed",
  "seating_colors": ["primary color", "secondary color"],
  "lighting_setup": "day/night/mixed/floodlights",
  "atmosphere": "packed/moderate/empty",
  "perspective": "aerial/ground/elevated/internal",
  "weather_conditions": "clear/cloudy/dramatic/sunset",
  "architectural_features": ["notable features like towers, arches, etc"],
  "landscape_context": "urban/suburban/isolated/integrated",
  "predominant_colors": ["list of main colors seen"],
  "unique_characteristics": "brief description of what makes this stadium distinctive"
}

Focus on architectural elements, structural design, capacity indicators, materials, and atmospheric conditions.""",
            
            "internal": """Analyze this stadium interior image and return a JSON object with the following structure:
{
  "interior_type": "bowl/tier/box/field_level",
  "seating_layout": "single_tier/multi_tier/curved/straight",
  "field_surface": "grass/artificial/track/court",
  "seating_colors": ["primary color", "secondary color"],
  "crowd_density": "packed/half_full/empty/sparse",
  "lighting_type": "natural/artificial/mixed/dramatic",
  "roof_visibility": "open/covered/partial/retractable",
  "architectural_features": ["pillars, arches, screens, etc"],
  "atmosphere_mood": "energetic/calm/dramatic/professional",
  "perspective_level": "field/lower_tier/upper_tier/premium",
  "predominant_colors": ["list of main interior colors"],
  "scale_indicators": "intimate/medium/large/massive",
  "unique_elements": "description of distinctive interior features"
}

Focus on interior architecture, seating arrangements, lighting, atmosphere, and spatial characteristics."""
        }
        
        # ===== STADIUM GENERATION PROMPTS =====
        self.stadium_generation_prompts = {
            "external": """A stunning photorealistic external view of a sports stadium. The architectural design, color scheme, and structural elements must be heavily inspired by the uploaded reference image. Preserve the architectural style, facade materials, roof design, and overall proportions from the reference. The stadium should feature the generation style of "{style}" with enhanced professional finish. Display the stadium from an elevated perspective showing the complete exterior structure. Include atmospheric lighting that matches the time of day and weather conditions detected in the reference. Use ultra-high definition 4K rendering, professional architectural photography angle, dramatic sky background that complements the stadium's design. Capture the grandeur and scale typical of professional sports venues. Parameters: perspective={perspective}, atmosphere={atmosphere}, time={time_of_day}, weather={weather}.""",
            
            "internal": """A breathtaking photorealistic interior view of a sports stadium. Base the design entirely on the uploaded reference image, preserving the seating layout, architectural features, field surface, and interior color scheme. Maintain the crowd density, lighting type, and atmospheric mood from the reference. The interior should reflect the "{style}" theme with enhanced professional quality. Show the stadium interior from an optimal viewing angle that captures the scale and atmosphere. Include detailed seating sections, field/pitch surface, architectural elements like screens or overhangs, and appropriate lighting (natural/artificial/mixed). Render in ultra-high definition 4K with professional sports photography quality, capturing the energy and atmosphere of a world-class sports venue. Parameters: perspective={perspective}, atmosphere={atmosphere}, time={time_of_day}, weather={weather}."""
        }
        
        print("✅ Vision Test System initialized")
        print(f"🔍 Model: {MODEL_NAME}")
        print(f"📡 API: OpenRouter")
        print("🏟️ Stadium Vision System: Ready")
    
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
    
    # ===== STADIUM-SPECIFIC METHODS =====
    
    def analyze_stadium_image(self, image_base64: str, stadium_type: str, model: str = MODEL_NAME) -> Dict[str, Any]:
        """Analisa imagem de stadium usando prompts específicos"""
        try:
            # Get stadium-specific analysis prompt
            analysis_prompt = self.stadium_analysis_prompts.get(stadium_type, self.stadium_analysis_prompts["external"])
            
            print(f"🏟️ [STADIUM ANALYSIS] Analyzing {stadium_type} stadium with {model}...")
            print(f"📝 Using stadium-specific prompt for {stadium_type} view")
            
            # Use the existing vision analysis method
            result = self.analyze_image_vision(image_base64, analysis_prompt, model)
            
            if result["success"]:
                # Try to parse JSON response
                try:
                    analysis_text = result["analysis"]
                    # Extract JSON if wrapped in markdown
                    if "```json" in analysis_text:
                        json_start = analysis_text.find("```json") + 7
                        json_end = analysis_text.find("```", json_start)
                        analysis_text = analysis_text[json_start:json_end].strip()
                    elif "```" in analysis_text:
                        json_start = analysis_text.find("```") + 3
                        json_end = analysis_text.find("```", json_start)
                        analysis_text = analysis_text[json_start:json_end].strip()
                    
                    analysis_json = json.loads(analysis_text)
                    result["analysis_json"] = analysis_json
                    print("✅ [STADIUM ANALYSIS] JSON parsing successful")
                    
                except json.JSONDecodeError as e:
                    print(f"⚠️ [STADIUM ANALYSIS] JSON parsing failed, using raw text: {e}")
                    result["analysis_json"] = {"raw_analysis": result["analysis"]}
            
            return result
            
        except Exception as e:
            error_msg = f"Stadium analysis error: {str(e)}"
            print(f"❌ [STADIUM ANALYSIS] {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def generate_stadium_with_vision(self, analysis_result: Dict[str, Any], image_base64: str, 
                                   stadium_type: str, generation_style: str, perspective: str,
                                   atmosphere: str, time_of_day: str, weather: str, 
                                   model: str = MODEL_NAME) -> Dict[str, Any]:
        """Gera stadium usando análise e prompt específico"""
        try:
            # Get stadium generation prompt template
            prompt_template = self.stadium_generation_prompts.get(stadium_type, self.stadium_generation_prompts["external"])
            
            # Format prompt with parameters
            final_prompt = prompt_template.format(
                style=generation_style,
                perspective=perspective,
                atmosphere=atmosphere,
                time_of_day=time_of_day,
                weather=weather
            )
            
            # Add analysis context to prompt
            if analysis_result and "analysis_json" in analysis_result:
                analysis_summary = f"Based on analysis: {json.dumps(analysis_result['analysis_json'], indent=2)}"
                final_prompt = f"{analysis_summary}\n\n{final_prompt}"
            
            print(f"🎨 [STADIUM GENERATION] Generating {stadium_type} stadium with {model}...")
            print(f"🎯 Style: {generation_style}, Perspective: {perspective}")
            print(f"🌅 Atmosphere: {atmosphere}, Time: {time_of_day}, Weather: {weather}")
            
            # Generate using DALL-E 3 via OpenRouter
            dalle_response = self.generate_with_dalle3(final_prompt)
            
            if dalle_response["success"]:
                return {
                    "success": True,
                    "generated_image_base64": dalle_response["image_base64"],
                    "analysis_used": analysis_result,
                    "final_prompt": final_prompt,
                    "model_used": model,
                    "generation_params": {
                        "stadium_type": stadium_type,
                        "style": generation_style,
                        "perspective": perspective,
                        "atmosphere": atmosphere,
                        "time_of_day": time_of_day,
                        "weather": weather
                    }
                }
            else:
                return {
                    "success": False,
                    "error": dalle_response["error"]
                }
                
        except Exception as e:
            error_msg = f"Stadium generation error: {str(e)}"
            print(f"❌ [STADIUM GENERATION] {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
    
    def generate_with_dalle3(self, prompt: str) -> Dict[str, Any]:
        """Gera imagem usando DALL-E 3 via OpenRouter"""
        try:
            payload = {
                "model": "openai/dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024",
                "quality": "standard",
                "response_format": "b64_json"
            }
            
            # Use OpenRouter's image generation endpoint
            image_url = "https://openrouter.ai/api/v1/images/generations"
            
            print(f"🎨 Generating image with DALL-E 3...")
            print(f"📝 Prompt length: {len(prompt)} characters")
            
            response = requests.post(
                image_url,
                headers=self.headers,
                json=payload,
                timeout=120  # DALL-E can take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                image_base64 = data['data'][0]['b64_json']
                
                print("✅ DALL-E 3 generation completed")
                
                return {
                    "success": True,
                    "image_base64": image_base64
                }
            else:
                error_msg = f"DALL-E 3 API error: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
                
        except Exception as e:
            error_msg = f"DALL-E 3 generation error: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

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
        "pipeline": "OpenRouter Vision + DALL-E 3",
        "features": [
            "Image Analysis",
            "Stadium Vision Analysis",
            "Stadium Generation with Vision"
        ],
        "endpoints": [
            "/analyze-image-upload",
            "/analyze-image-base64", 
            "/analyze-stadium",
            "/generate-stadium-with-vision",
            "/available-models",
            "/health"
        ]
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

# ===== STADIUM-SPECIFIC ENDPOINTS =====

@app.post("/analyze-stadium", response_model=Dict[str, Any])
async def analyze_stadium(request: StadiumAnalysisRequest):
    """Endpoint para análise específica de stadium"""
    if not vision_system:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        print(f"🏟️ [ANALYZE STADIUM] Received request for {request.stadium_type} stadium analysis")
        
        result = vision_system.analyze_stadium_image(
            request.image_base64,
            request.stadium_type,
            request.model
        )
        
        if result["success"]:
            print(f"✅ [ANALYZE STADIUM] Analysis completed successfully")
            return {
                "success": True,
                "analysis": result.get("analysis"),
                "analysis_json": result.get("analysis_json"),
                "model_used": result.get("model_used"),
                "stadium_type": request.stadium_type,
                "timestamp": "2024-01-21"
            }
        else:
            print(f"❌ [ANALYZE STADIUM] Analysis failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get("error"))
        
    except Exception as e:
        print(f"❌ [ANALYZE STADIUM] Endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-stadium-with-vision", response_model=StadiumResponse)
async def generate_stadium_with_vision(request: StadiumGenerationRequest):
    """Endpoint para geração de stadium usando Vision + DALL-E 3"""
    if not vision_system:
        raise HTTPException(status_code=500, detail="System not initialized")
    
    try:
        print(f"🎨 [GENERATE STADIUM] Starting vision-based generation")
        print(f"🏟️ Type: {request.stadium_type}, Style: {request.generation_style}")
        
        result = vision_system.generate_stadium_with_vision(
            request.analysis_result,
            request.image_base64,
            request.stadium_type,
            request.generation_style,
            request.perspective,
            request.atmosphere,
            request.time_of_day,
            request.weather,
            request.model
        )
        
        if result["success"]:
            print(f"✅ [GENERATE STADIUM] Generation completed successfully")
            return StadiumResponse(
                success=True,
                generated_image_base64=result["generated_image_base64"],
                analysis_used=result["analysis_used"],
                final_prompt=result["final_prompt"],
                model_used=result["model_used"]
            )
        else:
            print(f"❌ [GENERATE STADIUM] Generation failed: {result.get('error')}")
            return StadiumResponse(
                success=False,
                error=result.get("error")
            )
        
    except Exception as e:
        print(f"❌ [GENERATE STADIUM] Endpoint error: {str(e)}")
        return StadiumResponse(
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)  # Porta diferente da API principal 