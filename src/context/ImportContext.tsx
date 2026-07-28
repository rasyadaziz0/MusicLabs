'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { gooeyToast as toast } from 'goey-toast';
import { supabase } from '@/lib/supabase/client';
import { PlaylistRepository } from '@/lib/supabase/repositories/PlaylistRepository';
import { searchSongs } from '@/lib/api/musicApi';
import { ScrapedPlaylist } from '@/lib/scrapers/types';

interface ImportContextType {
  isImporting: boolean;
  importProgress: number | null; // 0-100
  startImport: (scrapedResult: ScrapedPlaylist, userId: string) => Promise<void>;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);

  const startImport = async (scrapedResult: ScrapedPlaylist, userId: string) => {
    if (isImporting) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const repo = new PlaylistRepository(supabase);
      
      // 1. Create Playlist
      const newPlaylist = await repo.createPlaylist({
        userId,
        name: scrapedResult.name,
        coverUrl: scrapedResult.coverUrl,
      });

      let successCount = 0;
      const totalTracks = scrapedResult.tracks.length;

      // 2. Resolve and add tracks sequentially
      for (let i = 0; i < totalTracks; i++) {
        const track = scrapedResult.tracks[i];
        try {
          const query = `${track.title} ${track.artist}`.trim();
          const searchRes = await searchSongs(query, 1);
          const results = searchRes?.results || [];
          
          if (results.length > 0) {
            const bestMatch = results[0];
            await repo.addTrackToPlaylist(newPlaylist.id, bestMatch.id);
            successCount++;
          }
        } catch (err: any) {
          console.warn(`[Import] Failed to resolve track ${track.title}: ${err?.message || 'Unknown error'}`);
        }
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / totalTracks) * 100));

        // Delay anti rate-limit
        if (i < totalTracks - 1) {
          await new Promise(resolve => setTimeout(resolve, 2750));
        }
      }

      toast.success(`Import selesai! ${successCount}/${totalTracks} lagu berhasil dimasukkan ke "${scrapedResult.name}".`);
    } catch (err: any) {
      console.error('Save to library error:', err);
      toast.error('Gagal menyimpan playlist ke library: ' + err.message);
    } finally {
      // Set isImporting ke false duluan biar trigger animasi fade-out (opacity 0) di UI
      setIsImporting(false);
      // Tunggu setengah detik (durasi fade-out) baru reset progress ke 0
      await new Promise(resolve => setTimeout(resolve, 500));
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
