import { NextResponse } from 'next/server';
import { clearThirdwebCache, getCacheStatus } from '@/lib/thirdweb-production-fix';

/**
 * API para forçar refresh do cache do marketplace
 * Útil quando dados são atualizados e precisam ser refletidos imediatamente
 */
export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'clear') {
      clearThirdwebCache();
      
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use "clear" to clear cache.'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error in refresh-cache API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET - Verificar status do cache
 */
export async function GET() {
  try {
    const cacheStatus = getCacheStatus();
    
    return NextResponse.json({
      success: true,
      cache: cacheStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking cache status:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 