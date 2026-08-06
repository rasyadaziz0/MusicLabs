'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gooeyToast as toast } from 'goey-toast';
import { supabase } from '@/lib/supabase/client';
import { PlaylistRepository } from '@/lib/supabase/repositories/PlaylistRepository';
import { ScrapedPlaylist } from '@/types/services/scrapers';
import { useAuth } from './AuthContext';

interface ImportContextType {
  isImporting: boolean;
  importProgress: number | null; // 0-100
  startImport: (scrapedResult: ScrapedPlaylist, userId: string) => Promise<void>;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // On mount or when user changes, check for existing processing jobs
  useEffect(() => {
    if (!user) return;

    const checkActiveJob = async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setIsImporting(true);
        if (data.total_tracks > 0) {
          setImportProgress(Math.round((data.processed_tracks / data.total_tracks) * 100));
        } else {
          setImportProgress(0);
        }
      }
    };

    checkActiveJob();

    // Subscribe to realtime updates for import_jobs
    const channel = supabase.channel('import-jobs-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'import_jobs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRecord = payload.new as any;
          if (newRecord.status === 'processing') {
            setIsImporting(true);
            if (newRecord.total_tracks > 0) {
              setImportProgress(Math.round((newRecord.processed_tracks / newRecord.total_tracks) * 100));
            }
          } else if (newRecord.status === 'completed') {
            toast.success(`Import selesai! ${newRecord.success_tracks}/${newRecord.total_tracks} lagu berhasil dimasukkan.`);
            queryClient.invalidateQueries({ queryKey: ['library-playlists', user.id] });
            
            // Fade out progress
            setIsImporting(false);
            setTimeout(() => setImportProgress(null), 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);


  const startImport = async (scrapedResult: ScrapedPlaylist, userId: string) => {
    if (isImporting) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const repo = new PlaylistRepository(supabase);
      
      // 1. Create Playlist (from frontend, so RLS uses the user's session)
      const newPlaylist = await repo.createPlaylist({
        userId,
        name: scrapedResult.name,
        coverUrl: scrapedResult.coverUrl,
      });

      // 2. Get user's access token for backend auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
      }

      // 3. Send tracks to backend for background processing
      const res = await fetch(`${(process.env.NEXT_PUBLIC_MUSIC_API_URL || process.env.NEXT_PUBLIC_YTMUSIC_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL) || ''}/api/import/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          playlistId: newPlaylist.id,
          tracks: scrapedResult.tracks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memulai proses impor.');
      }

      toast.success(
        `Import "${scrapedResult.name}" (${scrapedResult.tracks.length} lagu) sedang diproses di latar belakang. Lagu akan muncul secara bertahap di playlist-mu.`
      );
      // Let the realtime subscription handle the progress UI from now on
    } catch (err: any) {
      console.error('Save to library error:', err);
      toast.error('Gagal menyimpan playlist ke library: ' + err.message);
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <ImportContext.Provider value={{ isImporting, importProgress, startImport }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error('useImport must be used within an ImportProvider');
  }
  return context;
}
