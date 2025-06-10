import { TeamData, Customization, PromptResult } from '@/types';

export class PromptEngine {
  private static readonly BASE_PROMPT = 'A hyper-realistic professional soccer jersey, premium fabric texture, official merchandise quality, clean studio background, professional lighting, photorealistic rendering, 4K resolution';
  
  private static readonly NEGATIVE_PROMPT = 'low quality, blurry, distorted, unrealistic, cartoon, illustration, painting, drawing, sketch, watermark, text, logo, brand, signature, cropped, frame, border, background, noise, grain, pixelated, jpeg artifacts, low resolution, bad anatomy, bad proportions, extra limbs, missing limbs, floating limbs, mutated hands, mutated fingers, long neck, cross-eyed, mutated, ugly, disgusting, poorly drawn face, mutation, deformed, extra arms, extra legs, disfigured, poorly drawn hands, missing arms, missing legs, extra arms, extra legs, mutated hands, fused fingers, too many fingers, long neck';

  private static readonly DEFAULT_SETTINGS = {
    width: 512,
    height: 640,
    steps: 30,
    cfg_scale: 8,
    sampler: 'DPM++ 2M Karras',
    seed: Math.floor(Math.random() * 1000000)
  };

  public static generatePrompt(
    teamData: TeamData,
    customization: Customization,
    referenceJersey: string | null = null
  ): PromptResult {
    const viewPrompt = this.generateViewPrompt(customization.view);
    const stylePrompt = this.generateStylePrompt(teamData, customization.style);
    const materialPrompt = this.generateMaterialPrompt(customization.material);
    
    const colorPrompt = this.generateColorPrompt(teamData.colors);
    const patternPrompt = this.generatePatternPrompt(teamData.pattern);
    
    const playerPrompt = customization.playerName && customization.playerNumber
      ? `with player name ${customization.playerName} and number ${customization.playerNumber}`
      : '';
    
    const sponsorPrompt = customization.sponsor
      ? `with sponsor ${customization.sponsor}`
      : '';

    const prompt = [
      this.BASE_PROMPT,
      viewPrompt,
      colorPrompt,
      patternPrompt,
      stylePrompt,
      materialPrompt,
      playerPrompt,
      sponsorPrompt,
      `for ${teamData.name}`
    ].filter(Boolean).join(', ');

    return {
      prompt,
      negativePrompt: this.NEGATIVE_PROMPT,
      settings: this.DEFAULT_SETTINGS
    };
  }

  private static generateViewPrompt(view: Customization['view']): string {
    switch (view) {
      case 'front':
        return 'front view';
      case 'back':
        return 'back view';
      case 'complete':
        return 'complete view';
      default:
        return 'front view';
    }
  }

  private static generateStylePrompt(teamData: TeamData, style: string): string {
    switch (style) {
      case 'modern':
        return 'contemporary design, modern cuts, sleek lines';
      case 'retro':
        return 'vintage style, classic design, 80s-90s aesthetic';
      case 'national':
        return 'national team style, patriotic elements';
      case 'urban':
        return 'street style, urban aesthetic, casual design';
      default:
        return 'contemporary design';
    }
  }

  private static generateMaterialPrompt(material: string): string {
    switch (material) {
      case 'premium':
        return 'premium quality fabric, authentic materials';
      case 'authentic':
        return 'authentic match-worn materials';
      case 'replica':
        return 'replica quality materials';
      default:
        return 'premium quality fabric';
    }
  }

  private static generateColorPrompt(colors: TeamData['colors']): string {
    const colorParts = [];
    if (colors.primary) colorParts.push(colors.primary);
    if (colors.secondary) colorParts.push(colors.secondary);
    if (colors.accent) colorParts.push(colors.accent);
    
    return colorParts.length > 0
      ? `in ${colorParts.join(' and ')} colors`
      : '';
  }

  private static generatePatternPrompt(pattern: TeamData['pattern']): string {
    switch (pattern) {
      case 'striped':
        return 'with vertical stripes';
      case 'hoops':
        return 'with horizontal stripes';
      case 'checkered':
        return 'with checkered pattern';
      case 'custom':
        return 'with custom pattern';
      default:
        return 'solid color';
    }
  }
} 