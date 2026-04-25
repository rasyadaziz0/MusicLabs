import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Instance Invidious yang stabil — dengan fallback
const INVIDIOUS_INSTANCES = [
  "https://inv.tux.rs",
  "https://invidious.nerdvpn.de",
  "https://inv.thepixora.com",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Video ID kosong" }, { status: 400 });
  }

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`🔄 Mencoba instance: ${instance}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.log(`❌ Instance ${instance} gagal: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();

      if (!data.adaptiveFormats || !Array.isArray(data.adaptiveFormats)) {
        console.log(`❌ Instance ${instance} nggak kasih adaptiveFormats`);
        continue;
      }

      // Prioritas: M4A / audio/mp4 (paling stabil di semua browser + HP)
      // Fallback: format audio apapun yang ada
      const audioStream =
        data.adaptiveFormats.find(
          (f: any) => f.container === 'm4a' || (f.type && f.type.includes('audio/mp4'))
        ) ||
        data.adaptiveFormats.find(
          (f: any) => f.type && f.type.includes('audio')
        );

      if (!audioStream || !audioStream.url) {
        console.log(`❌ Instance ${instance} nggak punya stream audio yang cocok`);
        continue;
      }

      console.log(`✅ Dapet audio dari: ${instance} (${audioStream.type})`);

      // PROXY: Server kita yang download, terus stream ke browser
      const audioRes = await fetch(audioStream.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!audioRes.ok || !audioRes.body) {
        console.log(`❌ Gagal download stream dari ${instance}`);
        continue;
      }

      return new NextResponse(audioRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.warn(`⏳ Instance ${instance} timeout, lanjut...`);
      } else {
        console.error(`❌ Error di ${instance}:`, error?.message);
      }
      continue;
    }
  }

  return NextResponse.json(
    { error: "Gagal ngekstrak audio dari semua instance Invidious" },
    { status: 500 }
  );
}
