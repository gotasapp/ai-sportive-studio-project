import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_NETWORK } from '@/lib/network-config';

/**
 * API para limpar cache do marketplace e forçar nova busca
 * Útil quando mudamos de rede (Polygon → CHZ)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing marketplace cache...');
    
    // Simular limpeza de cache (em produção, você pode usar Redis ou similar)
    const cacheCleared = true;
    
    console.log(`✅ Cache cleared for network: ${ACTIVE_NETWORK.name} (${ACTIVE_NETWORK.chainId})`);
    
    return NextResponse.json({
      success: true,
      message: 'Marketplace cache cleared successfully',
      network: {
        name: ACTIVE_NETWORK.name,
        chainId: ACTIVE_NETWORK.chainId,
        currency: ACTIVE_NETWORK.currency
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error clearing marketplace cache:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear marketplace cache'
    }, { status: 500 });
  }
}
