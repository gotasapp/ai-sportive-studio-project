import { NextRequest, NextResponse } from 'next/server'

interface BadgeGenerationRequest {
  team_name: string
  badge_name: string
  badge_number: string
  style?: string
  quality?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BadgeGenerationRequest = await request.json()
    
    console.log('🎨 Badge generation request:', body)
    
    // Validate required fields
    if (!body.team_name || !body.badge_name || !body.badge_number) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: team_name, badge_name, badge_number' },
        { status: 400 }
      )
    }

    // Call our Python API
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${pythonApiUrl}/badges/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team_name: body.team_name,
        badge_name: body.badge_name,
        badge_number: body.badge_number,
        style: body.style || 'modern',
        quality: body.quality || 'standard'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Python API error:', response.status, errorText)
      return NextResponse.json(
        { success: false, error: `Python API error: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ Badge generation successful')
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Badge generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 