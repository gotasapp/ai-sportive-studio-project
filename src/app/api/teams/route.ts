import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Teams API: Getting teams with configured prompts...');
    
    // ESTRATÉGIA SIMPLES: Usar apenas times que têm prompts configurados no Python
    // Corresponde exatamente aos times em main_unified.py setup_team_prompts()
    const configuredTeams = [
      'Flamengo',
      'Corinthians', 
      'Palmeiras',
      'Santos',
      'Vasco da Gama'
    ];
    
    console.log(`✅ Teams API: Using ${configuredTeams.length} teams with configured prompts`);
    console.log('📋 Teams API: Teams available:', configuredTeams);
    
    return NextResponse.json(configuredTeams);
    
  } catch (error) {
    console.error('❌ Teams API: Error:', error);
    
    // Fallback de emergência - mesmos times configurados
    const emergencyTeams = [
      'Flamengo',
      'Corinthians', 
      'Palmeiras',
      'Santos',
      'Vasco da Gama'
    ];
    
    console.log('🚨 Teams API: Using emergency fallback teams');
    return NextResponse.json(emergencyTeams);
  }
} 