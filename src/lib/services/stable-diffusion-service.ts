import { ImageGenerationResult } from '@/types'
import Replicate from 'replicate'

export class StableDiffusionService {
  private static instance: StableDiffusionService;
  private readonly API_URL = 'http://localhost:8000';

  private constructor() {}

  public static getInstance(): StableDiffusionService {
    if (!StableDiffusionService.instance) {
      StableDiffusionService.instance = new StableDiffusionService();
    }
    return StableDiffusionService.instance;
  }

  public async generateImage(prompt: string): Promise<string> {
    try {
      console.log('Enviando requisição para a API Python...');
      
      const response = await fetch(`${this.API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: "ugly, blurry, low quality, distorted, deformed, text, watermark, signature",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 512,
          height: 512
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao gerar imagem');
      }

      const data = await response.json();
      
      if (!data.image) {
        throw new Error('Resposta inválida da API');
      }

      // Converte a imagem base64 para URL
      return `data:image/png;base64,${data.image}`;
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      throw error;
    }
  }

  public getModels(): string[] {
    return ['Stable Diffusion 1.5'];
  }

  public getSamplers(): string[] {
    return ['Euler A'];
  }
} 