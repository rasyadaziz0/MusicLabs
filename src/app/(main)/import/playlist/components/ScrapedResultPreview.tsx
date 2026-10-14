'use client';

import { ScrapedPlaylist } from '@/types/services/scrapers';
import { Music, Loader2 } from 'lucide-react';

interface ScrapedResultPreviewProps {
  scrapedResult: ScrapedPlaylist;
  importProgress: number | null;
  onSave: () => void;
}

export default function ScrapedResultPreview({
  scrapedResult,
  importProgress,
  onSave
}: ScrapedResultPreviewProps) {
  const isImporting = importProgress !== null;

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 sm:p-5 space-y-4">
      {/* Playlist Header */}
      <div className="flex items-center gap-3.5">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
          {scrapedResult.coverUrl ? (
            <img
              src={scrapedResult.coverUrl}
              alt={scrapedResult.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={24} className="text-white/40" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-white truncate">{scrapedResult.name}</h3>
          <p className="text-xs text-white/50 mt-0.5">
            Sumber: <span className="capitalize">{scrapedResult.source}</span> • {scrapedResult.tracks.length} lagu
          </p>
        </div>
      </div>

      {/* Track List */}
      <div className="rounded-lg border border-white/5 bg-black/20 p-2 sm:p-3">
        <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-medium text-white/40 uppercase tracking-wider">
          <span>Lagu</span>
          <span>{scrapedResult.tracks.length} Tracks</span>
        </div>
        
        <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
          {scrapedResult.tracks.map((track, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors"
            >
              <span className="text-[11px] font-mono text-white/30 w-5 text-right shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-white/90 truncate">{track.title}</p>
                <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onSave}
          disabled={isImporting}
          className="w-full rounded-lg bg-[#FA243C] text-white font-semibold py-2.5 px-4 text-xs sm:text-sm hover:bg-[#FA243C]/90 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <Loader2 size={15} className="animate-spin text-white" />
              <span>Menyimpan ke Library ({importProgress}%)...</span>
            </>
          ) : (
            <span>Simpan ke Library</span>
          )}
        </button>

        {isImporting && (
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#FA243C] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
