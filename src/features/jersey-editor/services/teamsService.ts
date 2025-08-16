// ================================================
// Teams Service
// Fetch de times do banco de dados com fallback
// ================================================

export async function fetchTeamsFromDB(): Promise<string[]> {
  const response = await fetch('/api/admin/jerseys/references')
  if (!response.ok) throw new Error(`Failed to fetch teams: ${response.statusText}`)
  const data = await response.json()
  if (data?.success && Array.isArray(data.data)) {
    return data.data.map((team: any) => team.teamName)
  }
  throw new Error('Invalid data structure from teams API.')
}
