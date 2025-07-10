import { NextRequest, NextResponse } from 'next/server'

interface QualitySettings {
  defaultQuality: 'standard' | 'hd';
  allowUserChoice: boolean;
  standardCost: number;
  hdCost: number;
  maxGenerationsPerUser: number;
}

// Configurações padrão
const DEFAULT_QUALITY_SETTINGS: QualitySettings = {
  defaultQuality: 'standard',
  allowUserChoice: false,
  standardCost: 0.04,
  hdCost: 0.08,
  maxGenerationsPerUser: 50
}

// Em produção, isso seria armazenado no banco de dados
let qualitySettings: QualitySettings = { ...DEFAULT_QUALITY_SETTINGS }

export async function GET() {
  try {
    // Em produção, buscar do banco de dados
    // const settings = await db.collection('admin_settings').doc('quality').get()
    
    return NextResponse.json(qualitySettings)
  } catch (error) {
    console.error('Error fetching quality settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, settings } = body

    if (action === 'update') {
      // Validar os dados recebidos
      if (settings.defaultQuality && !['standard', 'hd'].includes(settings.defaultQuality)) {
        return NextResponse.json(
          { error: 'Invalid default quality value' },
          { status: 400 }
        )
      }

      if (settings.standardCost && (settings.standardCost < 0 || settings.standardCost > 1)) {
        return NextResponse.json(
          { error: 'Standard cost must be between 0 and 1' },
          { status: 400 }
        )
      }

      if (settings.hdCost && (settings.hdCost < 0 || settings.hdCost > 1)) {
        return NextResponse.json(
          { error: 'HD cost must be between 0 and 1' },
          { status: 400 }
        )
      }

      if (settings.maxGenerationsPerUser && (settings.maxGenerationsPerUser < 1 || settings.maxGenerationsPerUser > 1000)) {
        return NextResponse.json(
          { error: 'Max generations per user must be between 1 and 1000' },
          { status: 400 }
        )
      }

      // Atualizar as configurações
      qualitySettings = { ...qualitySettings, ...settings }

      // Em produção, salvar no banco de dados
      // await db.collection('admin_settings').doc('quality').set(qualitySettings)

      console.log('✅ Quality settings updated:', qualitySettings)

      return NextResponse.json({
        success: true,
        settings: qualitySettings,
        message: 'Quality settings updated successfully'
      })
    }

    if (action === 'reset') {
      // Resetar para configurações padrão
      qualitySettings = { ...DEFAULT_QUALITY_SETTINGS }

      // Em produção, salvar no banco de dados
      // await db.collection('admin_settings').doc('quality').set(qualitySettings)

      console.log('✅ Quality settings reset to default')

      return NextResponse.json({
        success: true,
        settings: qualitySettings,
        message: 'Quality settings reset to default'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating quality settings:', error)
    return NextResponse.json(
      { error: 'Failed to update quality settings' },
      { status: 500 }
    )
  }
} 