import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

// Adicione o objeto de estilos genéricos no topo do arquivo
const GENERIC_STYLE_PROMPTS = {
  "retro-jersey": "A retro-style soccer jersey inspired by the aesthetics of the 80s and 90s. Features thick horizontal or vertical stripes, a soft fabric texture, and a wide ribbed collar (often polo-style) in a contrasting color. Includes vintage stitching details, bold sleeve cuffs, and a looser athletic fit. Displayed floating flat on a clean white background, no mannequin, soft studio lighting, 4K photorealistic quality, with worn color accents and old-school charm.",
  // Adicione outros estilos se quiser
};

export async function POST(req: Request) {
  console.log('[Next.js API] /generate-from-reference: Rota acionada.');
  try {
    const body = await req.json();
    const { sport } = body;
    let endpoint = '';
    let payload: any = {};

    if (sport === 'jersey') {
      endpoint = '/generate-jersey-from-reference';
      // Se style for um dos genéricos, use o prompt genérico
      let prompt = body.prompt;
      if (body.style && GENERIC_STYLE_PROMPTS[body.style]) {
        prompt = GENERIC_STYLE_PROMPTS[body.style];
        console.log('[DEBUG] Usando prompt de estilo genérico:', body.style);
      }
      payload = {
        teamName: body.teamName,
        player_name: body.player_name,
        player_number: body.player_number,
        sport: body.sport,
        view: body.view,
        quality: body.quality,
        style: body.style,
        prompt: prompt,
        customPrompt: body.customPrompt,
      };
    } else if (sport === 'stadium') {
      endpoint = '/generate-stadium-from-reference';
      payload = {
        teamName: body.teamName,
        sport: body.sport,
        quality: body.quality,
        style: body.style,
        perspective: body.perspective,
        atmosphere: body.atmosphere,
        timeOfDay: body.timeOfDay,
        weather: body.weather,
        view: body.view,
        prompt: body.prompt,
        customPrompt: body.customPrompt,
        analysis: body.analysis, // resultado vision, se houver
      };
    } else if (sport === 'badge') {
      endpoint = '/generate-badge-from-reference';
      payload = {
        teamName: body.teamName,
        sport: body.sport,
        quality: body.quality,
        style: body.style,
        prompt: body.prompt,
        customPrompt: body.customPrompt,
        view: body.view,
        analysis: body.analysis,
      };
    } else {
      return NextResponse.json({ success: false, error: 'Tipo de geração (sport) não suportado.' }, { status: 400 });
    }

    console.log(`[Next.js API] Encaminhando para ${endpoint} com payload:`, payload);
    
    // Primeira tentativa com OpenRouter (padrão)
    let pythonResponse = await fetch(`${PYTHON_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    // Se der rate limit (429), tentar com OpenAI direto
    if (pythonResponse.status === 429) {
      console.log(`[Next.js API] 🚫 Rate limit do OpenRouter! Tentando com OpenAI direto...`);
      
      // Adicionar flag para usar OpenAI direto
      const fallbackPayload = { ...payload, use_openai_direct: true };
      
      pythonResponse = await fetch(`${PYTHON_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });
      
      if (pythonResponse.ok) {
        console.log(`[Next.js API] ✅ Sucesso com OpenAI direto!`);
      }
    }
    
    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error(`[Next.js API] ERRO: Backend Python respondeu com status ${pythonResponse.status}. Detalhes: ${errorData}`);
      
      // Mensagem mais amigável para rate limit
      const friendlyError = pythonResponse.status === 429 
        ? `Rate limit atingido em ambos OpenRouter e OpenAI. Aguarde 1-2 minutos e tente novamente.`
        : `Error from generation service: ${errorData}`;
      
      return NextResponse.json(
        { success: false, error: friendlyError },
        { status: pythonResponse.status }
      );
    }
    const successData = await pythonResponse.json();
    console.log('[Next.js API] Sucesso! Resposta do Python:', successData);
    return NextResponse.json(successData, { status: 200 });
  } catch (error: any) {
    console.error('[Next.js API] ERRO CRÍTICO na rota /generate-from-reference:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 