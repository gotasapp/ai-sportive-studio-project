import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    
    // Buscar configurações do admin
    const adminSettings = await db.collection('admin_settings').findOne({});
    
    // Default royalty se não encontrar configuração
    const royaltyPercentage = adminSettings?.defaults?.royaltyPercentage || 10;
    
    console.log('🧾 Admin royalty percentage:', royaltyPercentage + '%');
    
    return NextResponse.json({
      success: true,
      royaltyPercentage
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching royalty settings:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fetch royalty settings',
      royaltyPercentage: 10 // fallback
    }, { status: 500 });
  }
}