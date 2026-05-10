# 🎵 Agent.md — Spotify Clone Music Web App

## Project Overview

A full-featured music streaming web app inspired by Spotify, dibangun dari scratch dengan backend sendiri (tanpa Spotify API). Mendukung playback background, realtime lyrics sync, playlist management per user, Google OAuth login, dan installable di HP sebagai PWA.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16+ (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| Music Backend API | YouTube Music-compatible API endpoint (`NEXT_PUBLIC_YTMUSIC_API_URL`) |
| Styling | Tailwind CSS |
| Animation | Framer Motion + GSAP |
| PWA | next-pwa / custom Service Worker |
| Audio Engine | Web Audio API + HTML5 Audio + Media Session API |

---

## Brand & Design System

### Color Palette


### Typography
- **Display/Heading**: `Syne` atau `Space Grotesk` — bold, modern
- **Body**: `DM Sans` atau `Manrope`
- **Monospace (timestamp/lirik)**: `JetBrains Mono`

### Design Language
- Dark, immersive, depth-heavy UI
- Glassmorphism pada player bar dan modal
- Gradient mesh background dengan warna palette di atas
- Smooth page transitions via Framer Motion (layout animations)
- Waveform / vinyl animations untuk now playing
- GSAP untuk entrance animation & scroll effects

---

## Music Backend API — YouTube Music (Compatible Endpoint)

> **Provider:** YouTube Music (official public API belum tersedia)
> **Base URL:** pakai `NEXT_PUBLIC_YTMUSIC_API_URL` (sementara bisa diarahkan ke `https://music.youtube.com` atau proxy sendiri)

Backend musik sekarang diasumsikan sebagai endpoint yang kompatibel dengan kontrak `/api/...` di app ini, tetapi sumber data diarahkan ke YouTube Music. Supabase hanya untuk data user-owned (playlist, likes, history).

### Endpoint Lengkap

#### 🔎 Search
```
GET /api/search?query={q}
GET /api/search/songs?query={q}&page={n}&limit={n}
GET /api/search/albums?query={q}&page={n}&limit={n}
GET /api/search/artists?query={q}&page={n}&limit={n}
GET /api/search/playlists?query={q}&page={n}&limit={n}
```

#### 🎵 Songs
```
GET /api/songs?id={songId}               → detail satu lagu by ID
GET /api/songs?link={youtubeMusicUrl}    → detail lagu by YouTube Music URL
GET /api/songs/{id}/suggestions          → lagu mirip / rekomendasi
GET /api/songs/{id}/lyrics               → lirik lagu (plain text, bukan LRC)
```

**Response shape utama (`Song`):**
```ts
interface Song {
  id: string;
  name: string;
  type: string;
  year: string;
  releaseDate: string | null;
  duration: number;          // detik
  label: string;
  explicitContent: boolean;
  playCount: number;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;               // YouTube Music permalink / canonical URL
  copyright: string;
  album: { id: string; name: string; url: string };
  artists: {
    primary: Artist[];
    featured: Artist[];
    all: Artist[];
  };
  image: ImageQuality[];     // [{ quality: '50x50'|'150x150'|'500x500', url: string }]
  downloadUrl: DownloadUrl[]; // [{ quality: '12kbps'|'48kbps'|'96kbps'|'160kbps'|'320kbps', url: string }]
}

interface DownloadUrl {
  quality: '12kbps' | '48kbps' | '96kbps' | '160kbps' | '320kbps';
  url: string; // URL langsung ke file audio (.mp4 / .mp3)
}
```

> **Audio URL:** Ambil dari `downloadUrl` array. Gunakan quality `'320kbps'` untuk kualitas terbaik. URL ini adalah direct link ke file audio yang bisa di-stream langsung via `<audio src={url}>`.

#### 💿 Albums
```
GET /api/albums?id={albumId}
GET /api/albums?link={youtubeMusicAlbumUrl}
```

#### 🎤 Artists
```
GET /api/artists?id={artistId}
GET /api/artists?link={youtubeMusicArtistUrl}
GET /api/artists/{id}/songs?page={n}&sortBy={popularity|latest|alphabetical}&sortOrder={asc|desc}
GET /api/artists/{id}/albums?page={n}&sortBy=...&sortOrder=...
```

#### 📋 Playlists (YouTube Music)
```
GET /api/playlists?id={playlistId}
GET /api/playlists?link={youtubeMusicPlaylistUrl}
```

#### 📻 Modules / Home Feed
```
GET /api/modules?language={hindi|english|punjabi|...}
```
Mengembalikan data home page: trending, charts, featured playlists, new releases — cocok untuk home screen.

### Implementasi `lib/api/musicApi.ts`

```ts
const BASE =
  process.env.NEXT_PUBLIC_YTMUSIC_API_URL
  || process.env.NEXT_PUBLIC_MUSIC_API_URL
  || '';

// Helper
async function apiFetch<T>(path: string): Promise<T> {
  if (!BASE) {
    throw new Error('Missing API base URL. Set NEXT_PUBLIC_YTMUSIC_API_URL in your environment.');
  }
  const baseUrl = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`API error: ${path}`);
  const json = await res.json();
  return json.data as T;
}

// Search
export const searchSongs   = (q: string, page = 1) =>
  apiFetch(`/api/search/songs?query=${encodeURIComponent(q)}&page=${page}&limit=20`);

export const searchAll     = (q: string) =>
  apiFetch(`/api/search?query=${encodeURIComponent(q)}`);

// Songs
export const getSong       = (id: string)  => apiFetch(`/api/songs?id=${id}`);
export const getSongLyrics = (id: string)  => apiFetch(`/api/songs/${id}/lyrics`);
export const getSuggestions= (id: string)  => apiFetch(`/api/songs/${id}/suggestions`);

// Albums & Artists
export const getAlbum      = (id: string)  => apiFetch(`/api/albums?id=${id}`);
export const getArtist     = (id: string)  => apiFetch(`/api/artists?id=${id}`);
export const getArtistSongs= (id: string, page = 1) =>
  apiFetch(`/api/artists/${id}/songs?page=${page}&sortBy=popularity&sortOrder=desc`);

// Home feed
export const getHomeFeed   = (lang = 'hindi') => apiFetch(`/api/modules?language=${lang}`);

// Playlist YouTube Music
export const getYoutubeMusicPlaylist = (id: string) => apiFetch(`/api/playlists?id=${id}`);

// Helper: ambil URL audio kualitas terbaik
export function getBestAudioUrl(song: Song): string {
  const urls = song.downloadUrl;
  const preferred = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  for (const quality of preferred) {
    const found = urls.find(u => u.quality === quality);
    if (found?.url) return found.url;
  }
  return urls[urls.length - 1]?.url ?? '';
}

// Helper: ambil cover art terbaik
export function getBestImageUrl(images: ImageQuality[]): string {
  return images.find(i => i.quality === '500x500')?.url
    ?? images.find(i => i.quality === '150x150')?.url
    ?? images[0]?.url ?? '';
}
```

### Audio Streaming

```ts
// Di PlayerContext — audio.src langsung dari downloadUrl
const audioUrl = getBestAudioUrl(track); // URL .mp4/.mp3 langsung
audioRef.current.src = audioUrl;
audioRef.current.play();
```

> **Catatan:** implementasi URL audio tergantung provider/proxy YouTube Music yang dipakai. Jangan asumsi URL permanen; re-fetch metadata kalau playback gagal.

### Lirik dari API vs Supabase

API ini punya endpoint lirik (`/api/songs/{id}/lyrics`) yang return **plain text biasa**, bukan LRC dengan timestamp. Artinya tidak bisa dipakai untuk sync realtime.

**Strategi lirik yang direkomendasikan:**
- Gunakan `/api/songs/{id}/lyrics` untuk cek `hasLyrics` dan ambil teks lagu sebagai fallback (tampil statis)
- Untuk **sync realtime**, tetap simpan LRC manual di Supabase tabel `track_lyrics` per `track_id`
- Di UI: kalau ada LRC di Supabase → tampil sync. Kalau tidak ada → tampil plain lyrics dari API (atau "No synced lyrics")

---



### 1. Authentication — Google OAuth via Supabase
- Login/Register dengan Google (Supabase Auth Provider)
- Session management otomatis via Supabase `onAuthStateChange`
- Protected routes dengan Next.js middleware
- User profile auto-created di tabel `profiles` via database trigger

### 2. Music Player (Global)
- **Persistent player bar** di bottom semua halaman
- Controls: Play/Pause, Prev, Next, Shuffle, Repeat (none / one / all)
- Seek bar dengan waktu berjalan
- Volume control + mute toggle
- Queue management (tambah ke queue, lihat urutan)
- Artwork dengan blur background effect

### 3. Background Play (PWA + Media Session API)
- Menggunakan **Media Session API** agar kontrol lagu muncul di lock screen / notification bar HP
- Service Worker untuk memastikan audio tetap jalan saat app diminimize
- Metadata lagu (judul, artis, artwork) ter-expose ke OS

```ts
// Contoh implementasi Media Session
navigator.mediaSession.metadata = new MediaMetadata({
  title: track.title,
  artist: track.artist,
  album: track.album,
  artwork: [{ src: track.cover_url, sizes: '512x512', type: 'image/jpeg' }]
});
navigator.mediaSession.setActionHandler('play', () => audioRef.current.play());
navigator.mediaSession.setActionHandler('pause', () => audioRef.current.pause());
navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
navigator.mediaSession.setActionHandler('nexttrack', handleNext);
```

### 4. Realtime Lyrics (Synchronized) — Format LRC

**Format yang dipilih: LRC** — alasan:
- Standard industry, banyak tools editor-nya (LRC Editor online, dsb)
- Gampang di-parse, ringan (plain text)
- Support per-baris sync yang cukup untuk UX bagus
- Bisa di-extend ke word-level kalau mau karaoke style nanti

**Cara simpan lirik:** Tambahkan field `lyrics_lrc TEXT` di tabel `tracks` di Supabase. Saat user play lagu, fetch lirik dari Supabase berdasarkan `track_id` yang didapat dari Music API (YouTube Music-compatible).

```
[ar: Nama Artis]
[ti: Judul Lagu]
[00:00.00] ♪ Intro instrumental
[00:12.00] Baris pertama lirik di sini
[00:15.50] Baris kedua mengalir dengan musik
[00:18.30] Terus mengikuti beat lagu
[00:24.00] Chorus dimulai dari sini
```

**Flow lengkap:**
1. User play track (data dari Music API, termasuk `track_id`)
2. Fetch `lyrics_lrc` dari Supabase table `track_lyrics` pakai `track_id`
3. Parse LRC string → `Array<{ time: number, text: string }>`
4. Subscribe ke `currentTime` dari `<audio>` element
5. Binary search untuk cari active line index
6. Scroll + highlight active line dengan Framer Motion

```ts
// lib/utils/lrcParser.ts
export interface LrcLine {
  time: number; // detik
  text: string;
}

export function parseLRC(lrc: string): LrcLine[] {
  const lines = lrc.split('\n');
  const result: LrcLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    if (!text || matches.length === 0) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, '0'));
      result.push({ time: minutes * 60 + seconds + ms / 1000, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}
```

**Tabel Supabase untuk lirik** (terpisah dari tracks agar modular):
```sql
CREATE TABLE track_lyrics (
  track_id TEXT PRIMARY KEY,  -- Song ID dari provider Music API (contoh: "3IoDK8qI")
  lyrics_lrc TEXT NOT NULL,   -- Format LRC dengan timestamp (bukan plain text)
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: public read, hanya admin yang bisa insert/update
```

> **Kenapa tidak pakai `/api/songs/{id}/lyrics` dari API?** Endpoint itu return **plain text tanpa timestamp**, jadi tidak bisa untuk sync realtime. LRC harus diinput manual ke Supabase. Untuk auto-populate, bisa pakai tools seperti [lrclib.net](https://lrclib.net) yang punya database LRC publik — fetch berdasarkan nama lagu + artis, simpan ke Supabase.

### Flow Lirik Lengkap
```ts
// hooks/useLyrics.ts
export function useLyrics(trackId: string | null, currentTime: number) {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!trackId) return;
    // 1. Coba fetch LRC dari Supabase
    supabase.from('track_lyrics').select('lyrics_lrc').eq('track_id', trackId).single()
      .then(({ data }) => {
        if (data?.lyrics_lrc) setLines(parseLRC(data.lyrics_lrc));
        else {
          // 2. Fallback: fetch plain lyrics dari YouTube Music API
          getSongLyrics(trackId).then(lyricsData => {
            // Tampil statis, tidak bisa sync
            setLines([{ time: 0, text: lyricsData?.lyrics ?? '' }]);
          });
        }
      });
  }, [trackId]);

  useEffect(() => {
    if (lines.length === 0) return;
    // Binary search active line
    let lo = 0, hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= currentTime) lo = mid;
      else hi = mid - 1;
    }
    setActiveIndex(lo);
  }, [currentTime, lines]);

  return { lines, activeIndex };
}
```


### 5. Playlist Management
- Create, rename, delete playlist milik user sendiri
- Tambah / hapus lagu dari playlist
- Reorder lagu via drag-and-drop (menggunakan `@dnd-kit/sortable`)
- Playlist cover auto-generated dari 4 artwork lagu pertama (collage)
- Public / private toggle per playlist

### 6. Music Discovery
- Home page: Featured tracks, New releases, Charts — dari `/api/modules?language=hindi`
- Search: lagu, artis, album via `/api/search/songs`, `/api/search/artists`, `/api/search/albums`
- Genre browsing via modules
- Artist page dengan discography dari `/api/artists/{id}/songs`
- Song suggestions dari `/api/songs/{id}/suggestions`

---

## Database Schema (Supabase)

> **Catatan penting:** Supabase **hanya** menyimpan data yang user-owned (playlist, liked tracks, history, profile). Data musik (tracks, albums, artists) diambil dari Music API (YouTube Music-compatible) — tidak perlu di-duplikasi ke Supabase.

```sql
-- Users (auto-created via Supabase Auth trigger)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-create profile saat user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Lirik (disimpan di Supabase, di-input manual/admin)
CREATE TABLE track_lyrics (
  track_id TEXT PRIMARY KEY,  -- ID dari Music API (string, bukan UUID)
  lyrics_lrc TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Playlist Tracks — simpan track_id (Music API) + posisi
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,     -- ID dari Music API
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Liked Tracks
CREATE TABLE liked_tracks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,     -- ID dari Music API
  liked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

-- Listening History
CREATE TABLE listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,     -- ID dari Music API
  played_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS)
```sql
-- Profiles: user hanya bisa update profil sendiri
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Playlists
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public playlists visible to all" ON playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users manage own playlists" ON playlists FOR ALL
  USING (auth.uid() = user_id);

-- Playlist tracks: ikut akses playlist
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Playlist tracks follow playlist access" ON playlist_tracks FOR SELECT
  USING (EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id AND (p.is_public OR auth.uid() = p.user_id)));
CREATE POLICY "Users manage own playlist tracks" ON playlist_tracks FOR ALL
  USING (EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id AND auth.uid() = p.user_id));

