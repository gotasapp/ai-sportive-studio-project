import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'configurado' : 'não configurado'
  });
} 