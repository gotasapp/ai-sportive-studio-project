# 🚀 Complete Generation Endpoints Documentation

## 📋 Resumo

Sistema completo de geração de jerseys com análise Vision integrada. Três níveis de endpoints disponíveis:

1. **`/api/generate-image`** - Geração direta com prompt
2. **`/generate-vision-enhanced`** - Geração com análise pré-processada  
3. **`/complete-vision-flow`** - Fluxo completo em uma única chamada

---

## 🎨 Endpoint 1: `/api/generate-image`

### **Descrição**
Endpoint dedicado para geração de imagens via DALL-E 3. Suporta tanto OpenRouter quanto OpenAI direto.

### **Request Model**
```json
{
  "prompt": "Create a photorealistic image of a soccer jersey...",
  "model": "openai/dall-e-3",
  "size": "1024x1024",
  "quality": "standard",
  "use_openai_direct": false
}
```

### **Response Model**
```json
{
  "success": true,
  "image_url": "https://...",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "model_used": "openai/dall-e-3",
  "cost_estimate": 0.04
}
```

### **Exemplo de Uso**
```python
import httpx

async def generate_image_direct():
    request = {
        "prompt": """
Create a photorealistic image of a soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: white, black
- Jersey pattern: gradient fade from white (top) to black (bottom)
- Number style: bold geometric sans-serif, with tribal circular patterns in black and white outline
- Name placement: centered at top, all uppercase, sans-serif font, black color
- Collar: round collar, white
- Sleeves: black sleeves with smooth gradient transition
- Style: modern minimalistic
- Texture: smooth fabric, no mesh or shine
- Logos: none

Use the following player info:
- Name: **BRENO BIDON**
- Number: **27**

Render the jersey in high quality, centered, from back view, on a plain white background. No mannequins, no brand names, no additional items.
        """.strip(),
        "quality": "hd",
        "use_openai_direct": True
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8000/api/generate-image", json=request)
        return response.json()
```

---

## 🔍 Endpoint 2: `/generate-vision-enhanced`

### **Descrição**
Geração de jersey usando análise Vision pré-processada. Requer que a análise já tenha sido feita separadamente.

### **Request Model**
```json
{
  "player_name": "BRENO BIDON",
  "player_number": "27",
  "quality": "standard",
  "generation_mode": "vision_enhanced",
  "vision_analysis": {
    "dominantColors": ["white", "black"],
    "pattern": "gradient fade from white (top) to black (bottom)",
    "numberStyle": {
      "font": "bold geometric sans-serif",
      "fillPattern": "tribal circular patterns in black",
      "outline": "white outline"
    },
    "namePlacement": "centered at top, all uppercase, sans-serif font, black color",
    "collar": "round collar, white",
    "sleeves": "black sleeves with smooth gradient transition",
    "style": "modern minimalistic",
    "texture": "smooth fabric, no mesh or shine",
    "logos": "none",
    "view": "back"
  }
}
```

### **Fluxo de Uso**
```python
# 1. Primeiro fazer análise
analysis_response = await client.post("/analyze-image", json={
    "image_base64": base64_image,
    "prompt": analysis_prompt,
    "model": "openai/gpt-4o-mini"
})

analysis_result = analysis_response.json()["analysis"]

# 2. Depois gerar com análise
generation_response = await client.post("/generate-vision-enhanced", json={
    "player_name": "BRENO BIDON",
    "player_number": "27",
    "quality": "hd",
    "vision_analysis": analysis_result
})
```

---

## ⚡ Endpoint 3: `/complete-vision-flow` (RECOMENDADO)

### **Descrição**
**Fluxo completo em uma única chamada**: Análise Vision + Geração de Prompt + DALL-E 3. 

**Mais conveniente para uso em produção.**

