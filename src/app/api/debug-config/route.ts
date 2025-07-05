import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jersey-api-dalle3.onrender.com';
  
  try {
    // Teste de health check da API Python
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });
    
    const healthData = healthResponse.ok ? await healthResponse.json() : null;
    
    return NextResponse.json({
      success: true,
      config: {
        API_BASE_URL,
        environment: process.env.NODE_ENV,
        hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
        apiStatus: healthResponse.ok ? 'online' : 'offline',
        apiStatusCode: healthResponse.status
      },
      health: healthData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      config: {
        API_BASE_URL,
        environment: process.env.NODE_ENV,
        hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
        apiStatus: 'connection_error'
      },
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 