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
  weather?: string;
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

// Dados mock dos estádios predefinidos com prompts base
const MOCK_STADIUMS: StadiumInfo[] = [
  {
    id: 'maracana',
    name: 'Maracanã',
    available_references: ['atmosphere', 'day_light', 'night_lights']
  },
  {
    id: 'allianz_parque_palmeiras',
    name: 'Allianz Parque (Palmeiras)',
    available_references: ['atmosphere', 'day_light', 'night_light']
  },
  {
    id: 'allianz_arena_bayern',
    name: 'Allianz Arena (Bayern)',
    available_references: ['atmosphere', 'day_light', 'night_light']
  },
  {
    id: 'camp_nou',
    name: 'Camp Nou',
    available_references: ['atmosphere', 'day_light', 'night_light']
  },
  {
    id: 'sao_januario_vasco',
    name: 'São Januário (Vasco)',
    available_references: ['atmosphere', 'day_light', 'night_light']
  },
  {
    id: 'custom_only',
    name: 'Custom Stadium (Prompt Only)',
    available_references: ['custom']
  }
];

// Prompts base para cada estádio
const STADIUM_BASE_PROMPTS: Record<string, string> = {
  'maracana': 'Iconic Brazilian stadium with curved architecture, white facade, and massive capacity seating. The legendary Maracanã with its distinctive oval shape and historic atmosphere.',
  'allianz_parque_palmeiras': 'Modern arena with green and white colors, rectangular shape, LED facade lighting system. Contemporary design with Palmeiras branding and premium facilities.',
  'allianz_arena_bayern': 'Futuristic stadium with inflatable ETFE plastic panels, can illuminate in red, blue, or white. Distinctive diamond-pattern exterior with modern architecture.',
  'camp_nou': 'Massive European stadium with traditional rectangular design, blue and red accents, steep seating tiers. Classic football cathedral architecture with Catalonian elements.',
  'sao_januario_vasco': 'Historic Brazilian stadium with traditional architecture, black and white elements, intimate atmosphere. Classic design with distinctive facade and loyal fanbase energy.',
  'custom_only': 'Modern football stadium with contemporary architecture and premium facilities'
};

