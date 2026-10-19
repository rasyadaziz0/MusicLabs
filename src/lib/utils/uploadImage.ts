import { API_BASE } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

export async function uploadImage(
  file: File,
  folder: 'avatars' | 'banners' | 'playlists' = 'avatars',
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
    useWebWorker: false,
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

  // 1. Same-origin upload via /api/upload (Zero CORS, 100% reliable server-to-server R2 upload)
  try {
    const formData = new FormData();
    formData.append('file', finalFile);
    formData.append('folder', folder);
    if (playlistId) formData.append('playlistId', playlistId);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.publicUrl) return data.publicUrl;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('[uploadImage] /api/upload returned non-200:', res.status, errData);
    }
  } catch (err) {
    console.warn('[uploadImage] Same-origin /api/upload failed, trying fallback:', err);
  }

  // 2. Fallback to Express backend if needed
  const formData = new FormData();
  formData.append('file', finalFile);
  formData.append('folder', folder);
  if (playlistId) formData.append('playlistId', playlistId);

  const directRes = await fetch(`${API_BASE}/api/upload/direct`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (directRes.ok) {
    const directData = await directRes.json();
    return directData.publicUrl;
  }

  const errorData = await directRes.json().catch(() => ({}));
  throw new Error(errorData.error || 'Failed to upload image.');
}
