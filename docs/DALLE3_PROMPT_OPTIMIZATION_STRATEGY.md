# 🎨 DALL-E 3 Prompt Optimization Strategy

## ✅ Etapa 4: Substituição Dinâmica (Nome e Número)

Com base nos seus arquivos, essa parte já está bem planejada no base_prompts.py. Mas para garantir qualidade máxima da geração no DALL·E 3, vamos estruturar o prompt final de forma mais clara, direta e visualmente limpa.

### ✅ Novo modelo de prompt para DALL·E 3 com dados dinâmicos

No seu backend (ex: rota /api/generate ou lógica associada), monte o prompt da seguinte forma:

```python
def generate_dalle_prompt(analysis_result, player_name, player_number):
    return f"""
Create a photorealistic image of a modern soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: {', '.join(analysis_result.get("dominantColors", []))}
- Jersey pattern: {analysis_result.get("pattern", "plain design")}
- Number style: font = {analysis_result.get("numberStyle", {}).get("font", "bold")}, fill pattern = {analysis_result.get("numberStyle", {}).get("fillPattern", "solid")}, outline = {analysis_result.get("numberStyle", {}).get("outline", "none")}
- Name placement: {analysis_result.get("namePlacement", "centered above the number")}
- Collar: {analysis_result.get("collar", "round white")}
- Sleeves: {analysis_result.get("sleeves", "black")}
- Overall style: {analysis_result.get("style", "modern")}
- Texture: {analysis_result.get("texture", "smooth fabric")}
- Logos: {analysis_result.get("logos", "none")}

Use the following player details:
- Name: **{player_name}**
- Number: **{player_number}**

Render the jersey in high quality, centered, on a plain white background, no mannequins, no brand logos, only the shirt.
"""
```

Esse prompt final será muito mais claro para o DALL·E entender e manter consistência.

## ✅ Etapa 5: Como garantir que o modelo Vision entenda o novo prompt

O seu código já está bem estruturado para lidar com parsing, mas aqui vai um checklist essencial para garantir que funcione:

| Item | Verificação |
|------|-------------|
| ✅ Prompt detalhado no backend | Atualizar analysis_prompts.py com estrutura JSON clara (feito acima) |
| ✅ Parsing de JSON no frontend | Está correto em JerseyEditor.tsx com fallback e limpeza |
| ✅ Substituição dinâmica de nome/número | Já implementado via estados (ok) |
| 🔁 Integração final | Certifique-se de que o texto final enviado ao DALL·E seja o gerado com base no JSON, e não um template fixo |

## ✅ Etapa 6: (Opcional) – Melhorias UX

Se quiser deixar seu sistema ainda mais pro:

- ✅ Mostre um preview em tempo real do JSON de análise no frontend (modo debug)
- ✅ Permita o usuário escolher entre 2-3 estilos visuais extras (ex: retrô, urbano, etc.)
- ✅ Salve localmente os prompts finais gerados para reuso e edição posterior

## ✅ Etapa 1 – Melhorar o Prompt de Análise no Backend

No seu arquivo analysis_prompts.py, localize o trecho onde define os prompts por esporte e vista:

```python
PROMPTS = {
    "soccer": {
        "back": "...",
        ...
    }
}
```

### 🛠 Substitua o valor da chave "back" para "soccer" por este prompt mais específico:

```python
"soccer": {
    "back": """
Analyze this soccer jersey back view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["white", "black"],
  "pattern": "gradient fade from white (top) to black (bottom)",
  "numberStyle": {
    "font": "bold geometric sans-serif",
    "fillPattern": "black with tribal circular patterns",
    "outline": "white border"
  },
  "namePlacement": "centered at top, all uppercase, sans-serif font, black color",
  "collar": "round collar, white",
  "sleeves": "black sleeves with smooth gradient transition",
  "style": "modern minimalistic",
  "texture": "smooth fabric, no mesh or shine",
  "logos": "none",
  "view": "back"
}
"""
}
```

Esse prompt diz exatamente o que você quer extrair da imagem e força o modelo Vision a responder em JSON estruturado, ideal para reaproveitar no seu app.

## ✅ Etapa 2 – Garantir que o JSON está sendo lido corretamente no Frontend

No seu componente JerseyEditor.tsx, você já tem esta lógica que está correta:

```tsx
const cleanJson = (text) => {
  const json = text.replace(/^```json|```$/g, '').trim();
  return JSON.parse(json);
};
```

Ou seja, você já está pronto para consumir corretamente o novo formato de saída estruturada do Vision. Só falta o prompt da Etapa 1 ser melhorado.

