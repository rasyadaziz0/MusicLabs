'use client';

import Image from 'next/image';
import { Loader2, Heart, Ellipsis, Languages, MessageSquareQuote } from 'lucide-react';
import LyricsUI from '@/components/player/LyricsUI';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { useState, useRef } from 'react';

interface MobileLyricsModeProps {
  currentTrack: any;
  coverUrl: string | null;
  artistNames: string;
  isLiked: boolean;
  toggleLikeMutation: any;
  handleToggleLike: (e?: any) => void;
  lines: any[];
  activeIndex: number;
  isSynced: boolean;
  isLyricsLoading: boolean;
  mobileLyricsScrollRef: any;
  seek: (time: number) => void;
  currentTime: number;
  romanizations?: Map<number, string>;
  trackId: string | null;
}

export function MobileLyricsMode({
  currentTrack, coverUrl, artistNames, isLiked, toggleLikeMutation, handleToggleLike,
  lines, activeIndex, isSynced, isLyricsLoading, mobileLyricsScrollRef, seek, currentTime, romanizations, trackId
}: MobileLyricsModeProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isTransMenuOpen, setIsTransMenuOpen] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Mini header: artwork + info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 16, paddingBottom: 16,
        borderBottom: '0.5px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          position: 'relative', width: 44, height: 44,
          borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          background: '#1a1a2a',
        }}>
          {coverUrl && (
            <Image src={coverUrl} alt={currentTrack?.name || 'cover'} fill sizes="44px" style={{ objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack?.name || 'Now Playing'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {artistNames || 'Unknown Artist'}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
            className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-sm"
          >
            {toggleLikeMutation.isPending
              ? <Loader2 size={15} className="animate-spin text-white/80" />
              : <Heart size={15} fill={isLiked ? '#FA243C' : 'none'} className={isLiked ? "text-[#FA243C]" : "text-white/80"} strokeWidth={isLiked ? 0 : 2} />
            }
          </button>
          <div ref={moreMenuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }} 
              className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-sm"
            >
              <Ellipsis size={15} />
            </button>
            <TrackContextMenu
              track={currentTrack}
              isOpen={isMoreMenuOpen}
              position={null}
              onClose={() => setIsMoreMenuOpen(false)}
              showPlayerControls={true}
            />
          </div>
        </div>
      </div>

      {/* Lyrics container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <LyricsUI
          currentTrack={currentTrack}
          lines={lines}
          activeIndex={activeIndex}
          isSynced={isSynced}
          isLoading={isLyricsLoading}
          scrollRef={mobileLyricsScrollRef}
          onLineClick={(time, isPlaceholder) => {
            if (isSynced && !isPlaceholder) seek(time);
          }}
          hideHeader
          currentTime={currentTime}
          romanizations={showPronunciation ? romanizations : undefined}
          trackId={trackId}
        />

        {/* Apple Music Floating Lyrics Options Button (Photo 2) */}
        <div className="absolute bottom-4 left-3 z-40">
          {isTransMenuOpen && (
            <div className="absolute bottom-11 left-0 bg-[#253322]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl min-w-[210px] animate-in fade-in zoom-in-95 duration-150 mb-1.5">
              <button
                onClick={() => { setShowPronunciation(!showPronunciation); setIsTransMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 text-xs font-semibold text-white transition-colors text-left"
              >
                <Languages size={16} className="text-white/70" />
                <span>{showPronunciation ? 'Hide Pronunciation' : 'Show Pronunciation'}</span>
              </button>
              <button
                onClick={() => { setShowTranslation(!showTranslation); setIsTransMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 text-xs font-semibold text-white transition-colors text-left mt-0.5"
              >
                <MessageSquareQuote size={16} className="text-white/70" />
                <span>{showTranslation ? 'Hide Translation' : 'Show Translation'}</span>
              </button>
            </div>
          )}
          <button
            onClick={() => setIsTransMenuOpen(!isTransMenuOpen)}
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-black shadow-lg active:scale-90 transition-all hover:scale-105"
            title="Opsi Lirik"
          >
            <Languages size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </>
  );
}
