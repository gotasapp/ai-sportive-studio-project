#!/usr/bin/env python3
"""
FastAPI Server com Modelo LoRA Treinado
Servidor de geração de jerseys usando modelo fine-tuned
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from peft import PeftModel
import base64
from io import BytesIO
from pathlib import Path
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Jersey AI - Trained Model API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de dados
class JerseyRequest(BaseModel):
    team_name: str
    jersey_type: str = "home"  # home, away, third
    primary_color: str = ""
    secondary_color: str = ""
    pattern: str = "solid"  # solid, vertical_stripes, horizontal_stripes
    num_inference_steps: int = 25
    guidance_scale: float = 7.5

class CustomPromptRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    num_inference_steps: int = 25
    guidance_scale: float = 7.5

class ImageResponse(BaseModel):
    image: str  # base64
    prompt_used: str
    generation_time: float

# Variável global para o gerador
generator = None

class TrainedJerseyGenerator:
    """Gerador usando modelo LoRA treinado"""
    
    def __init__(self, lora_model_path="jersey_lora_model/final_model"):
        self.lora_model_path = lora_model_path
        self.pipe = None
        self.load_model()
        
    def load_model(self):
        """Carrega modelo com LoRA"""
        logger.info("🔄 Carregando modelo treinado...")
        
        try:
            # Carrega pipeline base
            base_model_id = "runwayml/stable-diffusion-v1-5"
            self.pipe = StableDiffusionPipeline.from_pretrained(
                base_model_id,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                safety_checker=None,
                requires_safety_checker=False
            )
            
            # Aplica LoRA se existir
            if Path(self.lora_model_path).exists():
                logger.info("🎯 Aplicando modelo LoRA treinado...")
                self.pipe.unet = PeftModel.from_pretrained(
                    self.pipe.unet, 
                    self.lora_model_path
                )
                logger.info("✅ Modelo LoRA carregado com sucesso!")
            else:
                logger.warning("⚠️ Modelo LoRA não encontrado, usando modelo base")
                
            # Otimizações
            self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
                self.pipe.scheduler.config
            )
            
            # Move para GPU se disponível
            if torch.cuda.is_available():
                self.pipe = self.pipe.to("cuda")
                logger.info("✅ Modelo carregado na GPU")
            else:
                logger.info("⚠️ Usando CPU")
                
        except Exception as e:
            logger.error(f"❌ Erro ao carregar modelo: {e}")
            raise
            
    def generate_jersey(self, prompt, negative_prompt=None, num_inference_steps=25, guidance_scale=7.5):
        """Gera jersey baseada no prompt"""
        
        if negative_prompt is None:
            negative_prompt = "ugly, blurry, low quality, distorted, deformed, text, watermark, signature, logo, brand, amateur"
            
        logger.info(f"🎨 Gerando jersey: {prompt}")
        
        try:
            with torch.autocast("cuda" if torch.cuda.is_available() else "cpu"):
                image = self.pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    width=512,
                    height=512
                ).images[0]
                
            return image
            
        except Exception as e:
            logger.error(f"❌ Erro na geração: {e}")
            raise
            
    def generate_team_jersey(self, team_name, jersey_type="home", primary_color="", secondary_color="", pattern="solid", **kwargs):
        """Gera jersey para time específico"""
        
        # Constrói prompt otimizado
        prompt_parts = [
            f"a {jersey_type} soccer jersey",
            f"of {team_name}",
        ]
        
        # Adiciona cores
        if primary_color:
            prompt_parts.append(f"with {primary_color} color")
        if secondary_color:
            prompt_parts.append(f"and {secondary_color} accents")
            
        # Adiciona padrão
        if pattern == "vertical_stripes":
            prompt_parts.append("with vertical stripes")
        elif pattern == "horizontal_stripes":
            prompt_parts.append("with horizontal stripes")
        else:
            prompt_parts.append("with solid design")
            
        prompt_parts.extend([
            "professional football uniform",
            "high quality",
            "detailed",
            "clean design",
            "modern style",
            "realistic"
        ])
        
        prompt = ", ".join(prompt_parts)
        
        return self.generate_jersey(prompt, **kwargs), prompt
        
    def image_to_base64(self, image):
        """Converte imagem para base64"""
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return img_str

@app.on_event("startup")
async def startup_event():
    """Inicializa o gerador na startup"""
    global generator
    try:
        generator = TrainedJerseyGenerator()
        logger.info("🚀 Servidor iniciado com modelo treinado!")
    except Exception as e:
        logger.error(f"❌ Erro na inicialização: {e}")
        # Fallback para modelo base se LoRA falhar
        try:
            generator = TrainedJerseyGenerator("modelo_inexistente")  # Força uso do modelo base
            logger.info("🔄 Usando modelo base como fallback")
        except:
            logger.error("❌ Falha completa na inicialização")
            raise

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "Jersey AI - Trained Model API",
        "version": "2.0.0",
        "status": "running",
        "model_type": "LoRA Fine-tuned" if Path("jersey_lora_model/final_model").exists() else "Base Model"
    }

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "ok",
        "gpu_available": torch.cuda.is_available(),
        "model_loaded": generator is not None,
        "model_type": "LoRA Fine-tuned" if Path("jersey_lora_model/final_model").exists() else "Base Model"
    }

@app.post("/generate-team-jersey", response_model=ImageResponse)
async def generate_team_jersey(request: JerseyRequest):
    """Gera jersey para um time específico"""
    
    if generator is None:
        raise HTTPException(status_code=500, detail="Modelo não carregado")
        
    try:
        import time
        start_time = time.time()
        
        # Gera jersey
        image, prompt_used = generator.generate_team_jersey(
            team_name=request.team_name,
            jersey_type=request.jersey_type,
            primary_color=request.primary_color,
            secondary_color=request.secondary_color,
            pattern=request.pattern,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale
        )
        
        # Converte para base64
        image_b64 = generator.image_to_base64(image)
        
        generation_time = time.time() - start_time
        
        logger.info(f"✅ Jersey gerada em {generation_time:.2f}s")
        
        return ImageResponse(
            image=image_b64,
            prompt_used=prompt_used,
            generation_time=generation_time
        )
        
    except Exception as e:
        logger.error(f"❌ Erro na geração: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-custom", response_model=ImageResponse)
async def generate_custom_jersey(request: CustomPromptRequest):
    """Gera jersey com prompt personalizado"""
    
    if generator is None:
        raise HTTPException(status_code=500, detail="Modelo não carregado")
        
    try:
        import time
        start_time = time.time()
        
        # Gera jersey
        image = generator.generate_jersey(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or None,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale
        )
        
        # Converte para base64
        image_b64 = generator.image_to_base64(image)
        
        generation_time = time.time() - start_time
        
        logger.info(f"✅ Jersey personalizada gerada em {generation_time:.2f}s")
        
        return ImageResponse(
            image=image_b64,
            prompt_used=request.prompt,
            generation_time=generation_time
        )
        
    except Exception as e:
        logger.error(f"❌ Erro na geração: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def model_info():
    """Informações sobre o modelo"""
    lora_exists = Path("jersey_lora_model/final_model").exists()
    
    return {
        "base_model": "runwayml/stable-diffusion-v1-5",
        "lora_model_available": lora_exists,
        "lora_model_path": "jersey_lora_model/final_model" if lora_exists else None,
        "gpu_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_loaded": generator is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 