## ✅ Etapa 3 – Criar o Prompt Final para o DALL·E 3 Usando os Dados Extraídos

Agora que você terá uma saída bem detalhada e estruturada (graças ao novo prompt da Etapa 1), você pode construir o prompt final assim:

### 🧠 Exemplo (em backend Python ou JS/TS):

```typescript
const promptFinal = `
Create a photorealistic image of a modern soccer jersey viewed from the back, with the following characteristics:

- Dominant colors: ${analysisResult.dominantColors.join(", ")}
- Jersey pattern: ${analysisResult.pattern}
- Number style: font = ${analysisResult.numberStyle.font}, fill pattern = ${analysisResult.numberStyle.fillPattern}, outline = ${analysisResult.numberStyle.outline}
- Name placement: ${analysisResult.namePlacement}
- Collar: ${analysisResult.collar}
- Sleeves: ${analysisResult.sleeves}
- Style: ${analysisResult.style}
- Texture: ${analysisResult.texture}
- Logos: ${analysisResult.logos}

Use the following player info:
- Name: **${playerName}**
- Number: **${playerNumber}**

Render the jersey in high quality, centered, on a plain white background, without mannequins or brand logos.
`;
```

Esse prompt final é muito mais claro para o DALL·E e irá reproduzir com precisão a camisa original, adaptada ao nome e número personalizados.

## ✅ analysis_prompts.py (versão melhorada)

```python
PROMPTS = {
    "soccer": {
        "front": """
Analyze this front-view image of a soccer jersey and extract detailed design elements in JSON format:

{
  "dominantColors": ["primary color", "secondary color"],
  "pattern": "describe the pattern or graphic style on the jersey",
  "logoPosition": "where the team or sponsor logo appears",
  "collar": "type and color of collar (e.g., round, v-neck, polo)",
  "sleeves": "sleeve style and color",
  "style": "overall visual style (modern, classic, retro, minimalistic)",
  "texture": "smooth, mesh, shiny, matte, etc.",
  "logos": "describe any visible brand or team logos",
  "view": "front"
}
""",

        "back": """
Analyze this soccer jersey back view image and return ONLY a valid JSON object with the following structure:

{
  "dominantColors": ["white", "black"],
  "pattern": "gradient fade from white (top) to black (bottom)",
  "numberStyle": {
    "font": "bold geometric sans-serif",
    "fillPattern": "black with tribal circular patterns",
    "outline": "white border"
  },
  "namePlacement": "centered at top, all uppercase, sans-serif font, black color",
  "collar": "round collar, white",
  "sleeves": "black sleeves with smooth gradient transition",
  "style": "modern minimalistic",
  "texture": "smooth fabric, no mesh or shine",
  "logos": "none",
  "view": "back"
}
"""
    },

    "basketball": {
        "back": """
Analyze the uploaded basketball jersey back image and extract in JSON:

{
  "dominantColors": ["main", "secondary"],
  "pattern": "describe design style (solid, striped, etc.)",
  "numberStyle": {
    "font": "type of font used",
    "fillPattern": "solid, gradient, mesh, etc.",
    "outline": "outline color or style"
  },
  "namePlacement": "top center, above number, etc.",
  "collar": "v-neck, round, ribbed, etc.",
  "sleeves": "sleeveless",
  "style": "urban, modern, retro, etc.",
  "texture": "smooth, mesh, fabric",
  "logos": "describe any logos or patches",
  "view": "back"
}
"""
    },

    "football": {
        "back": """
Analyze the uploaded American football jersey image (back view). Extract in JSON:

{
  "dominantColors": ["main", "secondary"],
  "numberStyle": {
    "font": "...",
    "fillPattern": "...",
    "outline": "..."
  },
  "namePlacement": "...",
  "collar": "...",
  "sleeves": "...",
  "style": "...",
  "texture": "...",
  "logos": "...",
  "view": "back"
}
"""
    }
}
```

## ✅ Como usar:

1. **Substitua seu arquivo atual analysis_prompts.py** por esse conteúdo
2. **A rota Vision (no backend)** que chama o modelo irá automaticamente usar este prompt novo
3. **O output será JSON estruturado** — exatamente como seu frontend precisa
4. **Com esse JSON, você monta o prompt final** para o DALL·E 3, conforme já configurado

## 🎯 Resultado Esperado

Com essas implementações, você terá:

- ✅ **Análise estruturada** com dados precisos extraídos da imagem
- ✅ **Prompts otimizados** para máxima fidelidade no DALL-E 3
- ✅ **Sistema robusto** com fallbacks inteligentes
- ✅ **Geração consistente** que mantém o design original e só troca nome/número 