export interface TeamData {
  id: string;
  name: string;
  searchTerms: string[];
  colors: {
    primary: string;
    secondary: string;
  };
  pattern: 'solid' | 'striped' | 'checkered';
  promptPattern: string;
  league: string;
  country: string;
  description: string;
  logoUrl?: string;
  jerseyUrl?: string;
  bannerUrl?: string;
  stadium?: string;
  social?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  founded?: string;
  shortName?: string;
  alternateNames?: string[];
  jerseys: string[];
}

export interface Customization {
  style: 'classic' | 'modern' | 'retro';
  view: 'front' | 'back' | 'complete';
  material: 'cotton' | 'polyester' | 'mesh';
  sponsor: string;
  playerName: string;
  playerNumber: string;
}

export interface PromptResult {
  prompt: string;
  negativePrompt: string;
  settings: {
    width: number;
    height: number;
    steps: number;
    cfg_scale: number;
    sampler: string;
    seed: number;
  };
}

export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  negativePrompt: string;
  model: string;
  sampler: string;
  seed: number;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
}

export interface JerseySearchResult {
  id: string;
  team: string;
  season: string;
  imageUrl: string;
  description: string;
}

export interface CacheInfo {
  teams: number;
  equipment: number;
  lastUpdated: string;
} 