# 🔍 Vision Analyze Image Endpoint Strategy

## ✅ Objetivo

Implementar um endpoint FastAPI `/analyze-image` robusto que:
- Envie imagem + prompt ao modelo Vision (via OpenRouter)
- Valide a resposta JSON antes de retornar ao frontend
- Garanta que sempre retornemos dados estruturados válidos

## ✅ Exemplo de Endpoint /analyze-image com validação

```python
# app/api/analyze_image.py

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import httpx
import json

router = APIRouter()

# 🔐 Configure seu modelo e chave
OPENROUTER_API_KEY = "your-openrouter-key"
VISION_MODEL = "openai/gpt-4-vision-preview"

# ✅ Modelo da requisição
class AnalyzeImageRequest(BaseModel):
    image_base64: str
    prompt: str
    model: str = VISION_MODEL
    type: str = "vision-analysis"

# ✅ Endpoint POST
@router.post("/analyze-image")
async def analyze_image(request: AnalyzeImageRequest):
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        body = {
            "model": request.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": request.prompt.strip()
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{request.image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 1000
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post("https://openrouter.ai/api/v1/chat/completions", json=body, headers=headers)
            response.raise_for_status()
            result = response.json()

        # ✅ Extrair e validar JSON da resposta
        content = result["choices"][0]["message"]["content"].strip()

        # Remove blocos ```json``` se houver
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]

        try:
            parsed_json = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Resposta do modelo não está em formato JSON válido.")

        return {
            "success": True,
            "analysis": parsed_json
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")
```

## ✅ Como usar no seu app

Esse endpoint aceita:
- **prompt** gerado via `get_structured_analysis_prompt`
- **image_base64** vinda do frontend
- Ele envia para o modelo Vision via OpenRouter
- **Valida a resposta**, removendo ```json e tentando `json.loads`
- **Retorna analysis** ao frontend como objeto estruturado

## ✅ Requisitos

- Python ≥ 3.9
- FastAPI
- httpx (`pip install httpx`)

Você pode conectar esse endpoint no seu main.py:

```python
from app.api import analyze_image

app.include_router(analyze_image.router, prefix="/api")
```

## 🔧 Implementação no Nosso Sistema

### 📋 **Análise da Nossa Arquitetura Atual:**

| **Arquivo Atual** | **Função** | **Status** |
|-------------------|------------|------------|
| `api/main.py` | Backend principal com `/analyze-image` | ✅ **JÁ EXISTE** |
| `src/app/api/vision-test/route.ts` | Frontend API que chama backend | ✅ **JÁ EXISTE** |
| `api/vision_prompts/analysis_prompts.py` | Prompts JSON estruturados | ✅ **RECÉM ATUALIZADO** |

### 🎯 **Melhorias Necessárias:**

#### **1. VALIDAÇÃO JSON ROBUSTA no Backend Python**

**Arquivo:** `api/main.py` (função existente)

```python
# MELHORAR a função existente:
@app.post("/analyze-image")
async def analyze_image_endpoint(request: VisionAnalysisRequest):
    try:
        # ... código existente ...
        
        # ✅ ADICIONAR: Validação JSON robusta
        content = result.choices[0].message.content.strip()
        
        # Remove markdown code blocks
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        # Tenta fazer parse do JSON
        try:
            parsed_analysis = json.loads(content)
            
            # ✅ VALIDAÇÃO ESPECÍFICA: Verifica campos obrigatórios
            required_fields = ["dominantColors", "pattern", "style", "view"]
            for field in required_fields:
                if field not in parsed_analysis:
                    print(f"⚠️ Campo obrigatório {field} não encontrado, usando fallback")
                    return _generate_intelligent_fallback(request.sport, request.view)
            
            return GenerationResponse(
                success=True,
                analysis=parsed_analysis,  # ✅ JSON já validado
                model_used=request.model,
                cost_estimate=0.01
            )
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON inválido retornado pelo modelo: {e}")
            return _generate_intelligent_fallback(request.sport, request.view)
            
    except Exception as e:
        print(f"❌ Erro na análise: {e}")
        return _generate_intelligent_fallback(request.sport, request.view)

