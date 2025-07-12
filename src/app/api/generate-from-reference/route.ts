import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  console.log('[Next.js API] /generate-from-reference: Rota acionada.');
  try {
    const body = await req.json();
    const { sport } = body;
    let endpoint = '';
    let payload: any = {};

    if (sport === 'jersey') {
      endpoint = '/generate-jersey-from-reference';
      payload = {
        teamName: body.teamName,
        player_name: body.player_name,
        player_number: body.player_number,
        sport: body.sport,
        view: body.view,
        quality: body.quality,
        style: body.style,
        prompt: body.prompt,
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
    const pythonResponse = await fetch(`${PYTHON_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error(`[Next.js API] ERRO: Backend Python respondeu com status ${pythonResponse.status}. Detalhes: ${errorData}`);
      return NextResponse.json(
        { success: false, error: `Error from generation service: ${errorData}` },
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