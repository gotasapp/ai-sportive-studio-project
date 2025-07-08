# 🎨 DALL-E Prompt Builder Functions

## ✅ Objetivo

Transformar o JSON de análise + nome + número do jogador em um prompt claro, descritivo e visualmente direcionado para DALL-E 3.

## 🐍 Função Python (Backend)

```python
def generate_dalle_prompt_from_analysis(analysis_result: dict, player_name: str, player_number: str) -> str:
    """
    Gera prompt otimizado para DALL-E 3 baseado na análise Vision JSON estruturada
    Formato otimizado seguindo as melhores práticas para geração fiel
    """
    try:
        # Extrai dados da análise com fallbacks seguros
        colors = analysis_result.get("dominantColors", ["white", "black"])
        if isinstance(colors, dict):
            # Se é objeto com primary/secondary, extrair como lista
            colors_list = [colors.get("primary", "white"), colors.get("secondary", "black")]
            colors_text = ", ".join(colors_list)
        elif isinstance(colors, list):
            colors_text = ", ".join(colors)
        else:
            colors_text = "white, black"
        
        # Extrai pattern
        pattern = analysis_result.get("pattern", "plain")
        if isinstance(pattern, dict):
            pattern = pattern.get("description", "plain")
        
        # Extrai número style com formatação específica
        number_style = analysis_result.get("numberStyle", {})
        if isinstance(number_style, dict):
            font = number_style.get("font", "bold")
            fill_pattern = number_style.get("fillPattern", "solid fill")
            outline = number_style.get("outline", "no outline")
            number_style_text = f"{font}, with {fill_pattern} and {outline}"
        else:
            number_style_text = "bold, with solid fill and no outline"
        
        # Extrai outros elementos
        name_placement = analysis_result.get("namePlacement", "above the number, centered")
        collar = analysis_result.get("collar", "round, white")
        sleeves = analysis_result.get("sleeves", "standard")
        style = analysis_result.get("style", "modern")
        texture = analysis_result.get("texture", "smooth fabric")
        logos = analysis_result.get("logos", "none")
        
        # Detecta view
        view = "back"
        if "front" in str(analysis_result).lower():
            view = "front"
        
        # Detecta sport
        sport = "soccer"
        if "basketball" in str(analysis_result).lower():
            sport = "basketball"
        elif "nfl" in str(analysis_result).lower():
            sport = "nfl"
        
        # Constrói prompt seguindo formato otimizado
        optimized_prompt = f"""
Create a photorealistic image of a {sport} jersey viewed from the {view}, with the following characteristics:

- Dominant colors: {colors_text}
- Jersey pattern: {pattern}
- Number style: {number_style_text}
- Name placement: {name_placement}
- Collar: {collar}
- Sleeves: {sleeves}
- Style: {style}
- Texture: {texture}
- Logos: {logos}

Use the following player info:
- Name: **{player_name.upper()}**
- Number: **{player_number}**

Render the jersey in high quality, centered, from {view} view, on a plain white background. No mannequins, no brand names, no additional items.
""".strip()
        
        return optimized_prompt
        
    except Exception as e:
        # Fallback para prompt simples
        return f"""
Create a photorealistic image of a soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: white, black
- Jersey pattern: plain
- Number style: bold, with solid fill and no outline
- Name placement: above the number, centered
- Collar: round, white
- Sleeves: standard
- Style: modern
- Texture: smooth fabric
- Logos: none

Use the following player info:
- Name: **{player_name.upper()}**
- Number: **{player_number}**

Render the jersey in high quality, centered, from back view, on a plain white background. No mannequins, no brand names, no additional items.
""".strip()
```

## 🟦 Função TypeScript (Frontend)

