import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced Security Middleware with Windows Refresh Detection
 * Handles security + Windows soft reload issues
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 🔄 Windows Refresh Detection
  const isRefresh = request.headers.get('cache-control') === 'no-cache' ||
                   request.headers.get('pragma') === 'no-cache' ||
                   request.headers.get('x-refresh-trigger') === 'windows-detection';
  
  if (isRefresh && process.env.NODE_ENV === 'development') {
    console.log('🔄 Windows soft reload detected for:', request.nextUrl.pathname);
    
    // Force cache invalidation headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Refresh-Detected', 'true');
    response.headers.set('X-Compilation-Trigger', 'windows-refresh');
  }
  
  // Add basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Basic CSP for development
  if (process.env.NODE_ENV === 'development') {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:*; style-src 'self' 'unsafe-inline' localhost:*; connect-src 'self' localhost:* ws: wss:;"
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};