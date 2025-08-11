import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 SIMPLE VOTE API STARTED!');
  
  try {
    console.log('🔍 Parsing request body...');
    const body = await request.json();
    
    console.log('📝 Received data:', body);
    
    // Sem MongoDB, apenas resposta simples
    const response = {
      success: true,
      message: 'Simple vote API working!',
      receivedData: body,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Sending response:', response);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Simple Vote API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
