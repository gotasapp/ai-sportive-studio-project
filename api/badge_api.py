#!/usr/bin/env python3
"""
API específica para geração de Badges/Logos
Endpoints dedicados para o BadgeGenerator
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging
from badge_generator import BadgeGenerator
from badge_prompts import get_available_styles, get_supported_teams

# Configurar logging
logger = logging.getLogger(__name__)

# Router para badges
badge_router = APIRouter(prefix="/badges", tags=["badges"])

# Modelos Pydantic para badges
class BadgeGenerationRequest(BaseModel):
    team_name: str = Field(..., description="Nome do time")
    badge_name: str = Field(..., description="Nome/texto do badge")
    badge_number: str = Field(..., description="Número do badge")
    style: str = Field(default="modern", description="Estilo do badge")
    size: str = Field(default="1024x1024", description="Tamanho da imagem")
    quality: str = Field(default="hd", description="Qualidade da imagem")

class BadgeVariationsRequest(BaseModel):
    team_name: str = Field(..., description="Nome do time")
    badge_name: str = Field(..., description="Nome/texto do badge")
    badge_number: str = Field(..., description="Número do badge")
    styles: Optional[List[str]] = Field(default=None, description="Lista de estilos (None = todos)")

class BadgeGenerationResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    revised_prompt: Optional[str] = None
    optimized_image: Optional[str] = None
    metadata: Dict[str, Any]
    error: Optional[str] = None

# Instância global do gerador (será inicializada no startup)
badge_generator: Optional[BadgeGenerator] = None

def initialize_badge_generator():
    """Inicializa o gerador de badges"""
    global badge_generator
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY não configurada")
    
    badge_generator = BadgeGenerator(api_key)
    logger.info("✅ BadgeGenerator inicializado")

@badge_router.get("/info")
async def get_badge_info():
    """Informações sobre o sistema de badges"""
    if not badge_generator:
        raise HTTPException(status_code=500, detail="BadgeGenerator não inicializado")
    
    return {
        "generator_info": badge_generator.get_info(),
        "available_styles": get_available_styles(),
        "supported_teams": get_supported_teams()
    }

@badge_router.post("/generate", response_model=BadgeGenerationResponse)
async def generate_badge(request: BadgeGenerationRequest):
    """
    Gera um badge/logo específico
    """
    if not badge_generator:
        raise HTTPException(status_code=500, detail="BadgeGenerator não inicializado")
    
    try:
        logger.info(f"🎨 Nova solicitação de badge: {request.team_name} - {request.badge_name}")
        
        # Validar estilo
        available_styles = get_available_styles()
        if request.style not in available_styles:
            raise HTTPException(
                status_code=400, 
                detail=f"Estilo '{request.style}' não suportado. Estilos disponíveis: {available_styles}"
            )
        
        # Gerar badge
        result = badge_generator.generate_badge(
            team_name=request.team_name,
            badge_name=request.badge_name,
            badge_number=request.badge_number,
            style=request.style,
            size=request.size,
            quality=request.quality
        )
        
        # Retornar resultado
        return BadgeGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Erro na geração do badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@badge_router.post("/generate-variations")
async def generate_badge_variations(request: BadgeVariationsRequest):
    """
    Gera múltiplas variações de um badge
    """
    if not badge_generator:
        raise HTTPException(status_code=500, detail="BadgeGenerator não inicializado")
    
    try:
        logger.info(f"🔄 Solicitação de variações: {request.team_name} - {request.badge_name}")
        
        # Validar estilos se fornecidos
        if request.styles:
            available_styles = get_available_styles()
            invalid_styles = [s for s in request.styles if s not in available_styles]
            if invalid_styles:
                raise HTTPException(
                    status_code=400,
                    detail=f"Estilos inválidos: {invalid_styles}. Estilos disponíveis: {available_styles}"
                )
        
        # Gerar variações
        result = badge_generator.generate_badge_variations(
            team_name=request.team_name,
            badge_name=request.badge_name,
            badge_number=request.badge_number,
            styles=request.styles
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Erro na geração de variações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@badge_router.get("/styles")
async def get_available_badge_styles():
    """Lista todos os estilos disponíveis para badges"""
    return {
        "styles": get_available_styles(),
        "total": len(get_available_styles())
    }

@badge_router.get("/teams")
async def get_supported_teams():
    """Lista todos os times com prompts específicos"""
    return {
        "teams": get_supported_teams(),
        "total": len(get_supported_teams())
    }

# Função para registrar as rotas no app principal
def register_badge_routes(app):
    """
    Registra as rotas de badges no app principal
    
    Args:
        app: Instância do FastAPI
    """
    # Inicializar o gerador
    initialize_badge_generator()
    
    # Registrar as rotas
    app.include_router(badge_router)
    
    logger.info("✅ Rotas de badges registradas")

# Função para uso standalone
def create_badge_app():
    """
    Cria uma aplicação FastAPI standalone para badges
    
    Returns:
        FastAPI app configurada apenas para badges
    """
    from fastapi import FastAPI
    
    app = FastAPI(
        title="Badge Generator API",
        description="API para geração de badges e logos esportivos",
        version="1.0.0"
    )
    
    # Registrar rotas
    register_badge_routes(app)
    
    return app

# Para uso como aplicação standalone
if __name__ == "__main__":
    import uvicorn
    
    app = create_badge_app()
    
    # Executar servidor
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,  # Porta diferente da API principal
        log_level="info"
    ) 