# 🚀 Vision-Test Implementation Guide

## 🎯 Objetivo da Página Vision-Test

Implementar uma página de teste dedicada para validar a estratégia de análise Vision antes de aplicar no JerseyEditor principal.

## 🔄 Fluxo Sequencial Correto

### STEP 1: Upload da Imagem ✅
- Usuário faz upload da imagem de referência
- Sistema exibe preview da imagem
- Campos para nome e número do jogador

### STEP 2: Análise Vision (Obrigatória) ✅
- **Botão "Analyze Image"** (só funciona com imagem carregada)
- Envia imagem + prompt estruturado para Vision API
- Recebe análise técnica detalhada
- Exibe resultado da análise em texto estruturado

### STEP 3: Geração DALL-E 3 (Só após análise) ✅
- **Botão "Generate Jersey"** (só funciona com análise completa)
- Combina análise + nome + número dinâmicos
- Envia prompt final para DALL-E 3
- Exibe imagem gerada

## 📋 Componentes da Interface

### Layout Principal
```typescript
export default function VisionTestPage() {
  // Estados principais
  const [image, setImage] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [playerName, setPlayerName] = useState('PLAYER')
  const [playerNumber, setPlayerNumber] = useState('10')
  
  // Estados do fluxo
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
}
```

### Seção 1: Upload e Preview
```jsx
<div className="cyber-card">
  <h3>Step 1: Upload Reference Image</h3>
  
  <input 
    type="file" 
    accept="image/*"
    onChange={handleImageUpload}
  />
  
  {image && (
    <div className="image-preview">
      <img src={image} alt="Reference" />
    </div>
  )}
  
  <div className="player-inputs">
    <input 
      value={playerName}
      onChange={(e) => setPlayerName(e.target.value)}
      placeholder="Player Name"
    />
    <input 
      value={playerNumber}
      onChange={(e) => setPlayerNumber(e.target.value)}
      placeholder="Number"
    />
  </div>
</div>
```

### Seção 2: Análise Vision
```jsx
<div className="cyber-card">
  <h3>Step 2: Vision Analysis</h3>
  
  <button 
    onClick={handleAnalyzeImage}
    disabled={!image || isAnalyzing}
    className="cyber-button"
  >
    {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
  </button>
  
  {analysisResult && (
    <div className="analysis-result">
      <h4>Analysis Result:</h4>
      <pre>{analysisResult}</pre>
    </div>
  )}
</div>
```

### Seção 3: Geração
```jsx
<div className="cyber-card">
  <h3>Step 3: Generate Jersey</h3>
  
  <button 
    onClick={handleGenerateJersey}
    disabled={!analysisResult || isGenerating}
    className="cyber-button"
  >
    {isGenerating ? 'Generating...' : 'Generate Jersey'}
  </button>
  
  {generatedImage && (
    <div className="generated-result">
      <img src={generatedImage} alt="Generated Jersey" />
    </div>
  )}
</div>
```

## 🔧 Implementação dos Handlers

### handleAnalyzeImage
```typescript
const handleAnalyzeImage = async () => {
  if (!imageBlob) return;
  
  setIsAnalyzing(true);
  setAnalysisResult(null);
  
  try {
    // Converte para base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      
      // Prompt estruturado baseado na estratégia
      const analysisPrompt = VISION_ANALYSIS_PROMPTS.structured;
      
      const response = await fetch('/api/vision-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64Data,
          prompt: analysisPrompt,
          model: 'openai/gpt-4o-mini'
        })
      });
      
      const result = await response.json();
      setAnalysisResult(result.analysis);
    };
    
    reader.readAsDataURL(imageBlob);
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    setIsAnalyzing(false);
  }
};
```