```typescript
export function generatePromptFromAnalysis(
  analysis: any,
  playerName: string,
  playerNumber: string
): string {
  try {
    // Extrai dados da análise com fallbacks seguros
    let colorsText = "white, black";
    const colors = analysis.dominantColors;
    
    if (typeof colors === 'object' && !Array.isArray(colors)) {
      // Se é objeto com primary/secondary
      const colorsList = [colors.primary || "white", colors.secondary || "black"];
      colorsText = colorsList.join(", ");
    } else if (Array.isArray(colors)) {
      colorsText = colors.join(", ");
    }
    
    // Extrai pattern
    let pattern = analysis.pattern || "plain";
    if (typeof pattern === 'object') {
      pattern = pattern.description || "plain";
    }
    
    // Extrai número style com formatação específica
    const numberStyle = analysis.numberStyle || {};
    const font = numberStyle.font || "bold";
    const fillPattern = numberStyle.fillPattern || "solid fill";
    const outline = numberStyle.outline || "no outline";
    const numberStyleText = `${font}, with ${fillPattern} and ${outline}`;
    
    // Extrai outros elementos
    const namePlacement = analysis.namePlacement || "above the number, centered";
    const collar = analysis.collar || "round, white";
    const sleeves = analysis.sleeves || "standard";
    const style = analysis.style || "modern";
    const texture = analysis.texture || "smooth fabric";
    const logos = analysis.logos || "none";
    
    // Detecta view
    let view = "back";
    if (JSON.stringify(analysis).toLowerCase().includes("front")) {
      view = "front";
    }
    
    // Detecta sport
    let sport = "soccer";
    const analysisStr = JSON.stringify(analysis).toLowerCase();
    if (analysisStr.includes("basketball")) {
      sport = "basketball";
    } else if (analysisStr.includes("nfl")) {
      sport = "nfl";
    }
    
    return `
Create a photorealistic image of a ${sport} jersey viewed from the ${view}, with the following characteristics:

- Dominant colors: ${colorsText}
- Jersey pattern: ${pattern}
- Number style: ${numberStyleText}
- Name placement: ${namePlacement}
- Collar: ${collar}
- Sleeves: ${sleeves}
- Style: ${style}
- Texture: ${texture}
- Logos: ${logos}

Use the following player info:
- Name: **${playerName.toUpperCase()}**
- Number: **${playerNumber}**

Render the jersey in high quality, centered, from ${view} view, on a plain white background. No mannequins, no brand names, no additional items.
    `.trim();
    
  } catch (error) {
    console.warn('⚠️ Error generating prompt from analysis, using fallback:', error);
    
    // Fallback para prompt simples
    return `
Create a photorealistic image of a soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: white, black
- Jersey pattern: plain
- Number style: bold, with solid fill and no outline
- Name placement: above the number, centered
- Collar: round, white
- Sleeves: standard
- Style: modern
- Texture: smooth fabric
- Logos: none

Use the following player info:
- Name: **${playerName.toUpperCase()}**
- Number: **${playerNumber}**

Render the jersey in high quality, centered, from back view, on a plain white background. No mannequins, no brand names, no additional items.
    `.trim();
  }
}
```

## 📋 Exemplo de Uso

### Python (Backend)
```python
# Após receber análise JSON do Vision model
analysis = {
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

# Gerar prompt otimizado
prompt = generate_dalle_prompt_from_analysis(analysis, "BRENO BIDON", "27")

# Enviar para DALL-E 3
image_response = openai_client.images.generate(
    model="dall-e-3",
    prompt=prompt,
    size="1024x1024",
    quality="hd"
)
```

### TypeScript (Frontend)
```typescript
// Após receber análise do backend
const analysis = await fetch('/api/vision-analyze', { ... }).then(r => r.json());

// Gerar prompt otimizado
const prompt = generatePromptFromAnalysis(analysis.result, "BRENO BIDON", "27");

// Enviar para endpoint de geração
const response = await fetch('/api/generate-vision-enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    player_name: "BRENO BIDON",
    player_number: "27",
    quality: "hd",
    vision_analysis: analysis.result
  })
});
```

## ✅ Resultado Esperado

O prompt gerado seguirá sempre este formato estruturado:

```
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
```

## 🎯 Benefícios

- **📝 Formato consistente** sempre seguido
- **🎨 Detalhes específicos** extraídos da análise JSON
- **🔒 Fallbacks seguros** para casos de erro
- **⚡ Otimizado para DALL-E 3** com linguagem clara e precisa
- **🌍 Cross-platform** (Python + TypeScript) 