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

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}
