import { NextRequest } from 'next/server';
import http from 'http';
import https from 'https';
import { parse } from 'url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return new Response('Missing url parameter', { status: 400 });
  }

  const parsedUrl = parse(urlParam);
  const requestModule = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
  };

  return new Promise<Response>((resolve) => {
    const proxyReq = requestModule.get(urlParam, options, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || 'audio/mpeg';
      const isM3U8 = contentType.includes('mpegurl') || urlParam.includes('.m3u8');

      if (isM3U8) {
        let body = '';
        proxyRes.on('data', chunk => { body += chunk; });
        proxyRes.on('end', () => {
          const baseUrl = new URL(urlParam);
          const lines = body.split('\n');
          
          const rewritten = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return line;
            
            let absoluteUrl = trimmed;
            if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
              absoluteUrl = new URL(trimmed, baseUrl).toString();
            }
            
            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = req.headers.get('x-forwarded-proto') || 'http';
            const proxyUrl = new URL(`${protocol}://${host}/api/radio/proxy`);
            proxyUrl.searchParams.set('url', absoluteUrl);
            return proxyUrl.toString();
          }).join('\n');
          
          resolve(new Response(rewritten, {
            status: proxyRes.statusCode || 200,
            headers: {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache',
            }
          }));
        });
      } else {
        // Create a Web ReadableStream to manually pipe the audio back to the client
        // This bypasses Node.js `fetch` buffering limits while still using the App Router!
        const stream = new ReadableStream({
          start(controller) {
            proxyRes.on('data', chunk => controller.enqueue(chunk));
            proxyRes.on('end', () => controller.close());
            proxyRes.on('error', err => controller.error(err));
          },
          cancel() {
            proxyReq.destroy();
          }
        });

        resolve(new Response(stream, {
          status: proxyRes.statusCode || 200,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked'
          }
        }));
      }
    });

    proxyReq.on('error', (err) => {
      console.error('Radio proxy error:', err);
      resolve(new Response('Proxy error', { status: 500 }));
    });
    
    // Cleanup if client aborts early
    req.signal.addEventListener('abort', () => {
      proxyReq.destroy();
    });
  });
}
