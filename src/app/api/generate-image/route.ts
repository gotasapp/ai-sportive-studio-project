import { NextResponse } from 'next/server'
import Replicate from 'replicate'

export const runtime = 'edge'

const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_REPLICATE_API_KEY) {
      console.error('NEXT_PUBLIC_REPLICATE_API_KEY não encontrada')
      return NextResponse.json(
        { error: 'Configuração da API não encontrada' },
        { status: 500 }
      )
    }

    console.log('Enviando requisição para o Replicate...')
    console.log('API Key:', process.env.NEXT_PUBLIC_REPLICATE_API_KEY.substring(0, 5) + '...')

    // Primeiro, vamos verificar se a API key é válida
    try {
      const testResponse = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${process.env.NEXT_PUBLIC_REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!testResponse.ok) {
        throw new Error(`API key inválida: ${testResponse.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao verificar API key:', error)
      return NextResponse.json(
        { error: 'API key inválida ou sem créditos suficientes' },
        { status: 401 }
      )
    }

    // Usando o modelo mais básico do Replicate
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          negative_prompt: "ugly, blurry, low quality, distorted, deformed, text, watermark, signature",
          num_inference_steps: 20,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
          scheduler: "K_EULER",
          seed: Math.floor(Math.random() * 1000000)
        }
      }
    )

    console.log('Resposta bruta do Replicate:', JSON.stringify(output, null, 2))

    if (!output) {
      throw new Error('Resposta vazia do Replicate')
    }

    // Verifica se a resposta é um array ou uma string
    let imageUrl: string
    if (Array.isArray(output)) {
      if (output.length === 0) {
        throw new Error('Resposta inválida do Replicate: array vazio')
      }
      const firstItem = output[0]
      if (typeof firstItem === 'string') {
        imageUrl = firstItem
      } else if (typeof firstItem === 'object' && firstItem !== null) {
        // Tenta extrair a URL do objeto
        const url = (firstItem as any).url || (firstItem as any).image || (firstItem as any).output
        if (typeof url === 'string') {
          imageUrl = url
        } else {
          throw new Error(`Formato de resposta inesperado: ${JSON.stringify(firstItem)}`)
        }
      } else {
        throw new Error(`Tipo de resposta inesperado: ${typeof firstItem}`)
      }
    } else if (typeof output === 'string') {
      imageUrl = output
    } else if (typeof output === 'object' && output !== null) {
      // Tenta extrair a URL do objeto
      const url = (output as any).url || (output as any).image || (output as any).output
      if (typeof url === 'string') {
        imageUrl = url
      } else {
        throw new Error(`Formato de resposta inesperado: ${JSON.stringify(output)}`)
      }
    } else {
      throw new Error(`Resposta inválida do Replicate: ${JSON.stringify(output)}`)
    }

    if (!imageUrl.startsWith('http')) {
      throw new Error(`URL da imagem inválida (não começa com http): ${imageUrl}`)
    }

    console.log('URL da imagem gerada:', imageUrl)

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Erro detalhado na API:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Erro ao gerar imagem: ${error.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Erro desconhecido ao gerar imagem' },
      { status: 500 }
    )
  }
} 