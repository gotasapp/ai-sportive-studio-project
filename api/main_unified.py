#!/usr/bin/env python3
"""
API Unificada - Jerseys + Stadiums
Combina as funcionalidades de geração de jerseys e estádios em uma única API
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
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime
import pymongo

# Importar sistema de prompts premium para stadiums
from stadium_base_prompts import build_enhanced_stadium_prompt, STADIUM_NFT_BASE_PROMPT

# Importar sistema modular de badges
try:
    from badge_api import register_badge_routes
    BADGES_AVAILABLE = True
    print("✅ Sistema de badges disponível")
except ImportError as e:
    print(f"⚠️ Sistema de badges não disponível: {e}")
    BADGES_AVAILABLE = False

load_dotenv()

# --- Conexão MongoDB ---
DB_NAME = "chz-app-db" # Nome do banco de dados principal
MONGO_URI = os.getenv("MONGODB_URI_PROD")
db_client = None
db = None

try:
    if not MONGO_URI:
        print("⚠️ MONGODB_URI_PROD não encontrada no .env. As operações de banco de dados estarão desativadas.")
    else:
        print("⚙️ Conectando ao MongoDB...")
        db_client = pymongo.MongoClient(MONGO_URI)
        # Testa a conexão para garantir que está funcionando
        db_client.admin.command('ping')
        db = db_client[DB_NAME]
        print(f"✅ Conexão com o MongoDB estabelecida com sucesso ao banco '{DB_NAME}'.")
except Exception as e:
    print(f"❌ Falha na conexão com o MongoDB: {e}")
    db = None # Garante que 'db' é None se a conexão falhar

# Configurações
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
STADIUM_REFERENCES_PATH = Path("stadium_references")

# --- MODELOS DE DADOS PARA JERSEYS ---
class ImageGenerationRequest(BaseModel):
    model_id: str
    player_name: str
    player_number: str
    quality: str = "standard"

class GenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None

# --- MODELOS DE DADOS PARA BADGES ---
class BadgeGenerationRequest(BaseModel):
    model_id: str  # Team name
    badge_name: str
    badge_number: str
    style: str = "modern"
    quality: str = "standard"

class BadgeResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    cost_usd: Optional[float] = None
    error: Optional[str] = None
    prompt_used: Optional[str] = None

# --- MODELOS DE DADOS PARA STADIUMS ---
class StadiumReferenceRequest(BaseModel):
    stadium_id: str
    reference_type: str = "atmosphere"
    generation_style: str = "realistic"
    perspective: str = "external"
    atmosphere: str = "packed"
    time_of_day: str = "day"
    weather: str = "clear"
    quality: str = "standard"
    custom_prompt: Optional[str] = None
    custom_reference_base64: Optional[str] = None

class CustomStadiumRequest(BaseModel):
    prompt: str
    reference_image_base64: Optional[str] = None
    generation_style: str = "realistic"
    perspective: str = "external"
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
    reference_source: Optional[str] = None
    error: Optional[str] = None
    cost_usd: Optional[float] = None
    prompt_used: Optional[str] = None

# --- MODELOS DE DADOS PARA REFERÊNCIA ---
class GenerateFromReferenceRequest(BaseModel):
    teamName: str
    player_name: str
    player_number: str
    quality: str = "standard"
    sport: str = "soccer"
    view: str = "back"

class ReferenceGenerationResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    prompt: Optional[str] = None
    error: Optional[str] = None

# --- GERADOR DE JERSEYS ---
class JerseyGenerator:
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

    def generate_image(self, request: ImageGenerationRequest) -> str:
        """Gera uma camisa usando prompt otimizado específico do time."""
        
        team_name = self._get_team_name_from_model_id(request.model_id)
        
        if team_name not in self.team_prompts:
            raise ValueError(f"Time '{team_name}' não tem prompt configurado")
        
        prompt_template = self.team_prompts[team_name]
        final_prompt = prompt_template.format(
            PLAYER_NAME=request.player_name.upper(),
            PLAYER_NUMBER=request.player_number
        )
        
        print(f"INFO: Gerando {team_name} com prompt otimizado")
        
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

# --- GERADOR DE STADIUMS ---
class StadiumReferenceGenerator:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        print("✅ Stadium Reference Generator initialized")
    
    def get_available_stadiums(self) -> List[StadiumInfo]:
        """Lista estádios disponíveis"""
        stadiums = []
        
        if not STADIUM_REFERENCES_PATH.exists():
            return stadiums
        
        for stadium_dir in STADIUM_REFERENCES_PATH.iterdir():
            if stadium_dir.is_dir():
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
        
        for ext in ['jpg', 'jpeg', 'png', 'webp']:
            files = list(stadium_path.glob(f"*.{ext}"))
            if files:
                image_file = files[0]
                try:
                    with open(image_file, 'rb') as f:
                        image_data = f.read()
                        return base64.b64encode(image_data).decode('utf-8')
                except Exception as e:
                    print(f"❌ Error loading {image_file}: {e}")
                    continue
        
        return None
    
    def analyze_reference_image(self, image_base64: str, stadium_name: str) -> Dict[str, Any]:
        """Analisa imagem de referência"""
        try:
            print(f"🔍 Analyzing {stadium_name}...")
            
            prompt = f"""Analyze this {stadium_name} stadium image for premium NFT artwork generation. Focus on:

