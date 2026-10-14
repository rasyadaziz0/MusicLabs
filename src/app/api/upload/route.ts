import { NextRequest, NextResponse } from 'next/server';
import { getR2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validFolders = ['avatars', 'banners', 'playlists', 'uploads'];
    if (!validFolders.includes(folder)) {
      return NextResponse.json({ error: `Invalid folder: ${folder}` }, { status: 400 });
    }

    // 2. Prepare file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Generate permanent key in R2
    const extension = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const key = `${folder}/${user.id}_${timestamp}_${randomString}.${extension}`;

    // 4. Send directly to Cloudflare R2 via AWS SDK (no browser CORS preflight!)
    const bucketName = process.env.R2_BUCKET_NAME || 'acadmusic-img';
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'image/webp',
      })
    );

    const devUrl = process.env.NEXT_PUBLIC_R2_DEV_URL || 'https://img.rasyadazizan.site';
    const publicBaseUrl = devUrl.endsWith('/') ? devUrl.slice(0, -1) : devUrl;
    const publicUrl = `${publicBaseUrl}/${key}`;

    return NextResponse.json({ publicUrl });
  } catch (err: any) {
    console.error('[API /api/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload' }, { status: 500 });
  }
}
