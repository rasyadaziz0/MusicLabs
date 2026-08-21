import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let isMaintenance = false;
  let flagLoadedFromDb = false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      // Pake official Supabase client (code SDK)
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Read-only in this context
          },
        },
        global: {
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              // BEST PRACTICE: Cache hasil DB selama 60 detik di level Edge 
              // biar website tetep ngebut dan gak nembak DB tiap user klik halaman.
              next: { revalidate: 60 },
            });
          },
        },
      });

      const { data, error } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('id', 'feature_maintenance')
        .single();

      if (!error && data) {
        isMaintenance = data.is_enabled;
        flagLoadedFromDb = true;
      }
    }
  } catch (error) {
    // Silent fallback
  }

  // Fallback to env var if flag is not set/found/error in DB
  if (!flagLoadedFromDb && process.env.MAINTENANCE_MODE === 'true') {
    isMaintenance = true;
  }

  if (isMaintenance) {
    // Biar gak infinite loop kalo udah di halaman maintenance, dan biarkan user akses /status
    if (request.nextUrl.pathname === '/maintenance' || request.nextUrl.pathname === '/status') {
      return NextResponse.next();
    }
    
    // Redirect semua trafik halaman (kecuali aset statis) ke halaman maintenance
    return NextResponse.rewrite(new URL('/maintenance', request.url));
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
     * - public files (like robots.txt, sitemap.xml, images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.xml$|.*\\.txt$|.*\\.html$|.*\\.json$).*)',
  ],
};
