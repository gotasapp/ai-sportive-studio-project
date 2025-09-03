import { Zap, Gamepad2, Globe, Crown, Palette } from 'lucide-react';

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

// Vision Analysis Options (from VisionTestEditor)
const SPORTS_OPTIONS = [
  { id: 'soccer', name: 'Soccer/Football', description: 'Professional soccer jersey' },
  { id: 'basketball', name: 'Basketball', description: 'NBA/Basketball jersey' },
  { id: 'nfl', name: 'American Football', description: 'NFL jersey' }
]

const VIEW_OPTIONS = [
  { id: 'back', name: 'Back View', description: 'Jersey back with player name/number' },
  { id: 'front', name: 'Front View', description: 'Jersey front with logo/badge' }
]

const VISION_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4O Mini', cost: '~$0.01' },
  { id: 'openai/gpt-4o', name: 'GPT-4O', cost: '~$0.03' },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 Vision', cost: '~$0.02' },
  { id: 'qwen/qwen-2-vl-72b-instruct', name: 'Qwen 2 VL', cost: '~$0.025' }
]

export {
  STYLE_FILTERS,
  SPORTS_OPTIONS,
  VIEW_OPTIONS,
  VISION_MODELS
};