import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const proxyRes = await fetch(urlParam, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
      cache: 'no-store'
    });

    const contentType = proxyRes.headers.get('content-type') || 'audio/mpeg';
    const isM3U8 = contentType.includes('mpegurl') || urlParam.includes('.m3u8');

    if (isM3U8) {
      const text = await proxyRes.text();
      const baseUrl = new URL(urlParam);
      const lines = text.split('\n');
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        
        let absoluteUrl = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          absoluteUrl = new URL(trimmed, baseUrl).toString();
        }
        
        const proxyUrl = new URL(`${protocol}://${host}/api/radio/proxy`);
        proxyUrl.searchParams.set('url', absoluteUrl);
        return proxyUrl.toString();
      }).join('\n');
      
      return new Response(rewritten, {
        status: proxyRes.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        }
      });
    }

    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      }
    });
  } catch (err) {
    console.error('Radio proxy error:', err);
    return new Response('Proxy error', { status: 500 });
  }
}