def _generate_intelligent_fallback(sport: str, view: str) -> dict:
    """Gera fallback inteligente baseado no esporte"""
    fallback_data = {
        "soccer": {
            "dominantColors": ["white", "blue"],
            "pattern": "solid color with minimal details",
            "numberStyle": {
                "font": "bold sans-serif",
                "fillPattern": "solid color",
                "outline": "white border"
            },
            "namePlacement": "centered above number",
            "collar": "round collar",
            "sleeves": "short sleeves",
            "style": "modern",
            "texture": "smooth fabric",
            "logos": "none",
            "view": view
        }
    }
    
    return GenerationResponse(
        success=True,
        analysis=fallback_data.get(sport, fallback_data["soccer"]),
        model_used="intelligent_fallback",
        cost_estimate=0
    )
```

#### **2. FUNÇÃO DE GERAÇÃO DALLE-3 OTIMIZADA**

**Adicionar ao `api/main.py`:**

```python
def generate_dalle_prompt(analysis_result: dict, player_name: str, player_number: str) -> str:
    """
    Gera prompt otimizado para DALL-E 3 baseado na análise Vision
    """
    
    # Extrai dados da análise com fallbacks seguros
    colors = ", ".join(analysis_result.get("dominantColors", ["white", "black"]))
    pattern = analysis_result.get("pattern", "solid design")
    style = analysis_result.get("style", "modern")
    texture = analysis_result.get("texture", "smooth fabric")
    collar = analysis_result.get("collar", "round collar")
    sleeves = analysis_result.get("sleeves", "short sleeves")
    
    # Extrai informações do número se disponível
    number_style = analysis_result.get("numberStyle", {})
    font = number_style.get("font", "bold")
    fill_pattern = number_style.get("fillPattern", "solid")
    outline = number_style.get("outline", "none")
    
    name_placement = analysis_result.get("namePlacement", "centered above the number")
    
    return f"""
Create a photorealistic image of a modern soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: {colors}
- Jersey pattern: {pattern}
- Number style: font = {font}, fill pattern = {fill_pattern}, outline = {outline}
- Name placement: {name_placement}
- Collar: {collar}
- Sleeves: {sleeves}
- Overall style: {style}
- Texture: {texture}
- Logos: {analysis_result.get("logos", "none")}

Use the following player details:
- Name: **{player_name.upper()}**
- Number: **{player_number}**

Render the jersey in high quality, centered, on a plain white background, no mannequins, no brand logos, only the shirt.
"""

# Usar na geração:
@app.post("/generate", response_model=GenerationResponse)
async def generate_jersey_endpoint(request: ImageGenerationRequest):
    if request.generation_mode == 'vision_enhanced' and request.vision_analysis:
        # ✅ Usar nova função otimizada
        optimized_prompt = generate_dalle_prompt(
            request.vision_analysis,
            request.player_name,
            request.player_number
        )
        
        # Chamar DALL-E 3 com prompt otimizado
        image_base64 = await generate_with_dalle3(optimized_prompt, request.quality)
        
        return GenerationResponse(
            success=True,
            image_base64=image_base64,
            cost_usd=0.045
        )
```

#### **3. INTEGRAÇÃO COM FRONTEND EXISTENTE**

**No `src/app/api/vision-test/route.ts` (já existe, só melhorar):**

```typescript
// ✅ Já está implementado, mas podemos melhorar a validação:
const result = await response.json();

if (!result.success) {
  throw new Error(result.error || 'Vision analysis failed');
}

// ✅ ADICIONAR: Validação no frontend também
const analysis = result.analysis;
if (typeof analysis !== 'object' || !analysis.dominantColors) {
  console.warn('⚠️ Análise incompleta recebida, usando dados básicos');
  // Fallback no frontend se necessário
}

return NextResponse.json({
  success: true,
  analysis: analysis,
  model_used: result.model_used || model,
  validation: 'frontend_validated'
});
```

## 🚀 **Implementação Imediata**

### **Prioridades:**

1. **✅ FEITO** - Prompts JSON estruturados
2. **🔧 PRÓXIMO** - Validação JSON robusta no `api/main.py`
3. **🎨 PRÓXIMO** - Função `generate_dalle_prompt()` otimizada
4. **🧪 TESTAR** - Na página vision-test

### **Benefícios Esperados:**

- **🎯 100% JSON válido** sempre retornado
- **🔒 Fallbacks inteligentes** para casos de erro
- **🎨 Prompts DALL-E otimizados** com base na análise real
- **⚡ Sistema robusto** que não quebra com respostas inesperadas

**Quer que eu implemente essas melhorias no `api/main.py` agora?** 🚀 