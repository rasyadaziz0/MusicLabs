import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // Defense-in-depth: Reject Brotli compressed requests to mitigate Node2Shell (CVE-2026-111497)
  const contentEncoding = request.headers.get('content-encoding');
  if (contentEncoding && /\bbr\b/i.test(contentEncoding)) {
    return new NextResponse('Unsupported Content-Encoding: br is disabled for security', { status: 415 });
  }

  return await updateSession(request);
}

// Backwards compatibility alias
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
