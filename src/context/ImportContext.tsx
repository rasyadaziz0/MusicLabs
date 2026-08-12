'use client';

import { ImportService } from '@/lib/services/ImportService';
import { supabase } from '@/lib/supabase/client';
import { ScrapedPlaylist } from '@/types/services/scrapers';
import { useQueryClient } from '@tanstack/react-query';
import { gooeyToast as toast } from 'goey-toast';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

import { ImportContextType } from '@/types/context/import';

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const importService = ImportService.getInstance();

  // On mount or when user changes, check for existing processing jobs
  useEffect(() => {
    if (!user) return;

    const checkActiveJob = async () => {
      const data = await importService.checkActiveJob(user.id);
      if (data) {
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
      await importService.startImport(scrapedResult, userId);
      // Let the realtime subscription handle the progress UI from now on
    } catch (err: any) {
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
