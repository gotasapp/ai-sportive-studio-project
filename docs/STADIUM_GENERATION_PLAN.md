# 🏟️ STADIUM GENERATION - Plano Técnico

## 📋 **OVERVIEW**

Sistema de geração de cenários de estádios usando DALL-E 3, seguindo a mesma arquitetura dos jerseys mas adaptado para **composições complexas** e **cenários atmosféricos**.

---

## 🎯 **DIFERENÇAS TÉCNICAS**

### **Jersey vs Stadium**
```typescript
Jersey: {
  type: "isolated_product",
  background: "white_studio", 
  perspective: "single_view",
  elements: ["fabric", "text", "colors"]
}

Stadium: {
  type: "complex_scene",
  background: "atmospheric_environment",
  perspective: "cinematic_wide_angle", 
  elements: ["architecture", "crowd", "lighting", "weather"]
}
```

---

## 🏗️ **ARQUITETURA PROPOSTA**

### **1. Backend API - Stadium Generator**

```python
# api/stadium_api_dalle3.py
class StadiumGenerator:
    def __init__(self):
        self.setup_stadium_prompts()
        
    def setup_stadium_prompts(self):
        """Prompts específicos para cada estádio"""
        self.stadium_prompts = {
            "maracana": """
            Cinematic wide-angle photograph of Maracanã stadium during golden hour,
            packed with passionate fans wearing red and black Flamengo jerseys,
            dramatic warm lighting casting long shadows across the field,
            iconic white concrete structure with curved architecture,
            vibrant green pitch in perfect condition,
            Rio de Janeiro mountains visible in background,
            professional sports photography, Canon EOS R5, 24-70mm lens,
            atmospheric perspective, 8K resolution, HDR lighting
            """,
            
            "allianz_parque": """
            Modern Allianz Parque stadium at night with LED lighting system,
            sea of green Palmeiras fans creating tifo displays,
            sleek contemporary architecture with glass and steel elements,
            perfectly manicured pitch under floodlights,
            São Paulo city skyline in background,
            professional architectural photography, dramatic lighting,
            8K resolution, cinematic composition
            """,
            
            "neo_quimica_arena": """
            Neo Química Arena with distinctive white facade architecture,
            Corinthians fans in black and white creating mosaic displays,
            modern arena design with curved roof structure,
            vibrant atmosphere during evening match,
            professional stadium photography, wide-angle lens,
            dramatic sky, perfect lighting, 8K quality
            """
        }
    
    def generate_stadium_scene(self, request: StadiumGenerationRequest):
        """Gera cenário de estádio completo"""
        stadium_name = request.stadium_id.lower()
        
        if stadium_name not in self.stadium_prompts:
            raise ValueError(f"Stadium '{stadium_name}' not configured")
            
        # Personalização baseada no contexto
        context_prompt = self.add_context_elements(
            base_prompt=self.stadium_prompts[stadium_name],
            match_type=request.match_type,  # "day", "night", "derby"
            weather=request.weather,        # "sunny", "cloudy", "dramatic"
            crowd_density=request.crowd_density  # "packed", "half", "empty"
        )
        
        return self.generate_with_dalle3(context_prompt, request.quality)
```

### **2. Frontend Service**

```typescript
// lib/services/stadium-service.ts
export interface StadiumGenerationRequest {
  stadium_id: string
  match_type: 'day' | 'night' | 'derby' | 'final'
  weather: 'sunny' | 'cloudy' | 'dramatic' | 'sunset'
  crowd_density: 'packed' | 'half' | 'empty'
  team_colors?: string[]  // Para customizar cores da torcida
  quality: 'standard' | 'hd'
}

export class StadiumService {
  static async generateStadium(request: StadiumGenerationRequest) {
    const response = await fetch('/api/stadium/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    return response.json()
  }
}
```

### **3. Admin Panel Integration**