-- Liked tracks: private per user
ALTER TABLE liked_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own likes" ON liked_tracks FOR ALL USING (auth.uid() = user_id);

-- History: private per user
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON listening_history FOR ALL USING (auth.uid() = user_id);

-- Lyrics: public read, hanya bisa di-insert via service role (admin)
ALTER TABLE track_lyrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lyrics public read" ON track_lyrics FOR SELECT USING (true);
```


---

## Struktur Folder (Next.js App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          ← Sidebar + Player Bar wrapper
│   │   ├── page.tsx            ← Home / Discovery
│   │   ├── search/page.tsx
│   │   ├── library/page.tsx
│   │   ├── playlist/[id]/page.tsx
│   │   ├── artist/[id]/page.tsx
│   │   └── album/[id]/page.tsx
│   ├── api/
│   │   ├── tracks/route.ts
│   │   └── playlists/route.ts
│   └── layout.tsx              ← Root layout, PWA meta
├── components/
│   ├── player/
│   │   ├── PlayerBar.tsx       ← Bottom player
│   │   ├── NowPlaying.tsx      ← Expanded view
│   │   ├── LyricsView.tsx      ← Realtime lyrics
│   │   └── QueueView.tsx
│   ├── ui/
│   │   ├── TrackCard.tsx
│   │   ├── PlaylistCard.tsx
│   │   ├── ArtistCard.tsx
│   │   └── Button.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── Header.tsx
│   └── auth/
│       └── GoogleLoginButton.tsx
├── context/
│   ├── PlayerContext.tsx       ← Global audio state
│   └── AuthContext.tsx
├── hooks/
│   ├── usePlayer.ts
│   ├── useLyrics.ts            ← LRC parser + sync logic
│   ├── useQueue.ts
│   └── useMediaSession.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── api/
│   │   └── musicApi.ts         ← Semua fetch ke Music API (YouTube Music-compatible)
│   └── utils/
│       ├── lrcParser.ts
│       └── formatTime.ts
├── public/
│   ├── manifest.json           ← PWA manifest
│   ├── sw.js                   ← Service Worker
│   └── icons/                  ← PWA icons (512x512, 192x192, etc.)
└── middleware.ts               ← Auth route protection
```

