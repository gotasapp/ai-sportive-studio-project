import { NextResponse } from 'next/server';

// GET handler SEM MongoDB - apenas para teste
export async function GET() {
  try {
    console.log('🧪 Teste da API de jerseys sem MongoDB');
    
    // Dados mock para teste
    const mockJerseys = [
      {
        _id: 'test1',
        name: 'Test Jersey 1',
        imageUrl: 'https://via.placeholder.com/400',
        creator: { wallet: '0x123', name: 'Test User' },
        createdAt: new Date(),
        status: 'Approved'
      },
      {
        _id: 'test2', 
        name: 'Test Jersey 2',
        imageUrl: 'https://via.placeholder.com/400',
        creator: { wallet: '0x456', name: 'Test User 2' },
        createdAt: new Date(),
        status: 'Approved'
      }
    ];

    return NextResponse.json(mockJerseys);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({ error: 'Teste falhou' }, { status: 500 });
  }
} 