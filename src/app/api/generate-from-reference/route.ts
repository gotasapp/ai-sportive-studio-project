import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

// Adicione o objeto de estilos genéricos no topo do arquivo
const GENERIC_STYLE_PROMPTS: Record<string, string> = {
  modern: "Ultra-clean lines, sleek fabric, minimal patterns, pro lighting.",
  retro: "Vintage cut, classic stripes, muted palette, 80’s/90’s sports aesthetic.",
  national: "Strong national colorways, emblem prominence, heritage motifs.",
  urban: "Streetwear crossover, bold typography, high-contrast graphics.",
  classic: "Traditional kit layout, simple striping, timeless serif lettering.",
  futuristic: "Tech fabrics, iridescent accents, geometric paneling, neon edge.",
};

// Estilos específicos para stadiums (pode ajustar os textos conforme necessidade)
const STADIUM_STYLE_PROMPTS: Record<string, string> = {
  modern: "Contemporary arena lines, LED rim lighting, matte seats, clean pitch textures.",
  retro: "Old-school terraces, weathered concrete, sepia ambiance, classic floodlights.",
  night: "Night scene, dramatic stadium lights, high contrast shadows, moody sky.",
  day: "Clear daylight, crisp colors, soft ambient shadows, realistic sky.",
  urban: "City backdrop, skyline silhouettes, street-inspired banners and textures.",
  futuristic: "Parametric architecture, dynamic panels, holographic signage, neon accents.",
};

// Estilos específicos para badges (pode ajustar os textos conforme necessidade)
const BADGE_STYLE_PROMPTS: Record<string, string> = {
  modern: "Flat design, minimal geometry, crisp edges, high contrast, vector-like.",
  retro: "Vintage crest, textured shading, serif lettering, classic heraldic shapes.",
  metallic: "Embossed metallic finish, gold/silver highlights, subtle reflections.",
  neon: "Glow edges, vibrant palette, dark background, bold inner shadows.",
  engraved: "Engraved effect, depth, subtle noise grain, monochrome elegance.",
  shield: "Shield silhouette, layered ribbons, central emblem prominence.",
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
      // Concatenação: base + estilo + custom
      const base = body.prompt || '';
      const styleAddon = body.style && GENERIC_STYLE_PROMPTS[body.style]
        ? GENERIC_STYLE_PROMPTS[body.style]
        : '';
      const custom = body.customPrompt || '';
      const finalPrompt = [base, styleAddon, custom].filter(Boolean).join('\n\n');

      payload = {
        teamName: body.teamName,
        player_name: body.player_name,
        player_number: body.player_number,
        sport: body.sport,
        view: body.view,
        quality: body.quality,
        style: body.style,
        prompt: finalPrompt,
        customPrompt: body.customPrompt,
      };
    } else if (sport === 'stadium') {
      endpoint = '/generate-stadium-from-reference';
      // Concatenação: base + estilo + custom
      const sBase = body.prompt || '';
      const sStyle = body.style && STADIUM_STYLE_PROMPTS[body.style]
        ? STADIUM_STYLE_PROMPTS[body.style]
        : '';
      const sCustom = body.customPrompt || '';
      const stadiumPrompt = [sBase, sStyle, sCustom].filter(Boolean).join('\n\n');

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
        prompt: stadiumPrompt,
        customPrompt: body.customPrompt,
        analysis: body.analysis, // resultado vision, se houver
      };
    } else if (sport === 'badge') {
      endpoint = '/generate-badge-from-reference';
      // Concatenação: base + estilo + custom
      const bBase = body.prompt || '';
      const bStyle = body.style && BADGE_STYLE_PROMPTS[body.style]
        ? BADGE_STYLE_PROMPTS[body.style]
        : '';
      const bCustom = body.customPrompt || '';
      const badgePrompt = [bBase, bStyle, bCustom].filter(Boolean).join('\n\n');

      payload = {
        teamName: body.teamName,
        sport: body.sport,
        quality: body.quality,
        style: body.style,
        prompt: badgePrompt,
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