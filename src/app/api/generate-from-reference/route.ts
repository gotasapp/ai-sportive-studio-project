import { NextResponse } from 'next/server';
// import { isAdmin } from '@/lib/admin-config'; // Temporariamente removido para evitar dependência do Clerk
// import { getAuth } from '@clerk/nextjs/server'; // REMOVIDO: Pacote não encontrado

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  console.log('[Next.js API] /generate-from-reference: Rota acionada.');

  // TODO: Adicionar verificação de admin com o método de autenticação correto do projeto
  // Por enquanto, a verificação de admin no frontend é a principal barreira.

  try {
    console.log('[Next.js API] Passo 1: Recebendo e processando o corpo da requisição...');
    const body = await req.json();
    const { teamName, player_name, player_number, sport, view, quality } = body;
    console.log(`[Next.js API] Passo 2: Dados recebidos para o time: ${teamName}`);

    console.log(`[Next.js API] Passo 3: Encaminhando a requisição para o backend Python em ${PYTHON_API_URL}/generate-jersey-from-reference...`);
    const pythonResponse = await fetch(`${PYTHON_API_URL}/generate-jersey-from-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, player_name, player_number, sport, view, quality }),
    });
    console.log('[Next.js API] Passo 4: Resposta recebida do backend Python.');

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error(`[Next.js API] ERRO: Backend Python respondeu com status ${pythonResponse.status}. Detalhes: ${errorData}`);
      return NextResponse.json(
        { success: false, error: `Error from generation service: ${errorData}` },
        { status: pythonResponse.status }
      );
    }

    console.log('[Next.js API] Passo 5: Processando resposta de sucesso do Python...');
    const successData = await pythonResponse.json();
    console.log('[Next.js API] Passo 6: Retornando sucesso para o frontend.');
    return NextResponse.json(successData, { status: 200 });

  } catch (error: any) {
    console.error('[Next.js API] ERRO CRÍTICO na rota /generate-from-reference:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 