ARCHITECTURAL ANALYSIS:
- Distinctive architectural features and design elements
- Structural characteristics (roof design, seating configuration, facades)
- Unique visual elements that make this stadium iconic
- Materials and textures visible in the structure

AESTHETIC QUALITIES:
- Color scheme and visual identity
- Lighting characteristics and atmosphere
- Proportions and scale relationships

Provide a detailed architectural description for NFT generation."""
            
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
            
            return {
                "architectural_description": analysis_text,
                "stadium_name": stadium_name,
                "analysis_type": "premium_nft_focused"
            }
            
        except Exception as e:
            print(f"❌ Analysis error: {e}")
            return {
                "error": str(e),
                "stadium_name": stadium_name
            }
    
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
    
    def generate_from_reference(self, request: StadiumReferenceRequest) -> StadiumResponse:
        """Gera estádio baseado em referência"""
        try:
            total_cost = 0
            analysis = None
            reference_used = f"{request.stadium_id}_{request.reference_type}"
            
            # Carregar imagem de referência
            image_base64 = self.load_reference_image(request.stadium_id, request.reference_type)
            
            if image_base64:
                # Analisar referência
                analysis = self.analyze_reference_image(image_base64, request.stadium_id)
                total_cost += 0.01
                
                # Construir prompt baseado na análise
                if "architectural_description" in analysis:
                    base_prompt = analysis["architectural_description"]
                else:
                    base_prompt = f"A modern stadium similar to {request.stadium_id}"
                
                # Usar sistema de prompts premium
                enhanced_prompt = build_enhanced_stadium_prompt(
                    architectural_analysis=base_prompt,
                    style=request.generation_style,
                    perspective=request.perspective,
                    atmosphere=request.atmosphere,
                    time_of_day=request.time_of_day,
                    weather=request.weather
                )
                
                # Gerar imagem
                generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
                
                if generation_result["success"]:
                    total_cost += generation_result["cost"]
                    
                    return StadiumResponse(
                        success=True,
                        analysis=analysis,
                        generated_image_base64=generation_result["image_base64"],
                        reference_used=reference_used,
                        reference_source="local",
                        cost_usd=total_cost,
                        prompt_used=enhanced_prompt
                    )
                else:
                    return StadiumResponse(
                        success=False,
                        error=generation_result["error"]
                    )
            
            # Fallback para prompt customizado
            elif request.custom_prompt or request.custom_reference_base64:
                if request.custom_reference_base64:
                    analysis = self.analyze_reference_image(request.custom_reference_base64, "custom")
                    total_cost += 0.01
                    base_prompt = analysis.get("architectural_description", request.custom_prompt or "Modern stadium")
                else:
                    base_prompt = request.custom_prompt or "Modern stadium"
                
                enhanced_prompt = build_enhanced_stadium_prompt(
                    architectural_analysis=base_prompt,
                    style=request.generation_style,
                    perspective=request.perspective,
                    atmosphere=request.atmosphere,
                    time_of_day=request.time_of_day,
                    weather=request.weather
                )
                
                generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
                
                if generation_result["success"]:
                    total_cost += generation_result["cost"]
                    
                    return StadiumResponse(
                        success=True,
                        analysis=analysis,
                        generated_image_base64=generation_result["image_base64"],
                        reference_used="custom",
                        reference_source="custom",
                        cost_usd=total_cost,
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
                
        except Exception as e:
            return StadiumResponse(
                success=False,
                error=str(e)
            )
    
    def generate_custom(self, request: CustomStadiumRequest) -> StadiumResponse:
        """Gera estádio customizado"""
        try:
            total_cost = 0
            analysis = None
            
            # Analisar imagem de referência se fornecida
            if request.reference_image_base64:
                analysis = self.analyze_reference_image(request.reference_image_base64, "custom")
                total_cost += 0.01
                base_prompt = analysis.get("architectural_description", request.prompt)
            else:
                base_prompt = request.prompt
            
            # Construir prompt aprimorado
            enhanced_prompt = build_enhanced_stadium_prompt(
                base_description=base_prompt,
                generation_style=request.generation_style,
                perspective=request.perspective,
                atmosphere=request.atmosphere,
                time_of_day=request.time_of_day
            )
            
            # Gerar imagem
            generation_result = self.generate_stadium_dalle3(enhanced_prompt, request.quality)
            
            if generation_result["success"]:
                total_cost += generation_result["cost"]
                
                return StadiumResponse(
                    success=True,
                    analysis=analysis,
                    generated_image_base64=generation_result["image_base64"],
                    reference_used="custom_prompt",
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
            return StadiumResponse(
                success=False,
                error=str(e)
            )

# --- CONFIGURAÇÃO DA API FASTAPI ---
app = FastAPI(title="Unified API - Jerseys + Stadiums", version="1.0.0")

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

# Inicializar geradores
jersey_generator = JerseyGenerator()
stadium_generator = StadiumReferenceGenerator()

# Registrar rotas de badges se disponível
if BADGES_AVAILABLE:
    try:
        register_badge_routes(app)
        print("✅ Rotas de badges registradas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao registrar rotas de badges: {e}")
        BADGES_AVAILABLE = False

# --- ENDPOINTS PRINCIPAIS ---
@app.get("/")
async def root():
    endpoints = {
        "jerseys": "/generate, /teams",
        "stadiums": "/stadiums, /generate-from-reference, /generate-custom"
    }
    
    if BADGES_AVAILABLE:
        endpoints["badges"] = "/badges/generate, /badges/styles, /badges/teams, /badges/info"
    
    return {
        "status": "online", 
        "service": "Unified API - Jerseys + Stadiums + Badges", 
        "version": "1.0.0",
        "badges_available": BADGES_AVAILABLE,
        "endpoints": endpoints
    }

# --- ENDPOINTS DE JERSEYS ---
@app.post("/generate", response_model=GenerationResponse)
async def generate_jersey_endpoint(request: ImageGenerationRequest):
    try:
        image_base64 = jersey_generator.generate_image(request)
        return GenerationResponse(
            success=True,
            image_base64=image_base64,
            cost_usd=0.045
        )
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/teams")
async def get_available_teams():
    """Lista times disponíveis para jerseys"""
    image_dir = Path("image_references")
    if not image_dir.is_dir():
        return {"error": "Image references directory not found."}

    teams = []
    for subdir in image_dir.iterdir():
        if subdir.is_dir():
            team_name = subdir.name.replace("_", " ").title()
            teams.append(team_name)
    
    return sorted(teams)

# --- ENDPOINTS DE STADIUMS ---
@app.get("/stadiums", response_model=List[StadiumInfo])
async def list_stadiums():
    """Lista estádios disponíveis"""
    try:
        stadiums = stadium_generator.get_available_stadiums()
        return stadiums
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-from-reference", response_model=StadiumResponse)
async def generate_stadium_from_reference(request: StadiumReferenceRequest):
    """Gera estádio baseado em referência local"""
    try:
        result = stadium_generator.generate_from_reference(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-custom", response_model=StadiumResponse)
async def generate_custom_stadium(request: CustomStadiumRequest):
    """Gera estádio customizado"""
    try:
        result = stadium_generator.generate_custom(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- HEALTH CHECK ---
@app.get("/health")
async def health_check():
    health_status = {
        "status": "ok",
        "jersey_generator": "operational",
        "stadium_generator": "operational",
        "openai": "connected",
        "openrouter": "connected"
    }
    
    if BADGES_AVAILABLE:
        health_status["badge_generator"] = "operational"
    else:
        health_status["badge_generator"] = "not_available"
    
    return health_status

# ENDPOINT DE GERAÇÃO POR REFERÊNCIA ATUALIZADO
@app.post("/generate-jersey-from-reference", response_model=ReferenceGenerationResponse)
async def generate_jersey_from_reference(request: GenerateFromReferenceRequest):
    """
    Gera uma jersey usando uma referência de time do MongoDB.
    """
    try:
        print(f"✅ [DB FLOW] Received request for team: {request.teamName}")

        if not db:
            raise HTTPException(status_code=500, detail="A conexão com o banco de dados não está disponível.")

        # 1. Buscar a referência do time no MongoDB
        print(f"🔍 [DB FLOW] Buscando referência para '{request.teamName}' no MongoDB...")
        references_collection = db["team_references"]
        
        # Usando 'teamName' para corresponder ao schema do Next.js
        team_reference = references_collection.find_one({"teamName": request.teamName})

        if not team_reference:
            raise HTTPException(status_code=404, detail=f"Referência para o time '{request.teamName}' não encontrada no banco de dados.")

        prompt_template = team_reference.get("teamBasePrompt")
        if not prompt_template:
            raise HTTPException(status_code=404, detail=f"O 'teamBasePrompt' para o time '{request.teamName}' está vazio ou não foi encontrado.")

        print("✅ [DB FLOW] Referência encontrada. Usando teamBasePrompt do banco de dados.")

        # 2. Preparar e gerar a imagem com o prompt do DB
        final_prompt = prompt_template.format(
            PLAYER_NAME=request.player_name.upper(),
            PLAYER_NUMBER=request.player_number
        )
        
        print(f"INFO: [DB FLOW] Generating image with prompt: {final_prompt[:100]}...")
        
        # Reutilizando a lógica do OpenAI client (pode ser instanciado uma vez no topo)
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        
        generation_response = openai_client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1024x1024",
            quality=request.quality,
            n=1
        )
        
        image_url = generation_response.data[0].url
        print(f"✅ [DB FLOW] Image generated successfully: {image_url}")
        
        return ReferenceGenerationResponse(
            success=True,
            image_url=image_url,
            prompt=final_prompt
        )

    except Exception as e:
        print(f"❌ [DB FLOW] Error: {str(e)}")
        # Extrair a mensagem do HTTPException se for o caso
        error_detail = getattr(e, 'detail', str(e))
        return ReferenceGenerationResponse(success=False, error=error_detail)


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Unified API (Jerseys + Stadiums) on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000) 