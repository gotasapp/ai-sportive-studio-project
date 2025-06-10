import { TeamData, Customization } from '@/types'

export class StandardizedPromptEngine {
  static generatePrompt(
    teamData: TeamData,
    customization: Customization,
    referenceJersey?: string
  ): string {
    const stylePrompt = this.generateStylePrompt(customization.style)
    const viewPrompt = this.generateViewPrompt(customization.view)
    const materialPrompt = this.generateMaterialPrompt(customization.material)
    
    let prompt = `${stylePrompt} ${teamData.promptPattern}, ${viewPrompt}, ${materialPrompt}`
    
    if (customization.sponsor) {
      prompt += `, with ${customization.sponsor} sponsor logo`
    }
    
    if (customization.playerName && customization.playerNumber) {
      prompt += `, with player name "${customization.playerName}" and number ${customization.playerNumber}`
    }
    
    if (referenceJersey) {
      prompt += `, similar to reference jersey: ${referenceJersey}`
    }
    
    return prompt
  }

  private static generateStylePrompt(style: Customization['style']): string {
    switch (style) {
      case 'classic':
        return 'Classic vintage style'
      case 'modern':
        return 'Modern sleek style'
      case 'retro':
        return 'Retro 80s style'
      default:
        return ''
    }
  }

  private static generateViewPrompt(view: Customization['view']): string {
    switch (view) {
      case 'front':
        return 'front view'
      case 'back':
        return 'back view'
      case 'full':
        return 'full body view'
      default:
        return ''
    }
  }

  private static generateMaterialPrompt(material: Customization['material']): string {
    switch (material) {
      case 'cotton':
        return 'made of cotton fabric'
      case 'polyester':
        return 'made of polyester fabric'
      case 'mesh':
        return 'made of breathable mesh fabric'
      default:
        return ''
    }
  }
} 