// ================================================
// JERSEY EDITOR CONSTANTS
// Extraído gradualmente do arquivo original
// ================================================

import type { LucideIcon } from 'lucide-react'
import { Zap, Gamepad2, Globe, Palette, Crown } from 'lucide-react'

export type StyleFilter = { id: string; label: string; icon: LucideIcon }
export type SportOption = { id: 'soccer' | 'basketball' | 'nfl'; name: string; description: string }

export const STYLE_FILTERS: StyleFilter[] = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

export const SPORTS_OPTIONS: SportOption[] = [
  { id: 'soccer', name: 'Soccer/Football', description: 'Professional soccer jersey' },
  { id: 'basketball', name: 'Basketball', description: 'NBA/Basketball jersey' },
  { id: 'nfl', name: 'American Football', description: 'NFL jersey' }
]
