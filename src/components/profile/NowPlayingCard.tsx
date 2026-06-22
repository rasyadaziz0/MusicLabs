'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Music2, Play, Loader2, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { getSong } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import toast from 'react-hot-toast';
import { useTranslation } from '@/context/LanguageContext';

interface PresenceData {
  track_id: string | null;
  track_name: string | null;
  artist_name: string | null;
  cover_url: string | null;
  updated_at: string;
}

// Only show presence if updated within the last 5 minutes
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

function isPresenceFresh(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() < STALE_THRESHOLD_MS;
}

/**
 * Shows what another user is currently listening to.
 * Fetches from `user_presence` table and auto-refreshes every 30s.
 */
export default function NowPlayingCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenuTrack, setContextMenuTrack] = useState<Song | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  const { playTrack } = usePlayer();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPresence = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('track_id, track_name, artist_name, cover_url, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mounted) return;

      if (data?.track_id && isPresenceFresh(data.updated_at)) {
        setPresence(data);
      } else {
        setPresence(null);
      }
    };

    fetchPresence();

    // Subscribe to realtime updates for this user's presence
    const channel = supabase
      .channel(`presence_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === 'DELETE' || !payload.new?.track_id) {
            setPresence(null);
          } else {
            setPresence(payload.new as PresenceData);
          }
        }
      )
      .subscribe();

    // Fallback polling every 60 seconds (in case realtime connection drops)
    const interval = setInterval(fetchPresence, 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handlePlayClick = async () => {
    if (!presence?.track_id || isLoading) return;
    
    setIsLoading(true);
    try {
      const song = await getSong(presence.track_id);
      playTrack(song);
    } catch (error) {
      console.error('Failed to fetch song:', error);
      toast.error('Gagal memutar lagu ini');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoreClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!presence?.track_id || isLoading) return;
    
    // Optimistically open menu at pointer, but we need the track first
    const rect = menuButtonRef.current?.getBoundingClientRect();
    const pos = rect ? { x: rect.left, y: rect.bottom + 8 } : { x: e.clientX, y: e.clientY };
    
    setIsLoading(true);
    try {
      const song = await getSong(presence.track_id);
      setContextMenuTrack(song);
      setMenuPosition(pos);
    } catch (error) {
      console.error('Failed to fetch song for menu:', error);
      toast.error('Gagal memuat detail lagu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {presence && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onClick={handlePlayClick}
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] backdrop-blur-lg max-w-sm mx-auto mt-4 cursor-pointer transition-all shadow-lg hover:shadow-xl relative"
          >
            {/* Artwork */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              {presence.cover_url ? (
                <Image
                  src={presence.cover_url}
                  alt={presence.track_name || ''}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={18} className="text-white/20" />
                </div>
              )}
              
              {/* Play / Loading Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {isLoading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <Play size={20} className="text-white fill-white translate-x-[1px]" />
                )}
              </div>

              {/* Animated equalizer bars (hidden on hover so Play icon shows) */}
              <div className="absolute bottom-1 right-1 flex items-end gap-[2px] opacity-100 group-hover:opacity-0 transition-opacity bg-black/40 p-1 rounded-md backdrop-blur-sm">
                <span className="w-[3px] bg-[#FA243C] rounded-full animate-eq-1" style={{ height: 8 }} />
                <span className="w-[3px] bg-[#FA243C] rounded-full animate-eq-2" style={{ height: 12 }} />
                <span className="w-[3px] bg-[#FA243C] rounded-full animate-eq-3" style={{ height: 6 }} />
              </div>
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1 pr-6">
              <p className="text-[10px] font-semibold text-[#FA243C] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                {t('profile.now_playing')}
              </p>
              <p className="text-[14px] font-semibold text-white truncate leading-tight group-hover:text-[#FA243C] transition-colors">
                {presence.track_name}
              </p>
              <p className="text-[12px] text-white/40 truncate mt-0.5">
                {presence.artist_name}
              </p>
            </div>

            {/* Context Menu Button */}
            <button
              ref={menuButtonRef}
              onClick={handleMoreClick}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <TrackContextMenu
        track={contextMenuTrack}
        isOpen={!!menuPosition}
        position={menuPosition}
        onClose={() => {
          setMenuPosition(null);
          setTimeout(() => setContextMenuTrack(null), 200);
        }}
      />
    </>
  );
}
