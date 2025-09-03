import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  console.log('[Next.js API] /complete-vision-flow: Rota acionada.');

  try {
    const body = await req.json();
    console.log('[Next.js API] Passo 1: Corpo da requisição recebido.');

    // O corpo já contém a imagem em base64 e outros parâmetros
    const { image_base64, player_name, player_number, sport, view, model, quality } = body;

    console.log(`[Next.js API] Passo 2: Encaminhando para o backend Python em ${PYTHON_API_URL}/complete-vision-flow...`);
    const pythonResponse = await fetch(`${PYTHON_API_URL}/complete-vision-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64,
        player_name,
        player_number,
        sport,
        view,
        model,
        quality
      }),
    });
    console.log('[Next.js API] Passo 3: Resposta recebida do backend Python.');

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error(`[Next.js API] ERRO: Backend Python respondeu com status ${pythonResponse.status}. Detalhes: ${errorData}`);
      return NextResponse.json(
        { success: false, error: `Error from generation service: ${errorData}` },
        { status: pythonResponse.status }
      );
    }

    console.log('[Next.js API] Passo 4: Retornando sucesso para o frontend.');
    const successData = await pythonResponse.json();
    return NextResponse.json(successData, { status: 200 });

  } catch (error: any) {
    console.error('[Next.js API] ERRO CRÍTICO na rota /complete-vision-flow:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 