// ================================================
// useTeams Hook
// Gerencia estado de times com fetch e fallback
// ================================================

import { useEffect, useState, useCallback } from 'react'
import { fetchTeamsFromDB } from '../services/teamsService'

export function useTeams(initial?: { fallback?: string[]; defaultTeam?: string }) {
  const [availableTeams, setAvailableTeams] = useState<string[]>(initial?.fallback ?? [])
  const [selectedTeam, setSelectedTeam] = useState<string>(initial?.defaultTeam ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchTeamsFromDB()
      setAvailableTeams(list)
      if (!selectedTeam && list.length) setSelectedTeam(list[0])
    } catch (err: any) {
      console.error('Error loading teams:', err)
      const fallback = initial?.fallback ?? ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo']
      setAvailableTeams(fallback)
      if (!selectedTeam) setSelectedTeam(fallback[0])
      setError(err?.message ?? 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }, [initial?.fallback, selectedTeam])

  useEffect(() => {
    load()
  }, [load])

  return { availableTeams, selectedTeam, setSelectedTeam, loading, error, reload: load }
}
