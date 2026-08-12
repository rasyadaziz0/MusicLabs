import { API_BASE } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';

export async function uploadImage(
  file: File,
  folder: 'avatars' | 'banners' | 'playlists' | 'uploads' = 'uploads',
  playlistId?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // For playlist covers: server needs the playlist ID to look up
  // the old cover_url in the DB (for cleanup). No raw URLs from client.
  if (playlistId) {
    formData.append('playlistId', playlistId);
  }

  const { data: { session } } = await createClient().auth.getSession();

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}
