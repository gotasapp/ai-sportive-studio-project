import { NextRequest, NextResponse } from 'next/server';
import { EngineService } from '@/lib/services/engine-service';

// Tipagem para o corpo da requisição que vem do frontend
interface MintApiRequest {
  chain: string;
  contractAddress: string;
  to: string;
  metadata: any;
}

/**
 * Rota de API Segura para Mint Gasless com Engine
 * Esta rota age como um backend seguro que:
 * 1. Recebe o pedido do frontend.
 * 2. Lê as chaves secretas e o endereço da carteira de backend do ambiente do servidor.
 * 3. Chama o Thirdweb Engine para executar o mint.
 * 
 * NENHUMA chave secreta é exposta ao frontend.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Ler os dados do corpo da requisição (do frontend)
    const body: MintApiRequest = await request.json();
    const { chain, contractAddress, to, metadata } = body;

    // 2. Validar dados de entrada
    if (!chain || !contractAddress || !to || !metadata) {
      return NextResponse.json(
        { error: 'Dados insuficientes para o mint (chain, contractAddress, to, metadata).' },
        { status: 400 }
      );
    }

    // 3. Ler o endereço da carteira de backend do ambiente (lendo a versão pública por enquanto)
    const backendWalletAddress = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
    if (!backendWalletAddress) {
      console.error('❌ API ERRO: NEXT_PUBLIC_BACKEND_WALLET_ADDRESS não está configurado no servidor.');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta. Verifique NEXT_PUBLIC_BACKEND_WALLET_ADDRESS.' },
        { status: 500 }
      );
    }

    console.log('✅ API: Requisição de mint recebida. Chamando EngineService...');
    console.log(`   - Para: ${to}`);
    console.log(`   - Contrato: ${contractAddress}`);

    // 4. Chamar o serviço do Engine para executar o mint
    const result = await EngineService.mintAsGift({
      chain,
      contractAddress,
      to,
      metadata,
      backendWalletAddress // Passando o endereço seguro
    });

    console.log('✅ API: Mint bem-sucedido. Retornando para o frontend.');
    
    // 5. Retornar o sucesso para o frontend
    return NextResponse.json(result);

  } catch (error) {
    // Tratamento de erro robusto
    const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu.';
    console.error('❌ API ERRO CRÍTICO:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao processar o mint no servidor.',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 