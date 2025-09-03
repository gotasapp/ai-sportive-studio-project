import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🚀 TEST API WITH VOTING LOGIC!');
  
  try {
    const body = await request.json();
    const { nftId, action } = body;
    
    console.log('📝 Received voting data:', { nftId, action });
    
    // SIMULAR VOTE SEM MONGODB POR ENQUANTO
    if (action === 'upvote') {
      console.log('👍 Simulating upvote...');
      return NextResponse.json({ 
        success: true, 
        message: 'Vote added! (simulated)',
        votes: Math.floor(Math.random() * 10) + 1,
        nftId: nftId,
        action: action,
        timestamp: new Date().toISOString()
      });
    } else if (action === 'remove') {
      console.log('👎 Simulating vote removal...');
      return NextResponse.json({ 
        success: true, 
        message: 'Vote removed! (simulated)',
        votes: Math.floor(Math.random() * 5),
        nftId: nftId,
        action: action,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'POST funcionou!',
        receivedData: body,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Test API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro no POST',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}