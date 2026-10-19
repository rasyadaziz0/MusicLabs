import { NextRequest, NextResponse } from 'next/server';
import { getR2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting (max 15 uploads per minute per user/IP)
const uploadRateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_UPLOADS_PER_WINDOW = 15;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (memungkinkan foto kamera resolusi tinggi)

function checkUploadRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = uploadRateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    uploadRateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= MAX_UPLOADS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    let user: any = null;
    const authHeader = req.headers.get('authorization');

    // 1. Authenticate via Bearer token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

      if (serviceKey) {
        try {
          const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
          const adminClient = createSupabaseClient(supabaseUrl, serviceKey);
          const { data } = await adminClient.auth.getUser(token);
          if (data?.user) user = data.user;
        } catch (e) {
          console.warn('[upload] Token validation with service key failed:', e);
        }
      }

      if (!user) {
        try {
          const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
          const anonClient = createSupabaseClient(supabaseUrl, anonKey);
          const { data } = await anonClient.auth.getUser(token);
          if (data?.user) user = data.user;
        } catch (e) {
          console.warn('[upload] Token validation with anon key failed:', e);
        }
      }
    }

    // 2. Fallback to cookies
    if (!user) {
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  );
                } catch {}
              },
            },
          }
        );
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
      } catch (e) {
        console.warn('[upload] Cookie validation failed:', e);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: max 15 uploads per minute per user
    const clientIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = user.id || clientIp;
    if (!checkUploadRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan upload. Silakan tunggu sebentar.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'avatars';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validFolders = ['avatars', 'banners', 'playlists'];
    if (!validFolders.includes(folder)) {
      return NextResponse.json({ error: `Invalid folder: ${folder}` }, { status: 400 });
    }

    // Enforce file size limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar (maksimal 10MB)' }, { status: 413 });
    }

    // 2. Prepare file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar (maksimal 10MB)' }, { status: 413 });
    }

    // Tolak file teks / SVG script untuk mencegah stored XSS
    const sampleHeader = buffer.subarray(0, 100).toString('utf-8').trim().toLowerCase();
    if (sampleHeader.startsWith('<svg') || sampleHeader.startsWith('<?xml') || sampleHeader.includes('<svg')) {
      return NextResponse.json(
        { error: 'Format file SVG tidak diizinkan. Harap unggah file foto (JPEG, PNG, WebP, dll).' },
        { status: 400 }
      );
    }

    // 3. Konversi format foto apapun menjadi WebP berkualitas tinggi via Sharp
    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(buffer)
        .rotate() // Otomatis koreksi orientasi EXIF (misal foto kamera HP)
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
    } catch (err: any) {
      console.warn('[upload] Sharp failed to decode/convert image:', err.message);
      return NextResponse.json(
        { error: 'File tidak valid atau format foto tidak didukung. Harap unggah file foto yang valid (JPEG, PNG, WebP, HEIC, TIFF, GIF).' },
        { status: 400 }
      );
    }

    // 4. Generate permanent key in R2 with .webp extension
    const timestamp = Date.now();
    const randomString = randomUUID().replace(/-/g, '').slice(0, 16);
    const key = `${folder}/${user.id}_${timestamp}_${randomString}.webp`;

    // 5. Send directly to Cloudflare R2 with image/webp
    const bucketName = process.env.R2_BUCKET_NAME || 'acadmusic-img';
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: webpBuffer,
        ContentType: 'image/webp',
      })
    );

    const devUrl = process.env.NEXT_PUBLIC_R2_DEV_URL || 'https://img.rasyadazizan.site';
    const publicBaseUrl = devUrl.endsWith('/') ? devUrl.slice(0, -1) : devUrl;
    const publicUrl = `${publicBaseUrl}/${key}`;

    return NextResponse.json({ publicUrl });
  } catch (err: any) {
    console.error('[API /api/upload] Error:', err);
    return NextResponse.json({ error: 'Gagal mengunggah file.' }, { status: 500 });
  }
}
