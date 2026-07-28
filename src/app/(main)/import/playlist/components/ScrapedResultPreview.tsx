import React from 'react';
import { ScrapedPlaylist } from '@/lib/scrapers/types';

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
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        {scrapedResult.coverUrl && (
          <img src={scrapedResult.coverUrl} alt="Cover" className="w-20 h-20 rounded-xl object-cover" />
        )}
        <div>
          <h3 className="text-lg font-bold text-white">{scrapedResult.name}</h3>
          <p className="text-sm text-muted capitalize">Source: {scrapedResult.source} • {scrapedResult.tracks.length} Tracks</p>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
        {scrapedResult.tracks.map((track, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
            <div className="flex items-center gap-3 truncate">
              <span className="text-xs text-muted w-4">{i + 1}</span>
              <div className="truncate">
                <p className="text-sm text-white truncate">{track.title}</p>
                <p className="text-xs text-muted truncate">{track.artist}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <button
          onClick={onSave}
          disabled={importProgress !== null}
          className="w-full rounded-full bg-white text-black font-bold py-3 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importProgress !== null ? `Matching and Saving... ${importProgress}%` : 'Save to Library'}
        </button>
        {importProgress !== null && (
          <div className="w-full bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-[#FA243C] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