```typescript
// Expandir src/app/admin/stadiums/page.tsx
const StadiumGenerator = () => {
  return (
    <Card className="cyber-card border-cyan-500/30">
      <CardHeader>
        <CardTitle>Stadium Scene Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Stadium</label>
            <select>
              <option value="maracana">Maracanã</option>
              <option value="allianz_parque">Allianz Parque</option>
              <option value="neo_quimica_arena">Neo Química Arena</option>
            </select>
          </div>
          
          <div>
            <label>Match Type</label>
            <select>
              <option value="day">Day Match</option>
              <option value="night">Night Match</option>
              <option value="derby">Derby</option>
              <option value="final">Final</option>
            </select>
          </div>
          
          <div>
            <label>Weather/Atmosphere</label>
            <select>
              <option value="sunny">Sunny</option>
              <option value="dramatic">Dramatic Sky</option>
              <option value="sunset">Golden Hour</option>
            </select>
          </div>
          
          <div>
            <label>Crowd Density</label>
            <select>
              <option value="packed">Packed Stadium</option>
              <option value="half">Half Full</option>
              <option value="empty">Empty (Training)</option>
            </select>
          </div>
        </div>
        
        <Button className="cyber-button mt-4">
          Generate Stadium Scene
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## 🎨 **PROMPT ENGINEERING PARA STADIUMS**

### **Elementos Essenciais**
```python
STADIUM_ELEMENTS = {
    "architecture": [
        "iconic_facade", "roof_structure", "seating_tiers", 
        "modern_design", "classic_concrete", "glass_elements"
    ],
    "atmosphere": [
        "crowd_density", "fan_colors", "tifo_displays", 
        "lighting_mood", "weather_conditions", "time_of_day"
    ],
    "technical": [
        "camera_angle", "lens_type", "lighting_setup",
        "resolution", "composition", "depth_of_field"
    ]
}
```

### **Negative Prompts Específicos**
```python
STADIUM_NEGATIVE_PROMPTS = [
    "empty_seats", "poor_lighting", "blurry_crowd",
    "distorted_architecture", "unrealistic_proportions",
    "cartoon_style", "low_quality", "amateur_photography"
]
```

---

## 🔄 **INTEGRAÇÃO COM SISTEMA ATUAL**

### **1. Usar a mesma estrutura de dados**
```python
# Seguir padrão de metadata_clean.json
{
  "filename": "maracana_night_packed.png",
  "stadium_name": "Maracanã",
  "type": "night_match",
  "atmosphere": {
    "time": "night",
    "crowd": "packed", 
    "weather": "clear"
  },
  "technical_prompt": "...",
  "negative_prompt": "...",
  "quality_level": "high"
}
```

### **2. Reutilizar infraestrutura**
- ✅ Mesmo sistema DALL-E 3
- ✅ Mesmo sistema IPFS 
- ✅ Mesmo sistema de custos
- ✅ Mesmo admin panel base

---

## 📊 **DESAFIOS ESPECÍFICOS**

### **1. Complexidade Visual**
- **Jersey:** Objeto simples, controlado
- **Stadium:** Cena complexa, muitas variáveis

### **2. Consistência**
- Manter qualidade entre diferentes condições
- Balancear realismo vs. dramaticidade

### **3. Performance**
- Prompts mais longos = mais processamento
- Maior chance de falha na geração

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Criar API backend** (`stadium_api_dalle3.py`)
2. **Implementar service frontend** (`stadium-service.ts`)
3. **Expandir admin panel** (adicionar gerador)
4. **Testar prompts** com diferentes estádios
5. **Integrar com sistema de NFT** (backgrounds)

---

## 💡 **OPORTUNIDADES**

### **NFT Compostos**
```typescript
// Jersey + Stadium background
const compositeNFT = {
  foreground: jerseyImage,  // Gerado atual
  background: stadiumScene, // Novo sistema
  composition: "overlay"    // Técnica de composição
}
```

### **Marketplace Diferenciado**
- NFTs com cenários únicos
- Coleções por estádio
- Raridade baseada em atmosfera 