### handleGenerateJersey
```typescript
const handleGenerateJersey = async () => {
  if (!analysisResult) return;
  
  setIsGenerating(true);
  setGeneratedImage(null);
  
  try {
    // Combina análise com dados dinâmicos
    const finalPrompt = analysisResult
      .replace(/\{\{NAME\}\}/g, playerName.toUpperCase())
      .replace(/\{\{NUMBER\}\}/g, playerNumber)
      .replace(/\[NOME\]/g, playerName.toUpperCase())
      .replace(/\[NUMERO\]/g, playerNumber);
    
    const response = await fetch('/api/vision-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: finalPrompt,
        quality: 'standard',
        size: '1024x1024'
      })
    });
    
    const result = await response.json();
    setGeneratedImage(result.imageUrl);
  } catch (error) {
    console.error('Generation failed:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

## 📝 Prompts Estruturados

### Prompt de Análise (Português)
```typescript
const VISION_ANALYSIS_PROMPTS = {
  structured: `Você é um especialista em design esportivo. Analise esta camisa de futebol com alto nível de detalhe para gerar um prompt técnico que será usado por uma IA de geração de imagens. Responda nos seguintes tópicos:

1. **Cores principais e secundárias** da camisa (incluindo gradientes, tons e contrastes);
2. **Estilo visual** da camisa (moderna, retrô, minimalista, etc.);
3. **Textura e padrões presentes** (ex: padrões gráficos dentro dos números);
4. **Formato e cor da gola e das mangas**;
5. **Estilo e posição do nome e número** (ex: centralizado, fonte, cor, preenchimento interno);
6. **Outros detalhes visuais relevantes** para reprodução precisa da camisa.

Sua resposta será usada para criar uma nova camisa com nome e número personalizados. Seja preciso e técnico, como se fosse para um designer 3D.

Termine sua resposta incluindo:
**Substitua pelo nome: {{NAME}}**
**Substitua pelo número: {{NUMBER}}**`,

  english: `You are a jersey design expert. Analyze the image of this football jersey and extract all key design details in a technical and structured way. I will use this information to generate a new jersey with modified name and number, so I need high accuracy and visual detail.

Please describe:

1. Exact main and secondary colors (e.g., white, gradient black, etc.)
2. Style of the jersey (modern, retro, minimal, etc.)
3. Graphic patterns (describe if any are visible, like textures inside the numbers)
4. Placement and typography of name and number
5. Collar type (round, V-neck, polo, etc.)
6. Sleeve and shoulder style (plain, gradient, or patterned)
7. Any additional visual elements

Respond in structured text, like a product specification, and be precise with the visual language.

End your response with:
Replace name with: {{NAME}}
Replace number with: {{NUMBER}}`
};
```

## 🎨 Styling CSS

```css
.vision-test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.cyber-card {
  background: rgba(20, 16, 30, 0.95);
  border: 0.25px solid rgba(209, 213, 219, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.analysis-result {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(162, 1, 49, 0.3);
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.analysis-result pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.image-preview img,
.generated-result img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.player-inputs {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.player-inputs input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
}
```

## 🔄 API Endpoints Necessários

### /api/vision-test (Análise)
```typescript
// src/app/api/vision-test/route.ts
export async function POST(request: Request) {
  const { image_base64, prompt, model } = await request.json();
  
  // Chama OpenRouter com Vision
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` }}
        ]
      }]
    })
  });
  
  const result = await response.json();
  return Response.json({ analysis: result.choices[0].message.content });
}
```

### /api/vision-generate (Geração)
```typescript
// src/app/api/vision-generate/route.ts  
export async function POST(request: Request) {
  const { prompt, quality, size } = await request.json();
  
  // Chama DALL-E 3
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      quality: quality || 'standard',
      size: size || '1024x1024',
      n: 1
    })
  });
  
  const result = await response.json();
  return Response.json({ imageUrl: result.data[0].url });
}
```

## 🧪 Testes e Validação

### Critérios de Sucesso
1. **Análise**: Deve extrair cores, padrões e estilo específicos
2. **Geração**: Deve manter fidelidade visual com apenas nome/número alterados
3. **Fluxo**: Cada step só funciona após o anterior completar
4. **Robustez**: Deve lidar com erros e timeouts graciosamente

### Casos de Teste
1. **Jersey tradicional** (cores sólidas)
2. **Jersey com gradientes** (transições complexas)
3. **Jersey com padrões** (listras, texturas)
4. **Jersey com logos** (elementos gráficos)

## 🚀 Próximos Passos

1. **Implementar a página vision-test** com este guia
2. **Testar com múltiplas imagens** diferentes
3. **Comparar resultados** com JerseyEditor atual
4. **Aplicar melhorias** no sistema principal
5. **Integrar estratégia validada** no fluxo de produção 