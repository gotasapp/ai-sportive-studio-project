import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get available teams
 *     description: |
 *       Returns list of teams that have configured AI generation prompts.
 *       These teams can be used for jersey and stadium generation.
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Flamengo", "Corinthians", "Palmeiras", "Santos", "Vasco da Gama"]
 *       500:
 *         description: Error retrieving teams (fallback teams returned)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
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