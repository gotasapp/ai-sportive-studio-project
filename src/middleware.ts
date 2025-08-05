import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 🔄 REDIRECT INTELIGENTE: Detectar padrão de rota antiga /marketplace/collection/[collectionId]/[tokenId]
  const collectionRouteMatch = pathname.match(/^\/marketplace\/collection\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?$/);
  
  if (collectionRouteMatch) {
    const [, param1, param2, param3] = collectionRouteMatch;
    
    // Se param1 é um ObjectId (24 chars hex), é a rota antiga
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param1);
    
    if (isObjectId && param2 && !param3) {
      // Rota antiga: /marketplace/collection/[objectId]/[tokenId]
      // Redirect para: /marketplace/collection/custom/[objectId]/[tokenId]
      const newUrl = new URL(`/marketplace/collection/custom/${param1}/${param2}`, request.url);
      return NextResponse.redirect(newUrl);
    }
    
    if (isObjectId && !param2) {
      // Rota antiga: /marketplace/collection/[objectId]
      // Redirect para: /marketplace/collection/custom/[objectId]
      const newUrl = new URL(`/marketplace/collection/custom/${param1}`, request.url);
      return NextResponse.redirect(newUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};