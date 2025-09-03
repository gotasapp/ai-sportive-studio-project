from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# 🔐 Configuração das chaves
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# 📸 Modelo de geração de imagem (DALL·E 3)
DALLE_MODEL_ID = "openai/dall-e-3"

class GenerateImageRequest(BaseModel):
    prompt: str
    model: str = DALLE_MODEL_ID
    size: str = "1024x1024"
    quality: str = "standard"  # standard ou hd
    use_openai_direct: bool = False  # True para usar OpenAI direto, False para OpenRouter

class GenerateImageResponse(BaseModel):
    success: bool
    image_url: str = None
    image_base64: str = None
    error: str = None
    cost_estimate: float = None
    model_used: str = None

@router.post("/generate-image", response_model=GenerateImageResponse)
async def generate_image(request: GenerateImageRequest):
    """
    Endpoint para geração de imagem via DALL-E 3
    Suporta tanto OpenRouter quanto OpenAI direto
    """
    try:
        print(f"🎨 [IMAGE GENERATION] Starting with model: {request.model}")
        print(f"🎨 [IMAGE GENERATION] Prompt length: {len(request.prompt)} chars")
        print(f"🎨 [IMAGE GENERATION] Size: {request.size}, Quality: {request.quality}")
        print(f"🎨 [IMAGE GENERATION] Use OpenAI direct: {request.use_openai_direct}")
        
        if request.use_openai_direct:
            # Usar OpenAI diretamente
            return await _generate_with_openai_direct(request)
        else:
            # Usar OpenRouter
            return await _generate_with_openrouter(request)
            
    except Exception as e:
        print(f"❌ [IMAGE GENERATION] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar imagem: {str(e)}")

async def _generate_with_openrouter(request: GenerateImageRequest) -> GenerateImageResponse:
    """Gera imagem via OpenRouter"""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY não configurada")
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://jersey-generator-ai2.vercel.app",
        "X-Title": "CHZ Jersey Generator"
    }

    body = {
        "model": request.model,
        "prompt": request.prompt,
        "n": 1,
        "size": request.size
    }
    
    # Adicionar quality se modelo suportar
    if "dall-e-3" in request.model.lower():
        body["quality"] = request.quality

    print(f"🌐 [OPENROUTER] Sending request to OpenRouter...")
    print(f"🌐 [OPENROUTER] Model: {request.model}")
    print(f"🌐 [OPENROUTER] Prompt preview: {request.prompt[:200]}...")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/images/generations",
            json=body,
            headers=headers
        )
        
        print(f"🌐 [OPENROUTER] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            image_url = data["data"][0]["url"]
            
            print(f"✅ [OPENROUTER] Image generated successfully")
            
            return GenerateImageResponse(
                success=True,
                image_url=image_url,
                model_used=request.model,
                cost_estimate=0.08 if request.quality == "hd" else 0.04
            )
        else:
            error_text = response.text
            print(f"❌ [OPENROUTER] Error {response.status_code}: {error_text}")
            raise HTTPException(status_code=response.status_code, detail=f"OpenRouter error: {error_text}")

async def _generate_with_openai_direct(request: GenerateImageRequest) -> GenerateImageResponse:
    """Gera imagem via OpenAI diretamente"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada")
    
    from openai import OpenAI
    import requests
    import base64
    from io import BytesIO
    from PIL import Image
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    print(f"🤖 [OPENAI DIRECT] Generating with DALL-E 3...")
    
    try:
        generation_response = client.images.generate(
            model="dall-e-3",
            prompt=request.prompt,
            size=request.size,
            quality=request.quality,
            n=1
        )
        
        image_url = generation_response.data[0].url
        
        # Baixar e converter para base64 se necessário
        img_response = requests.get(image_url, timeout=60)
        if img_response.status_code == 200:
            image = Image.open(BytesIO(img_response.content))
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            image_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            print(f"✅ [OPENAI DIRECT] Image generated and converted to base64")
            
            return GenerateImageResponse(
                success=True,
                image_url=image_url,
                image_base64=image_base64,
                model_used="dall-e-3",
                cost_estimate=0.08 if request.quality == "hd" else 0.04
            )
        else:
            raise Exception(f"Erro ao baixar imagem: {img_response.status_code}")
            
    except Exception as e:
        print(f"❌ [OPENAI DIRECT] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")

@router.get("/models")
async def list_available_models():
    """Lista modelos disponíveis para geração de imagem"""
    return {
        "models": [
            {
                "id": "openai/dall-e-3",
                "name": "DALL-E 3",
                "provider": "OpenAI",
                "sizes": ["1024x1024", "1024x1792", "1792x1024"],
                "qualities": ["standard", "hd"]
            },
            {
                "id": "openai/dall-e-2", 
                "name": "DALL-E 2",
                "provider": "OpenAI",
                "sizes": ["256x256", "512x512", "1024x1024"],
                "qualities": ["standard"]
            }
        ]
    } 