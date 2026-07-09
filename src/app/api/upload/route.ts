import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { r2Client } from '@/lib/r2';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';

// Force Node.js runtime — sharp requires native binaries, incompatible with Edge
export const runtime = 'nodejs';

// Folder → DB column mapping for old-file cleanup
const FOLDER_TO_DB_COLUMN: Record<string, { table: string; column: string; idColumn: string }> = {
  avatars: { table: 'profiles', column: 'avatar_url', idColumn: 'id' },
  banners: { table: 'profiles', column: 'banner_url', idColumn: 'id' },
  playlists: { table: 'playlists', column: 'cover_url', idColumn: 'id' },
};

/**
 * Extract the R2 object key from a full public URL.
 * E.g. "https://r2.example.com/avatars/abc_123_xyz.webp" → "avatars/abc_123_xyz.webp"
 */
function extractR2Key(publicUrl: string): string | null {
  try {
    const devUrl = process.env.NEXT_PUBLIC_R2_DEV_URL;
    const knownPrefixes = [
      devUrl,
      'https://img.rasyadazizan.site',
      'https://pub-a5593a1c76374ad6bcfeed25f8cd6e01.r2.dev',
    ].filter(Boolean) as string[];

    for (const prefix of knownPrefixes) {
      const baseUrl = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
      if (publicUrl.startsWith(baseUrl)) {
        const key = publicUrl.slice(baseUrl.length + 1); // +1 for the "/"
        if (key && !key.includes('..')) {
          return key;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── 0. Pre-auth IP Rate Limit (coarse — prevents anonymous flood) ──
    const ip = getRequestIp(req);
    const ipRateLimit = await checkRateLimit(ip, {
      limit: 20,
      windowMs: 60_000,
      keyPrefix: 'upload_ip',
    });

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests from this network. Please try again later.' },
        { status: 429, headers: { 'Retry-After': ipRateLimit.resetInSeconds.toString() } }
      );
    }

    // ── 1. Authenticate user via Supabase (server-side JWT validation) ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Post-auth User Rate Limit (strict — per account) ──
    const userRateLimit = await checkRateLimit(user.id, {
      limit: 10,
      windowMs: 60_000,
      keyPrefix: 'upload_user',
    });

    if (!userRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Upload limit reached. Please wait before uploading again.' },
        { status: 429, headers: { 'Retry-After': userRateLimit.resetInSeconds.toString() } }
      );
    }

    // ── 3. Parse FormData ──
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';
    const playlistId = formData.get('playlistId') as string | null; // For playlist cover cleanup

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── 4. Validate file size (4MB — Vercel body limit is ~4.5MB) ──
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 4MB limit' }, { status: 400 });
    }

    // ── 5. Validate mime type (defense-in-depth, magic bytes is the real gate) ──
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (file.type && !validMimeTypes.includes(file.type)) {
      console.warn(`[UPLOAD] Rejected invalid mime type: ${file.type}`);
      return NextResponse.json(
        { error: `Invalid file type (${file.type}). Only JPG, PNG, WEBP, and GIF are allowed.` },
        { status: 400 }
      );
    }

    // ── 6. Validate extension ──
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!validExtensions.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 });
    }

    // ── 7. Validate folder ──
    const validFolders = ['avatars', 'banners', 'playlists', 'uploads'];
    if (!validFolders.includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    // ── 8. Read buffer ──
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 9. Magic Bytes Validation (the real gate — prevents fake images) ──
    const header = buffer.subarray(0, 4).toString('hex').toUpperCase();
    let isRealImage = false;

    if (header.startsWith('FFD8FF')) isRealImage = true; // JPEG
    else if (header === '89504E47') isRealImage = true;  // PNG
    else if (header.startsWith('47494638')) isRealImage = true; // GIF (GIF8)
    else if (
      buffer.subarray(0, 4).toString('utf-8') === 'RIFF' &&
      buffer.length >= 12 &&
      buffer.subarray(8, 12).toString('utf-8') === 'WEBP'
    ) {
      isRealImage = true; // WEBP
    }

    if (!isRealImage) {
      console.warn(`[SECURITY] User ${user.id} attempted to upload a fake image.`);
      return NextResponse.json({ error: 'Malicious payload detected. Fake image rejected.' }, { status: 400 });
    }

    // ── 10. Re-encode to WebP via Sharp ──
    // This simultaneously: (a) compresses, (b) strips EXIF/GPS metadata,
    // (c) neutralizes polyglot payloads (real image with embedded HTML/JS)
    const resizeCaps: Record<string, number> = {
      avatars: 512,
      banners: 1600,
      playlists: 1000,
      uploads: 2048,
    };
    const maxDim = resizeCaps[folder] || 2048;

    const webpBuffer = await sharp(buffer, { animated: true })
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    // ── 11. Generate unique filename ──
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${folder}/${user.id}_${timestamp}_${randomString}.webp`;

    // ── 12. Upload re-encoded WebP to R2 (BEFORE deleting old file) ──
    const bucketName = process.env.R2_BUCKET_NAME!;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: webpBuffer,
        ContentType: 'image/webp',
      })
    );

    // ── 13. Delete old file from R2 AFTER upload succeeds ──
    // Server reads old URL from DB (NOT from client) to prevent IDOR
    const mapping = FOLDER_TO_DB_COLUMN[folder];

    if (mapping) {
      try {
        let oldUrl: string | null = null;

        if (folder === 'playlists' && playlistId) {
          // For playlists: read cover_url from playlist (RLS ensures ownership)
          const { data } = await supabase
            .from(mapping.table)
            .select(mapping.column)
            .eq(mapping.idColumn, playlistId)
            .eq('user_id', user.id) // Extra ownership guard on top of RLS
            .maybeSingle();
          oldUrl = data?.[mapping.column] || null;
        } else if (folder === 'avatars' || folder === 'banners') {
          // For profile images: read from profiles (id = user.id)
          const { data } = await supabase
            .from(mapping.table)
            .select(mapping.column)
            .eq(mapping.idColumn, user.id)
            .maybeSingle();
          oldUrl = data?.[mapping.column] || null;
        }

        if (oldUrl) {
          const oldKey = extractR2Key(oldUrl);
          // Safety: only delete if key belongs to this user (contains user.id prefix)
          if (oldKey && oldKey.includes(`/${user.id}_`)) {
            await r2Client.send(
              new DeleteObjectCommand({ Bucket: bucketName, Key: oldKey })
            );
          }
        }
      } catch (deleteErr) {
        // Non-fatal: log but don't block — new file is already uploaded
        console.warn('[UPLOAD] Failed to delete old file:', deleteErr);
      }
    }

    // ── 14. Return public URL ──
    const devUrl = process.env.NEXT_PUBLIC_R2_DEV_URL!;
    const baseUrl = devUrl.endsWith('/') ? devUrl.slice(0, -1) : devUrl;
    const publicUrl = `${baseUrl}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
