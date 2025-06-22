/**
 * Stadium Service - Frontend Integration
 * Referências Locais + Upload Manual
 */

export interface StadiumAnalysisRequest {
  reference_image_base64: string
  analysis_type?: 'basic' | 'comprehensive' | 'atmosphere'
}

export interface StadiumGenerationRequest {
  stadium_id: string;
  reference_type?: string;
  generation_style?: string;
  perspective?: string;
  atmosphere?: string;
  time_of_day?: string;
  weather?: string;
  quality?: string;
  custom_prompt?: string;
  custom_reference_base64?: string;
}

export interface CustomStadiumRequest {
  prompt: string;
  reference_image_base64?: string;
  generation_style?: string;
  perspective?: string;
  atmosphere?: string;
  time_of_day?: string;
  quality?: string;
}

export interface StadiumInfo {
  id: string;
  name: string;
  available_references: string[];
}

export interface StadiumResponse {
  success: boolean;
  analysis?: any;
  generated_image_base64?: string;
  reference_used?: string;
  reference_source?: string;
  error?: string;
  cost_usd?: number;
  prompt_used?: string;
}

class StadiumService {
  private baseUrl = 'http://localhost:8000'; // API Unificada
  
  async getAvailableStadiums(): Promise<StadiumInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stadiums`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const stadiums = await response.json();
      return stadiums;
    } catch (error) {
      console.error('Error fetching stadiums:', error);
      throw error;
    }
  }
  
  async generateFromReference(request: StadiumGenerationRequest): Promise<StadiumResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-from-reference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating stadium:', error);
      throw error;
    }
  }
  
  async generateCustom(request: CustomStadiumRequest): Promise<StadiumResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating custom stadium:', error);
      throw error;
    }
  }
  
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Converte File para base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove o prefixo "data:image/...;base64,"
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  /**
   * Converte base64 para URL de imagem
   */
  static base64ToImageUrl(base64: string): string {
    return `data:image/png;base64,${base64}`
  }

  /**
   * Processa upload de imagem
   */
  static async processImageUpload(file: File): Promise<{ 
    base64: string, 
    preview: string,
    size: number,
    type: string 
  }> {
    try {
      const base64 = await this.fileToBase64(file)
      const preview = this.base64ToImageUrl(base64)
      
      return {
        base64,
        preview,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      console.error('Error processing image upload:', error)
      throw error
    }
  }

  /**
   * Estima custo da operação
   */
  static estimateCost(operation: 'analysis' | 'generation', quality: 'standard' | 'hd' = 'standard'): number {
    const costs = {
      analysis: 0.01,
      generation: {
        standard: 0.04,
        hd: 0.08
      }
    }

    if (operation === 'analysis') {
      return costs.analysis
    } else {
      return costs.generation[quality]
    }
  }

  /**
   * Formata análise para exibição
   */
  static formatAnalysisForDisplay(analysis: StadiumResponse['analysis']): {
    title: string
    items: Array<{ label: string, value: string }>
  }[] {
    if (!analysis) return []

    const sections = []

    if (analysis.description) {
      sections.push({
        title: 'Análise da Imagem',
        items: [
          { label: 'Descrição', value: analysis.description }
        ]
      })
    }

    if (analysis.generation_prompt) {
      sections.push({
        title: 'Prompt de Geração',
        items: [
          { label: 'Prompt', value: analysis.generation_prompt }
        ]
      })
    }

    return sections
  }
}

export const stadiumService = new StadiumService(); 