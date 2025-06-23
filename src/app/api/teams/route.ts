import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    console.log('🔄 Teams Proxy: Forwarding request to external API...');
    console.log('📍 Target URL:', `${API_BASE_URL}/teams`);
    
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📬 External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ External API error:', errorText);
      
      // Fallback teams if API fails
      const fallbackTeams = [
        'Flamengo', 
        'Palmeiras', 
        'Vasco da Gama', 
        'Corinthians', 
        'São Paulo',
        'Santos',
        'Grêmio',
        'Internacional'
      ];
      
      console.log('🔄 Using fallback teams due to API error');
      return NextResponse.json(fallbackTeams);
    }

    const teams = await response.json();
    console.log('✅ Teams loaded successfully:', teams.length || 'unknown count');
    
    return NextResponse.json(teams);
    
  } catch (error) {
    console.error('❌ Teams proxy error:', error);
    
    // Fallback teams if everything fails
    const fallbackTeams = [
      'Flamengo', 
      'Palmeiras', 
      'Vasco da Gama', 
      'Corinthians', 
      'São Paulo',
      'Santos',
      'Grêmio',
      'Internacional'
    ];
    
    console.log('🔄 Using fallback teams due to proxy error');
    return NextResponse.json(fallbackTeams);
  }
} 