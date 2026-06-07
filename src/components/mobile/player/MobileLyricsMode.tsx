'use client';

import Image from 'next/image';
import { Loader2, Heart } from 'lucide-react';
import LyricsUI from '@/components/player/LyricsUI';
import { MoreMenu } from '@/components/player/NowPlayingUI';

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
  nowPlayingProps: any; // The original props from MobileNowPlayingUI to pass to MoreMenu
}

export function MobileLyricsMode({
  currentTrack, coverUrl, artistNames, isLiked, toggleLikeMutation, handleToggleLike,
  lines, activeIndex, isSynced, isLyricsLoading, mobileLyricsScrollRef, seek, currentTime, romanizations,
  nowPlayingProps
}: MobileLyricsModeProps) {
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {coverUrl && <Image src={coverUrl} alt={currentTrack.name} fill sizes="300px" style={{ objectFit: 'cover' }} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 15, fontWeight: 600, color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.2px',
          }}>
            {currentTrack.name}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginTop: 1,
          }}>
            {artistNames}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: isLiked ? '#FA243C' : 'rgba(255,255,255,0.5)',
              display: 'flex',
            }}
          >
            {toggleLikeMutation.isPending
              ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              : <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            }
          </button>
          <MoreMenu {...nowPlayingProps} openMenuUpward={false} />
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
          romanizations={romanizations}
        />
      </div>
    </>
  );
}
