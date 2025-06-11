/**
 * Serviço para integração com API DALL-E 3
 */
import { ImageGenerationRequest, Dalle3Response } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chz-backend.onrender.com';

export const Dalle3Service = {
  /**
   * Gera imagem usando DALL-E 3
   */
  generateImage: async (request: ImageGenerationRequest): Promise<Dalle3Response> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
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
  },

  /**
   * Lista times disponíveis
   */
  getAvailableTeams: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) {
        console.error("Failed to fetch teams:", response.statusText);
        return [];
      }
      const teams = await response.json();
      return teams;
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  },

  /**
   * Verifica saúde da API
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error("API health check failed:", error);
      return false;
    }
  },

  /**
   * Converte imagem base64 para URL
   */
  base64ToImageUrl: (base64String: string): string => {
    return `data:image/png;base64,${base64String}`;
  }
}; 