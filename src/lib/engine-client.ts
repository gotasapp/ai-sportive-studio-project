// Funções para chamar a API de backend do nosso projeto, não o Engine da Thirdweb diretamente.

export interface MintRequest {
  to: string;
  metadataUri: string;
}

export interface EngineResponse {
  success: boolean;
  queueId?: string;
  error?: string;
}

export async function mintGasless(request: MintRequest): Promise<EngineResponse> {
  try {
    const response = await fetch('/api/engine/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data: EngineResponse = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'API response indicated an error.');
    }
    return { ...data, success: true };
  } catch (err) {
    console.error('Falha no mint gasless (engine-client):', err);
    throw err;
  }
}

export async function getTransactionStatus(queueId: string) {
  try {
    const response = await fetch(`/api/engine/status/${queueId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch status');
    }
    return await response.json();
  } catch (err) {
    console.error('Falha ao buscar status da transação (engine-client):', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
} 