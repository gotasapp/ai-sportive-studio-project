import { useEffect, useState } from 'react'
import { pipeline } from '@xenova/transformers'

export function ModelLoader() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadModel() {
      try {
        console.log('Iniciando carregamento do modelo...')
        const model = await pipeline('image-to-image', 'runwayml/stable-diffusion-v1-5', {
          quantized: true,
          progress_callback: (progress: number) => {
            setProgress(Math.round(progress * 100))
            console.log(`Progresso: ${Math.round(progress * 100)}%`)
          }
        })
        console.log('Modelo carregado com sucesso!')
        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar modelo:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    }

    loadModel()
  }, [])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro ao carregar o modelo: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-600">Carregando modelo... {progress}%</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    )
  }

  return null
} 