import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, negativePrompt } = await request.json();

    // TODO: Implementar a integração com o Stable Diffusion
    // Por enquanto, vamos apenas simular uma resposta
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      imageUrl: 'https://via.placeholder.com/512x640',
      prompt,
      negativePrompt,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 