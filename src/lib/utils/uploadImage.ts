import { API_BASE } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

export async function uploadImage(
  file: File,
  folder: 'avatars' | 'banners' | 'playlists' | 'uploads' = 'uploads',
  playlistId?: string
): Promise<string> {
  const { data: { session } } = await createClient().auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('You must be logged in to upload files');
  }

  // 0. Compress and convert to WEBP
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
  };
  
  let finalFile = file;
  if (file.type.startsWith('image/')) {
    try {
      const compressedBlob = await imageCompression(file, options);
      // Create a new File object with .webp extension
      const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
      finalFile = new File([compressedBlob], newName, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    } catch (error) {
      console.warn('Image compression failed, falling back to original file', error);
    }
  }

  // 1. Request presigned URL from backend
  const extension = finalFile.name.split('.').pop()?.toLowerCase() || '';
  
  const presignRes = await fetch(`${API_BASE}/api/upload/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      folder,
      extension,
      contentType: finalFile.type,
    }),
  });

  if (!presignRes.ok) {
    const errorData = await presignRes.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to initialize upload');
  }

  const { uploadUrl, pendingKey } = await presignRes.json();

  // 2. Upload file directly to S3/R2 via Presigned URL (bypass server)
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': finalFile.type,
    },
    body: finalFile, // Raw file, not FormData
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload file to storage');
  }

  // 3. Verify magic bytes and promote file to permanent storage
  const verifyRes = await fetch(`${API_BASE}/api/upload/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      pendingKey,
      folder,
      playlistId, // Used by backend for cleanup of old playlist cover
    }),
  });

  if (!verifyRes.ok) {
    const errorData = await verifyRes.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to verify uploaded file');
  }

  const data = await verifyRes.json();
  return data.publicUrl;
}