---

## PWA Setup (Background Play Focus)

Tujuan utama PWA di sini: **installable di HP** + **audio tetap play saat HP dikunci / app di-minimize** via Media Session API. Offline tidak diperlukan.

### `manifest.json`
```json
{
  "name": "YourMusicApp",
  "short_name": "YourApp",
  "description": "Your personal music streaming app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080616",
  "theme_color": "#2F2FE4",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Service Worker — Minimal (Static Cache Only)
Karena offline tidak diperlukan, Service Worker cukup untuk cache static assets agar app bisa install dan load cepat:

```js
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [] // Tidak perlu audio caching
});
```

### Media Session API — Background Play

Di hook `useMediaSession.ts`:
```ts
export function useMediaSession(track: Track | null, audio: HTMLAudioElement | null) {
  useEffect(() => {
    if (!track || !audio || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist_name,
      album: track.album_title,
      artwork: [
        { src: track.cover_url, sizes: '96x96',   type: 'image/jpeg' },
        { src: track.cover_url, sizes: '128x128', type: 'image/jpeg' },
        { src: track.cover_url, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    navigator.mediaSession.setActionHandler('play',          () => audio.play());
    navigator.mediaSession.setActionHandler('pause',         () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
    navigator.mediaSession.setActionHandler('nexttrack',     handleNext);
    navigator.mediaSession.setActionHandler('seekto',        (d) => {
      if (d.seekTime != null) audio.currentTime = d.seekTime;
    });

    return () => {
      ['play','pause','previoustrack','nexttrack','seekto'].forEach(action =>
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, null)
      );
    };
  }, [track, audio]);
}
```

**Kenapa ini cukup untuk background play di HP?**
Browser mobile (Chrome Android, Safari iOS) akan tetap menjalankan audio dari `<audio>` element HTML selama ada Media Session terdaftar. User bisa kontrol dari notification bar atau lock screen tanpa perlu app tetap di foreground.



---

## Audio Engine & State Management

### PlayerContext
```ts
interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  isShuffled: boolean;
}
```

- Single `<audio>` element di-mount di root layout (tidak unmount saat navigasi)
- Context expose: `play(track)`, `pause()`, `seek(time)`, `setVolume()`, `addToQueue()`, `playNext()`, `playPrev()`
- `currentTime` di-update via `ontimeupdate` event → di-feed ke `useLyrics` hook

### useLyrics Hook
```ts
// Flow:
// 1. Fetch lrc string dari Supabase berdasarkan track.id
// 2. Parse LRC → array of { time: number, text: string }
// 3. Subscribe ke currentTime dari PlayerContext
// 4. Binary search untuk find active line index
// 5. Auto-scroll ke active line dengan smooth behavior
```

---

## Animasi

### Framer Motion
- Page transitions: `AnimatePresence` dengan slide/fade
- Player bar: slide-up entrance, expand ke full-screen with layout animation
- Track cards: hover scale + glow effect
- Lyrics: active line scale + opacity, inactive lines dimmed

### GSAP
- Home page hero section entrance (staggered)
- Artwork vinyl spin animation saat playing
- Waveform visualizer (opsional, via Web Audio API `AnalyserNode`)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side only (untuk admin insert lyrics)

# Music Backend (YouTube Music-compatible)
NEXT_PUBLIC_YTMUSIC_API_URL=https://music.youtube.com
NEXT_PUBLIC_MUSIC_API_URL=https://music.youtube.com

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Supabase Auth Config

Di Supabase Dashboard:
1. Authentication → Providers → Google → Enable
2. Tambahkan OAuth credentials dari Google Cloud Console
3. Redirect URL: `https://yourdomain.com/auth/callback`
4. Buat route `/app/auth/callback/route.ts` untuk handle token exchange

---

## Dependencies

pokoknya harus yang terbaru

```json
{
  "dependencies": {
    "next": "^16",
    "react": "^18",
    "@supabase/supabase-js": "^2.103.3",
    "@supabase/ssr": "^0.10.2",
    "framer-motion": "^11",
    "gsap": "^3.15",
    "@dnd-kit/core": "^6.3.1,",
    "@dnd-kit/sortable": "^7",
    "next-pwa": "^9.5.7",
    "tailwindcss": "^4.2"
  }
}
```

---

## Deployment Checklist

- [ ] Supabase project setup + jalankan SQL schema di atas
- [ ] RLS policies aktif untuk semua tabel
- [ ] Google OAuth configured di Supabase Dashboard + Google Cloud Console
- [ ] Redirect URL di Supabase Auth: `https://yourdomain.com/auth/callback`
- [ ] Music API CORS dikonfigurasi untuk domain frontend
- [ ] PWA manifest + icons tersedia di `/public`
- [ ] HTTPS aktif (wajib untuk PWA + Media Session API)
- [ ] `next-pwa` configured dan Service Worker ter-generate di build
- [ ] Test Media Session di Android Chrome (lock screen controls)
- [ ] Test install PWA di Android Chrome dan iOS Safari

---

## Catatan Penting untuk Agent

1. **Backend = YouTube Music-compatible API endpoint** — official public API belum tersedia, jadi gunakan proxy/provider yang mempertahankan kontrak endpoint app
2. **Audio URL** ada di `song.downloadUrl[]` — ambil quality `'320kbps'` bila tersedia. URL bisa expire, jangan di-cache permanen, re-fetch kalau 403
3. **Satu `<audio>` element global** — mount di root layout, jangan unmount saat navigasi antar halaman
4. **`track_id` adalah string dari Music API** (contoh: `"3IoDK8qI"`) — semua FK di Supabase pakai `TEXT`, bukan UUID
5. **Lirik sync (LRC)** harus diinput manual ke Supabase — API hanya punya plain text tanpa timestamp. Gunakan [lrclib.net](https://lrclib.net) API sebagai sumber LRC otomatis
6. **Lirik fallback**: kalau tidak ada LRC di Supabase, fetch plain lyrics dari `/api/songs/{id}/lyrics` dan tampil statis
7. **Home feed** dari `/api/modules?language=hindi` — ini return trending, charts, new releases sekaligus
8. **PWA harus HTTPS** — local dev pakai `localhost` (browser treat sebagai secure context)
9. **Media Session API** wajib ada feature detection: `if ('mediaSession' in navigator)`
10. **RLS di Supabase wajib** — semua tabel user-owned harus ada policy
11. **Response API selalu wrapped** dalam `{ data: ... }` — selalu akses `.data` dari response JSON
12. **Lirik bisa null** — handle gracefully di LyricsView (tampilkan "No lyrics available")
