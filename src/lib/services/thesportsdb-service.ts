import axios from 'axios';
import { TeamData, JerseySearchResult } from '@/types';

const API_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strAlternate: string;
  strLeague: string;
  strCountry: string;
  strDescriptionEN: string;
  strStadium: string;
  strWebsite: string;
  strTwitter: string;
  strInstagram: string;
  strTeamBadge: string;
  strTeamJersey: string;
  strTeamBanner: string;
  intFormedYear: string;
}

interface TheSportsDBEquipment {
  idEquipment: string;
  strSeason: string;
  strType: string;
  strEquipment: string;
  strEquipmentDescription: string;
}

class TheSportsDBService {
  private static instance: TheSportsDBService;
  private teamCache: Map<string, TheSportsDBTeam> = new Map();
  private equipmentCache: Map<string, TheSportsDBEquipment[]> = new Map();

  private constructor() {}

  public static getInstance(): TheSportsDBService {
    if (!TheSportsDBService.instance) {
      TheSportsDBService.instance = new TheSportsDBService();
    }
    return TheSportsDBService.instance;
  }

  public async searchTeam(teamName: string): Promise<TeamData | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/searchteams.php`, {
        params: { t: teamName }
      });

      if (!response.data.teams || response.data.teams.length === 0) {
        return null;
      }

      const team = response.data.teams[0] as TheSportsDBTeam;
      this.teamCache.set(team.idTeam, team);

      return this.convertToTeamData(team);
    } catch (error) {
      console.error('Error searching team:', error);
      return null;
    }
  }

  public async getTeamEquipment(teamId: string): Promise<TheSportsDBEquipment[]> {
    if (this.equipmentCache.has(teamId)) {
      return this.equipmentCache.get(teamId)!;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/lookupequipment.php`, {
        params: { id: teamId }
      });

      if (!response.data.equipment) {
        return [];
      }

      const equipment = response.data.equipment as TheSportsDBEquipment[];
      this.equipmentCache.set(teamId, equipment);
      return equipment;
    } catch (error) {
      console.error('Error getting team equipment:', error);
      return [];
    }
  }

  public async getCompleteTeamData(teamName: string): Promise<JerseySearchResult | null> {
    const teamData = await this.searchTeam(teamName);
    if (!teamData) return null;

    const equipment = await this.getTeamEquipment(teamData.id);
    const officialJersey = equipment.find(e => e.strType === 'Home');
    const alternateJersey = equipment.find(e => e.strType === 'Away');

    return {
      id: teamData.id,
      team: teamData.name,
      season: officialJersey?.strSeason || 'Unknown',
      imageUrl: officialJersey?.strEquipment || teamData.jerseyUrl || '',
      description: teamData.description || `${teamData.name} jersey`
    };
  }

  private convertToTeamData(team: TheSportsDBTeam): TeamData {
    return {
      id: team.idTeam,
      name: team.strTeam,
      searchTerms: [
        team.strTeam,
        team.strTeamShort,
        team.strAlternate
      ].filter(Boolean),
      colors: {
        primary: '#000000', // These would need to be determined from the jersey image
        secondary: '#FFFFFF',
      },
      pattern: 'solid', // This would need to be determined from the jersey image
      promptPattern: '', // This would be generated based on the actual jersey pattern
      league: team.strLeague,
      country: team.strCountry,
      description: team.strDescriptionEN,
      logoUrl: team.strTeamBadge,
      jerseyUrl: team.strTeamJersey,
      bannerUrl: team.strTeamBanner,
      stadium: team.strStadium,
      social: {
        website: team.strWebsite,
        twitter: team.strTwitter,
        instagram: team.strInstagram
      },
      founded: team.intFormedYear,
      shortName: team.strTeamShort,
      alternateNames: team.strAlternate ? [team.strAlternate] : []
    };
  }

  public clearCache(): void {
    this.teamCache.clear();
    this.equipmentCache.clear();
  }

  public getCacheInfo(): { teams: number; equipment: number } {
    return {
      teams: this.teamCache.size,
      equipment: this.equipmentCache.size
    };
  }
}

export const theSportsDBService = TheSportsDBService.getInstance(); 