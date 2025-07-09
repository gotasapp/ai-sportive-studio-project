/**
 * Serviço para integração com API DALL-E 3
 */
import { ImageGenerationRequest, Dalle3Response } from '@/types';

// Usar API proxy local para resolver CORS
const API_BASE_URL = '/api';

export const Dalle3Service = {
  /**
   * Gera imagem usando DALL-E 3
   */
  generateImage: async (request: ImageGenerationRequest): Promise<Dalle3Response> => {
    try {
      console.log('🎨 DALL-E 3: Generating image via proxy...');
      
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

      const result = await response.json();
      console.log('✅ DALL-E 3: Image generated successfully');
      return result;
    } catch (error) {
      console.error('❌ Erro no serviço DALL-E 3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  /**
   * Lista times disponíveis (versão simplificada)
   */
  getAvailableTeams: async (): Promise<string[]> => {
    try {
      console.log('📋 DALL-E 3: Fetching available teams...');
      
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) {
        console.error("Failed to fetch teams:", response.statusText);
        return [];
      }
      const teams = await response.json();
      console.log(`✅ DALL-E 3: Found ${teams.length} teams`);
      return teams;
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  },

  /**
   * Busca dados detalhados dos times do MongoDB (NOVA FUNCIONALIDADE)
   */
  getTeamsData: async (options?: {
    includeStats?: boolean;
    includeColors?: boolean;
  }): Promise<{
    success: boolean;
    teams: any[];
    count: number;
    error?: string;
  }> => {
    try {
      console.log('📊 DALL-E 3: Fetching detailed teams data from MongoDB...');
      
      const params = new URLSearchParams();
      if (options?.includeStats) params.append('includeStats', 'true');
      if (options?.includeColors) params.append('includeColors', 'true');
      
      const response = await fetch(`${API_BASE_URL}/teams-data?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ DALL-E 3: Retrieved ${result.count} teams with detailed data`);
      
      return result;
    } catch (error) {
      console.error("❌ Error fetching detailed teams data:", error);
      return {
        success: false,
        teams: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Busca dados específicos de um time para vision analysis (NOVA FUNCIONALIDADE)
   */
  getTeamVisionData: async (teamName: string): Promise<{
    success: boolean;
    teamData?: any;
    error?: string;
  }> => {
    try {
      console.log(`🔍 DALL-E 3: Fetching vision data for team: ${teamName}`);
      
      const teamsResponse = await Dalle3Service.getTeamsData({ 
        includeStats: true, 
        includeColors: true 
      });
      
      if (!teamsResponse.success) {
        throw new Error(teamsResponse.error || 'Failed to fetch teams data');
      }
      
      const team = teamsResponse.teams.find(t => 
        t.name.toLowerCase() === teamName.toLowerCase() ||
        t.normalizedName === teamName.toLowerCase().replace(/\s+/g, '_')
      );
      
      if (!team) {
        console.warn(`⚠️ DALL-E 3: Team "${teamName}" not found in database`);
        return {
          success: false,
          error: `Team "${teamName}" not found in database`
        };
      }
      
      console.log(`✅ DALL-E 3: Found vision data for ${team.name}:`, {
        totalItems: team.totalItems,
        hasImages: team.sampleImages.length,
        dataQuality: team.visionData?.dataQuality,
        primaryColors: team.visionData?.primaryColors
      });
      
      return {
        success: true,
        teamData: team
      };
      
    } catch (error) {
      console.error(`❌ Error fetching vision data for team ${teamName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Verifica saúde da API
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`);
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
    // Se já for uma URL, retorna como está
    if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
      return base64String;
    }
    return `data:image/png;base64,${base64String}`;
  },

  /**
   * Gera prompt enhanced para vision baseado nos dados do time (NOVA FUNCIONALIDADE)
   */
  generateVisionPrompt: async (
    teamName: string, 
    playerName: string, 
    playerNumber: string, 
    customPrompt?: string
  ): Promise<{
    success: boolean;
    prompt?: string;
    teamData?: any;
    error?: string;
  }> => {
    try {
      console.log(`🎨 DALL-E 3: Generating vision-enhanced prompt for ${teamName}...`);
      
      // Buscar dados do time
      const teamVisionData = await Dalle3Service.getTeamVisionData(teamName);
      
      if (!teamVisionData.success || !teamVisionData.teamData) {
        console.warn(`⚠️ Using fallback prompt for ${teamName} - no vision data available`);
        
        // Fallback para prompt básico
        const basicPrompt = `Professional ${teamName} soccer jersey, back view, player name "${playerName}" and number "${playerNumber}", realistic sports uniform, high quality fabric, studio lighting, clean white background.`;
        
        return {
          success: true,
          prompt: customPrompt ? `${basicPrompt}\n\nAdditional details: ${customPrompt}` : basicPrompt,
          teamData: null
        };
      }
      
      const team = teamVisionData.teamData;
      
      // Construir prompt enhanced baseado nos dados reais
      let enhancedPrompt = `Professional ${team.name} soccer jersey, back view, featuring player name "${playerName}" in uppercase letters and number "${playerNumber}"`;
      
      // Adicionar informações de cores se disponível
      if (team.visionData.primaryColors.length > 0) {
        enhancedPrompt += `, primary colors: ${team.visionData.primaryColors.join(' and ')}`;
      }
      
      // Adicionar padrões comuns se disponível
      if (team.visionData.commonPatterns.length > 0) {
        enhancedPrompt += `, incorporating ${team.visionData.commonPatterns.join(' or ')} design elements`;
      }
      
      // Adicionar estilos populares
      if (team.visionData.popularStyles.length > 0) {
        enhancedPrompt += `, ${team.visionData.popularStyles[0]} style`;
      }
      
      // Base quality constraints
      enhancedPrompt += `, realistic sports uniform, high quality fabric, professional athletic design, centered composition, studio lighting, clean white background, 4K resolution`;
      
      // Adicionar prompt customizado se fornecido
      if (customPrompt) {
        enhancedPrompt += `\n\nAdditional specifications: ${customPrompt}`;
      }
      
      console.log(`✅ DALL-E 3: Generated enhanced prompt for ${team.name} (quality: ${team.visionData.dataQuality})`);
      
      return {
        success: true,
        prompt: enhancedPrompt,
        teamData: team
      };
      
    } catch (error) {
      console.error(`❌ Error generating vision prompt for ${teamName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate enhanced prompt'
      };
    }
  }
}; 