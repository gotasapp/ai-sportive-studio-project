import { JerseySearchResult } from '@/types'

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json'

export class JerseySearchService {
  private static async fetchApi(endpoint: string) {
    const response = await fetch(`${BASE_URL}/${API_KEY}/${endpoint}`)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    return response.json()
  }

  static async searchJerseys(query: string): Promise<JerseySearchResult[]> {
    try {
      const data = await this.fetchApi(`searchteams.php?t=${encodeURIComponent(query)}`)
      
      if (!data.teams) {
        return []
      }

      return data.teams.map((team: any) => ({
        id: team.idTeam,
        team: team.strTeam,
        season: new Date().getFullYear().toString(),
        imageUrl: team.strTeamJersey || team.strTeamBadge,
        description: `${team.strTeam} ${team.strLeague} jersey`
      }))
    } catch (error) {
      console.error('Error searching jerseys:', error)
      return []
    }
  }

  static async getTeamJerseys(teamId: string): Promise<JerseySearchResult[]> {
    try {
      const data = await this.fetchApi(`lookupteam.php?id=${teamId}`)
      
      if (!data.teams || !data.teams[0]) {
        return []
      }

      const team = data.teams[0]
      return [{
        id: team.idTeam,
        team: team.strTeam,
        season: new Date().getFullYear().toString(),
        imageUrl: team.strTeamJersey || team.strTeamBadge,
        description: `${team.strTeam} ${team.strLeague} jersey`
      }]
    } catch (error) {
      console.error('Error getting team jerseys:', error)
      return []
    }
  }
} 