import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Fast path: Only check maintenance when explicitly enabled via env var.
  // This eliminates ALL Supabase queries and overhead from the Edge middleware.
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next();
  }

  // Skip maintenance redirect for prefetch requests
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch';
  if (isPrefetch) {
    return NextResponse.next();
  }

  // Already on maintenance page — don't loop
  if (request.nextUrl.pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Block API routes with 503
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.json(
      { success: false, error: 'Service is currently under maintenance.', isMaintenance: true },
      { status: 503 }
    );
  }

  // Redirect all page traffic to maintenance
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (like robots.txt, sitemap.xml, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.xml$|.*\\.txt$|.*\\.html$|.*\\.json$).*)',
  ],
};
