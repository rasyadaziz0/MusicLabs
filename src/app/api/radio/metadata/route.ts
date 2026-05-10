import { NextRequest, NextResponse } from 'next/server';

// ─── SSRF Protection ─────────────────────────────────────────────────────────
// Block requests to private/reserved IP ranges and non-http(s) schemes.
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,        // Loopback
  /^10\.\d+\.\d+\.\d+$/,          // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,   // RFC 1918
  /^192\.168\.\d+\.\d+$/,         // RFC 1918
  /^169\.254\.\d+\.\d+$/,         // Link-local / AWS metadata
  /^0\.0\.0\.0$/,
  /^\[::1?\]$/,                    // IPv6 loopback
  /^metadata\.google\.internal$/i,
  /^metadata\.internal$/i,
];

function isUrlSafe(raw: string): { safe: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { safe: false, error: 'Invalid URL format' };
  }

  // Only allow http and https schemes
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: 'Only http/https URLs are allowed' };
  }

  // Block private/reserved hostnames
  const hostname = parsed.hostname;
  if (BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname))) {
    return { safe: false, error: 'Blocked hostname' };
  }

  // Block any URL with credentials embedded (user:pass@host)
  if (parsed.username || parsed.password) {
    return { safe: false, error: 'URLs with credentials are not allowed' };
  }

  return { safe: true };
}

/**
 * GET /api/radio/metadata?url=<stream_url>
 *
 * Server-side proxy that connects to an Icecast/Shoutcast stream,
 * reads the ICY metadata headers to extract the "now playing" title,
 * and returns it as JSON.
 *
 * This avoids CORS issues since the browser can't read ICY headers directly.
 */
export async function GET(request: NextRequest) {
  const streamUrl = request.nextUrl.searchParams.get('url');
  if (!streamUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // SSRF guard — validate URL before fetching
  const urlCheck = isUrlSafe(streamUrl);
  if (!urlCheck.safe) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
  }

  try {
    // Request the stream with Icy-MetaData header to ask for inline metadata
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(streamUrl, {
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'Mozilla/5.0 (compatible; AcadMusicRadio/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Check for icy-metaint header — this tells us the interval between metadata blocks
    const metaint = parseInt(res.headers.get('icy-metaint') || '0', 10);

    if (!metaint || !res.body) {
      // No metadata support — try to get station name from icy-name header
      const icyName = res.headers.get('icy-name') || '';
      // Abort the stream since we only needed the headers
      controller.abort();
      return NextResponse.json({
        title: icyName || null,
        station: icyName || null,
      });
    }

    // Read just enough of the stream to get the first metadata block
    const reader = res.body.getReader();
    let bytesRead = 0;
    const chunks: Uint8Array[] = [];

    // Read until we've passed the first metaint boundary + some metadata
    const targetBytes = metaint + 4096; // metaint bytes of audio + up to 4KB of metadata
    while (bytesRead < targetBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      bytesRead += value.length;
    }

    // Cancel the stream — we have what we need
    reader.cancel().catch(() => {});
    controller.abort();

    // Combine all chunks
    const combined = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // The metadata block starts at `metaint` bytes
    if (combined.length <= metaint) {
      return NextResponse.json({ title: null, station: null });
    }

    // First byte after metaint is the length indicator (multiply by 16 for actual length)
    const metaLength = combined[metaint] * 16;
    if (metaLength === 0) {
      return NextResponse.json({ title: null, station: null });
    }

    // Extract the metadata string
    const metaStart = metaint + 1;
    const metaEnd = Math.min(metaStart + metaLength, combined.length);
    const metaBytes = combined.slice(metaStart, metaEnd);
    const metaString = new TextDecoder('utf-8', { fatal: false }).decode(metaBytes);

    // Parse StreamTitle from the metadata string
    // Format is typically: StreamTitle='Artist - Title';StreamUrl='...';
    const titleMatch = metaString.match(/StreamTitle='([^']*)'/);
    const title = titleMatch?.[1]?.trim() || null;

    return NextResponse.json({
      title,
      raw: metaString.replace(/\0+$/, ''),
    });
  } catch (err) {
    // If fetch times out or stream is unavailable, fail gracefully
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ title: null, error: 'Stream timeout' });
    }
    console.error('Radio metadata fetch error:', err);
    return NextResponse.json({ title: null, error: 'Failed to fetch metadata' });
  }
}