export class StadiumService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // API Local Unificada
  
  async getAvailableStadiums(): Promise<StadiumInfo[]> {
    try {
      // Temporariamente usando dados mock até resolver CORS
      console.log('🏟️ Loading stadium references from local data...');
      return MOCK_STADIUMS;
      
      // TODO: Reativar quando CORS for resolvido
      /*
      const response = await fetch(`${this.baseUrl}/stadiums`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const stadiums = await response.json();
      return stadiums;
      */
    } catch (error) {
      console.error('Error fetching stadiums, using mock data:', error);
      return MOCK_STADIUMS; // Fallback para dados mock
    }
  }
  
  async generateFromReference(request: StadiumGenerationRequest): Promise<StadiumResponse> {
    try {
      // Usar prompt base do estádio se disponível
      const basePrompt = STADIUM_BASE_PROMPTS[request.stadium_id] || request.custom_prompt || 'Modern stadium';
      
      // Construir prompt melhorado
      const enhancedPrompt = this.buildEnhancedPrompt({
        baseDescription: basePrompt,
        generation_style: request.generation_style,
        perspective: request.perspective,
        atmosphere: request.atmosphere,
        time_of_day: request.time_of_day,
        weather: request.weather
      });

      console.log('🏟️ Enhanced stadium prompt:', enhancedPrompt);

      // Payload correto apenas para estádios
      const payload = {
        prompt: enhancedPrompt,
        quality: request.quality || 'standard',
        type: 'stadium'
      };

      console.log('📦 Stadium API Payload:', JSON.stringify(payload, null, 2));

      // Usar DALL-E 3 service diretamente por enquanto
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ API Success Response:', result);
      
      return {
        success: result.success,
        generated_image_base64: result.image_url || result.generated_image_base64,
        reference_used: request.stadium_id,
        reference_source: 'predefined',
        cost_usd: 0.04, // DALL-E 3 cost
        prompt_used: enhancedPrompt,
        error: result.error
      };
    } catch (error) {
      console.error('Error generating stadium:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stadium generation failed'
      };
    }
  }
  
  async generateCustom(request: CustomStadiumRequest): Promise<StadiumResponse> {
    try {
      // Construir prompt melhorado
      const enhancedPrompt = this.buildEnhancedPrompt({
        baseDescription: request.prompt,
        generation_style: request.generation_style,
        perspective: request.perspective,
        atmosphere: request.atmosphere,
        time_of_day: request.time_of_day,
        weather: request.weather || 'clear'
      });

      console.log('🏟️ Custom stadium prompt:', enhancedPrompt);

      const payload = {
        prompt: enhancedPrompt,
        quality: request.quality || 'standard',
        type: 'stadium'
      };

      console.log('📦 Custom Stadium API Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        success: result.success,
        generated_image_base64: result.image_url || result.generated_image_base64,
        reference_used: 'custom',
        reference_source: 'custom_prompt',
        cost_usd: 0.04,
        prompt_used: enhancedPrompt,
        error: result.error
      };
    } catch (error) {
      console.error('Error generating custom stadium:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Custom stadium generation failed'
      };
    }
  }

  // Método para construir prompt melhorado
  private buildEnhancedPrompt(params: {
    baseDescription: string;
    generation_style?: string;
    perspective?: string;
    atmosphere?: string;
    time_of_day?: string;
    weather?: string;
  }): string {
    let prompt = params.baseDescription;
    
    // Adicionar estilo
    if (params.generation_style) {
      const styleMap: Record<string, string> = {
        'realistic': 'photorealistic, highly detailed',
        'cinematic': 'cinematic lighting, dramatic composition, movie-like quality',
        'dramatic': 'dramatic lighting, high contrast, epic atmosphere'
      };
      prompt += `, ${styleMap[params.generation_style] || params.generation_style}`;
    }
    
    // Adicionar perspectiva
    if (params.perspective) {
      const perspectiveMap: Record<string, string> = {
        'external': 'exterior view, architectural photography',
        'internal': 'interior view, from inside the stadium',
        'mixed': 'dynamic angle showing both interior and exterior elements'
      };
      prompt += `, ${perspectiveMap[params.perspective] || params.perspective}`;
    }
    
    // Adicionar atmosfera
    if (params.atmosphere) {
      const atmosphereMap: Record<string, string> = {
        'packed': 'completely full of enthusiastic fans, vibrant crowd energy',
        'half_full': 'moderately filled with fans, lively atmosphere',
        'empty': 'empty seats, peaceful and serene atmosphere'
      };
      prompt += `, ${atmosphereMap[params.atmosphere] || params.atmosphere}`;
    }
    
    // Adicionar horário
    if (params.time_of_day) {
      const timeMap: Record<string, string> = {
        'day': 'bright daylight, clear blue sky, natural lighting',
        'night': 'night time with stadium lights on, dramatic illumination',
        'sunset': 'golden hour lighting, warm sunset colors in the sky'
      };
      prompt += `, ${timeMap[params.time_of_day] || params.time_of_day}`;
    }
    
    // Adicionar clima
    if (params.weather) {
      const weatherMap: Record<string, string> = {
        'clear': 'clear weather, perfect visibility',
        'dramatic': 'dramatic storm clouds, moody sky',
        'cloudy': 'overcast sky, soft diffused lighting'
      };
      prompt += `, ${weatherMap[params.weather] || params.weather}`;
    }
    
    // Adicionar qualificadores finais
    prompt += ', professional photography, 8K resolution, masterpiece quality';
    
    return prompt;
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

  // Método estático para compatibilidade
  static async checkHealth(): Promise<any> {
    const instance = new StadiumService();
    return instance.checkHealth();
  }

  // Método estático para compatibilidade com código existente
  static async generateStadium(request: any): Promise<StadiumResponse> {
    const instance = new StadiumService();
    
    // Se tem stadium_id, usar generateFromReference
    if (request.stadium_id && request.stadium_id !== 'custom_only') {
      return instance.generateFromReference({
        stadium_id: request.stadium_id,
        generation_style: request.generation_style,
        perspective: request.perspective,
        atmosphere: request.atmosphere,
        time_of_day: request.time_of_day,
        weather: request.weather,
        quality: request.quality,
        custom_prompt: request.custom_prompt
      });
    }
    
    // Caso contrário, usar generateCustom
    return instance.generateCustom({
      prompt: request.prompt || request.custom_prompt || 'Modern football stadium with contemporary architecture',
      reference_image_base64: request.reference_image_base64,
      generation_style: request.generation_style,
      atmosphere: request.atmosphere,
      time_of_day: request.time_of_day,
      quality: request.quality
    });
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

const instance = new StadiumService();
export default instance;

export const stadiumService = new StadiumService(); 