### **Request Model**
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "player_name": "BRENO BIDON", 
  "player_number": "27",
  "sport": "soccer",
  "view": "back",
  "model": "openai/gpt-4o-mini",
  "quality": "standard"
}
```

### **Response Model**
```json
{
  "success": true,
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "cost_usd": 0.04
}
```

### **Exemplo TypeScript (Frontend)**
```typescript
async function generateJerseyComplete(
  imageFile: File,
  playerName: string,
  playerNumber: string
) {
  // Converter imagem para base64
  const base64 = await fileToBase64(imageFile);
  
  const request = {
    image_base64: base64,
    player_name: playerName,
    player_number: playerNumber,
    sport: "soccer",
    view: "back",
    quality: "hd"
  };
  
  const response = await fetch('/complete-vision-flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Mostrar imagem gerada
    const imageElement = document.getElementById('generated-image');
    imageElement.src = `data:image/png;base64,${result.image_base64}`;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result?.toString().split(',')[1];
      resolve(base64 || '');
    };
    reader.onerror = error => reject(error);
  });
}
```

---

## 📊 Comparação dos Endpoints

| **Endpoint** | **Casos de Uso** | **Complexidade** | **Performance** |
|--------------|-------------------|------------------|-----------------|
| `/api/generate-image` | Prompt manual, testes A/B | Simples | ⚡ Rápido |
| `/generate-vision-enhanced` | Controle granular, cache de análise | Médio | 🔄 Médio |
| `/complete-vision-flow` | **Produção, simplicidade** | Baixo | 🚀 **Otimizado** |

---

## 🧪 Exemplos de Teste

### **cURL - Complete Vision Flow**
```bash
curl -X POST http://localhost:8000/complete-vision-flow \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "'$(base64 -i lakers_jersey.jpg)'",
    "player_name": "LEBRON JAMES",
    "player_number": "23",
    "sport": "basketball",
    "view": "back",
    "quality": "hd"
  }'
```

### **Python - Direct Generation**
```python
import asyncio
import httpx

async def test_direct_generation():
    prompt = """
Create a photorealistic image of a soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: red, white
- Jersey pattern: vertical red and white stripes
- Number style: bold, with solid fill and black outline
- Name placement: above the number, centered
- Collar: round, white
- Sleeves: standard
- Style: modern
- Texture: smooth fabric
- Logos: none

Use the following player info:
- Name: **MESSI**
- Number: **10**

Render the jersey in high quality, centered, from back view, on a plain white background. No mannequins, no brand names, no additional items.
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/generate-image",
            json={
                "prompt": prompt,
                "quality": "hd",
                "use_openai_direct": True
            }
        )
        return response.json()

# Executar
result = asyncio.run(test_direct_generation())
print(f"Success: {result['success']}")
print(f"Image URL: {result.get('image_url', 'N/A')}")
```

---

## 🔧 Configuração

### **Variáveis de Ambiente Necessárias**
```bash
OPENROUTER_API_KEY=your_openrouter_key_here
OPENAI_API_KEY=your_openai_key_here
```

### **Modelos Suportados**
- `openai/dall-e-3` (Recomendado)
- `openai/dall-e-2` (Básico)

### **Qualidades Disponíveis**
- `standard` - $0.04 por imagem
- `hd` - $0.08 por imagem

### **Tamanhos Suportados**
- `1024x1024` (Padrão)
- `1024x1792` (Retrato)
- `1792x1024` (Paisagem)

---

## 🚀 Integração com Frontend

### **Página Vision-Test**
O endpoint `/complete-vision-flow` pode ser integrado diretamente na página vision-test:

```typescript
// src/app/vision-test/page.tsx

const handleGenerateComplete = async () => {
  try {
    setIsLoading(true);
    
    const response = await fetch('/complete-vision-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: uploadedImage.split(',')[1],
        player_name: playerName,
        player_number: playerNumber,
        sport: selectedSport,
        view: selectedView,
        quality: 'hd'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setGeneratedImage(`data:image/png;base64,${result.image_base64}`);
      toast.success('Jersey gerado com sucesso!');
    } else {
      toast.error('Erro na geração');
    }
  } catch (error) {
    toast.error(`Erro: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
```

## ✅ Status da Implementação

- ✅ **Endpoint `/api/generate-image`** - Criado e funcional
- ✅ **Endpoint `/generate-vision-enhanced`** - Criado e funcional  
- ✅ **Endpoint `/complete-vision-flow`** - Criado e funcional
- ✅ **Suporte OpenRouter + OpenAI** - Implementado
- ✅ **Validação JSON robusta** - Implementada
- ✅ **Prompts otimizados** - Implementados
- ✅ **Fallbacks inteligentes** - Implementados
- 🔄 **Teste completo** - Pendente

**Sistema pronto para resolver o problema de geração "distante como Japão ao Cabo Verde"!** 🌍✨ 