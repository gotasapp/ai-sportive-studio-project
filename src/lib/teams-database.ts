import { TeamData } from '@/types'

export const TEAMS_DATABASE: TeamData[] = [
  {
    id: 'flamengo',
    name: 'Flamengo',
    searchTerms: ['flamengo', 'mengo', 'fla'],
    colors: {
      primary: '#e30613',
      secondary: '#000000'
    },
    pattern: 'striped',
    promptPattern: 'classic football jersey with red and black stripes',
    league: 'Brasileirão',
    country: 'Brazil',
    description: 'Time tradicional do futebol brasileiro'
  },
  {
    id: 'palmeiras',
    name: 'Palmeiras',
    searchTerms: ['palmeiras', 'verdao', 'palestra'],
    colors: {
      primary: '#006437',
      secondary: '#ffffff'
    },
    pattern: 'solid',
    promptPattern: 'classic football jersey in green and white',
    league: 'Brasileirão',
    country: 'Brazil',
    description: 'Time tradicional do futebol brasileiro'
  },
  {
    id: 'corinthians',
    name: 'Corinthians',
    searchTerms: ['corinthians', 'timao', 'corinthians paulista'],
    colors: {
      primary: '#000000',
      secondary: '#ffffff'
    },
    pattern: 'solid',
    promptPattern: 'classic football jersey in black and white',
    league: 'Brasileirão',
    country: 'Brazil',
    description: 'Time tradicional do futebol brasileiro'
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    searchTerms: ['sao paulo', 'tricolor', 'são paulo'],
    colors: {
      primary: '#ff0000',
      secondary: '#ffffff'
    },
    pattern: 'striped',
    promptPattern: 'classic football jersey with red and white stripes',
    league: 'Brasileirão',
    country: 'Brazil',
    description: 'Time tradicional do futebol brasileiro'
  }
] 