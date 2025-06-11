/**
 * Serviço para integração com API DALL-E 3
 */
import { ImageGenerationRequest, Dalle3Response } from '@/types';

export class Dalle3Service {
  private static readonly API_BASE_URL = 'https://jersey-api-dalle3.onrender.com';

  /**
   * Gera imagem usando DALL-E 3
   */
  static async generateImage(request: ImageGenerationRequest): Promise<Dalle3Response> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // FastAPI sends detailed validation errors in `errorData.detail`
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail
          : JSON.stringify(errorData.detail);
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no serviço DALL-E 3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Lista times disponíveis
   */
  static async getAvailableTeams(): Promise<string[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/teams`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.teams || [];
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return [];
    }
  }

  /**
   * Verifica saúde da API
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Erro no health check:', error);
      return false;
    }
  }

  /**
   * Converte imagem base64 para URL
   */
  static base64ToImageUrl(base64: string): string {
    return `data:image/png;base64,${base64}`;
  }
} 