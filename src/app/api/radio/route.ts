import { NextResponse } from 'next/server';

const FALLBACK_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

let cachedServer = '';
let lastServerFetch = 0;

async function getRadioServer(): Promise<string> {
  const now = Date.now();
  // Cache server for 1 hour
  if (cachedServer && now - lastServerFetch < 3600000) {
    return cachedServer;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://all.api.radio-browser.info/json/servers', {
      signal: controller.signal,
      headers: { 'User-Agent': 'MusicLabs/1.0', Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const servers = await res.json();
      if (Array.isArray(servers) && servers.length > 0) {
        const randomServer = servers[Math.floor(Math.random() * servers.length)];
        cachedServer = `https://${randomServer.name}`;
        lastServerFetch = now;
        return cachedServer;
      }
    }
  } catch {
    // Fall through to fallback list
  }

  // Pick random fallback server
  cachedServer = FALLBACK_SERVERS[Math.floor(Math.random() * FALLBACK_SERVERS.length)];
  lastServerFetch = now;
  return cachedServer;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'search';
  const countryCode = searchParams.get('countrycode') || 'ID';
  const query = searchParams.get('query') || '';
  const tag = searchParams.get('tag') || '';
  const limit = searchParams.get('limit') || '50';
  const offset = searchParams.get('offset') || '0';

  const baseUrl = await getRadioServer();
  let targetUrl: URL;

  if (action === 'byname' && query) {
    targetUrl = new URL(`${baseUrl}/json/stations/byname/${encodeURIComponent(query)}`);
    targetUrl.searchParams.set('limit', limit);
    targetUrl.searchParams.set('order', 'votes');
    targetUrl.searchParams.set('reverse', 'true');
    targetUrl.searchParams.set('hidebroken', 'true');
  } else if (action === 'bytag' && tag) {
    targetUrl = new URL(`${baseUrl}/json/stations/bytag/${encodeURIComponent(tag)}`);
    targetUrl.searchParams.set('limit', limit);
    targetUrl.searchParams.set('order', 'votes');
    targetUrl.searchParams.set('reverse', 'true');
    targetUrl.searchParams.set('hidebroken', 'true');
  } else if (action === 'top') {
    targetUrl = new URL(`${baseUrl}/json/stations/topvote/${limit}`);
    targetUrl.searchParams.set('hidebroken', 'true');
  } else {
    // Default country search
    targetUrl = new URL(`${baseUrl}/json/stations/search`);
    targetUrl.searchParams.set('countrycode', countryCode);
    targetUrl.searchParams.set('limit', limit);
    targetUrl.searchParams.set('offset', offset);
    targetUrl.searchParams.set('order', 'votes');
    targetUrl.searchParams.set('reverse', 'true');
    targetUrl.searchParams.set('hidebroken', 'true');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MusicLabs/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 600 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Radio API responded with status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Radio proxy error:', error);
    // Return empty array with 200 instead of 500 so UI doesn't crash
    return NextResponse.json([], { status: 200 });
  }
}
