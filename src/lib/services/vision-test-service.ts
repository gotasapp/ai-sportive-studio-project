/**
 * Serviço para integração com Vision Test API
 * Sistema separado para testes de GPT-4 Vision via OpenRouter
 */

// Tipos para Vision Test
export interface VisionAnalysisRequest {
  image_base64: string;
  analysis_prompt: string;
  model?: string;
}

export interface VisionResponse {
  success: boolean;
  analysis?: string;
  model_used?: string;
  cost_estimate?: number;
  error?: string;
}

// Usar API proxy local
const API_BASE_URL = '/api/vision-test';

export const VisionTestService = {
  /**
   * Analisa imagem usando GPT-4 Vision via OpenRouter
   */
  analyzeImage: async (request: VisionAnalysisRequest): Promise<VisionResponse> => {
    try {
      console.log('🔍 Vision Test: Analyzing image...');
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Vision Test: Analysis completed');
      return result;
    } catch (error) {
      console.error('❌ Erro no Vision Test Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  /**
   * Converte arquivo para base64
   */
  processImageUpload: async (file: File): Promise<{ base64: string; preview: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo data:image/...;base64, para obter apenas o base64
        const base64 = result.split(',')[1];
        
        resolve({
          base64: base64,
          preview: result // Para preview mantém o formato completo
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  },

  /**
   * Verifica saúde da API
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(API_BASE_URL);
      return response.ok;
    } catch (error) {
      console.error("Vision API health check failed:", error);
      return false;
    }
  }
}; 