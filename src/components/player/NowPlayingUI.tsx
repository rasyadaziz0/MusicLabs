'use client';

import React, { useState, useEffect } from 'react';
import { Ellipsis, ListPlus, Share2, Plus, Heart, Link2, Loader2, Timer } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SleepTimerCountdown } from '@/components/player/SleepTimerCountdown';
import type { NowPlayingState } from '@/hooks/useNowPlaying';

export type NowPlayingUIProps = NowPlayingState & {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
};

const MobileNowPlayingUI = dynamic(() => import('@/components/mobile/player/MobileNowPlayingUI'));
const DesktopNowPlayingUI = dynamic(() => import('@/components/desktop/player/DesktopNowPlayingUI'));

export function NowPlayingUI(props: NowPlayingUIProps) {
  if (props.isMobile) {
    return <MobileNowPlayingUI {...props} />;
  }
  return <DesktopNowPlayingUI {...props} />;
}

export function MoreMenu(props: NowPlayingUIProps) {
    const { isMoreMenuOpen, setIsMoreMenuOpen, moreMenuRef, handleMoreAction, handleToggleLike, handleAddToLibraryAction, handleShareAction, handleCopyLinkAction, handleAddToPlaylist, playlists, isPlaylistsLoading, addToPlaylistMutation, selectedPlaylistId, isLiked, addToQueue, currentTrack, openMenuUpward } = props;
    const { setSleepTimer, clearSleepTimer, sleepTimerEndTime } = usePlayer();

    const [showPlaylists, setShowPlaylists] = useState(false);

    useEffect(() => {
      if (!isMoreMenuOpen) {
        setShowPlaylists(false);
      }
    }, [isMoreMenuOpen]);

    const menuBg = 'rgba(38,48,60,0.92)';
    const menuStyle: React.CSSProperties = { width: 210, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: menuBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', overflow: 'hidden' };
    const itemStyle = (last: boolean): React.CSSProperties => ({ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'none', border: 'none', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' });

    return (
      <div ref={moreMenuRef} style={{ position: 'relative' }}>
        <button onClick={handleMoreAction} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <Ellipsis size={18} />
        </button>
        {isMoreMenuOpen && (
          <div
            className="flex flex-col sm:flex-row"
            style={{
              position: 'absolute',
              right: 0,
              ...(openMenuUpward ? { bottom: '100%', marginBottom: 8 } : { top: '100%', marginTop: 8 }),
              zIndex: 30,
              gap: 4
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={menuStyle}>
              {[
                { label: 'Add to Library', icon: <Plus size={14} />, onClick: handleAddToLibraryAction },
                { label: 'Add to Playlist', icon: <ListPlus size={14} />, onClick: () => setShowPlaylists(!showPlaylists) },
                { label: 'Add to Queue', icon: <ListPlus size={14} />, onClick: () => { if (currentTrack) addToQueue(currentTrack); setIsMoreMenuOpen(false); } },
                { label: 'Favourite', icon: <Heart size={14} fill={isLiked ? '#fa233b' : 'none'} color={isLiked ? '#fa233b' : 'currentColor'} />, onClick: (e: React.MouseEvent<HTMLButtonElement>) => handleToggleLike(e) },
                { label: 'Share', icon: <Share2 size={14} />, onClick: handleShareAction },
                { label: 'Copy Link', icon: <Link2 size={14} />, onClick: handleCopyLinkAction },
              ].map((item, idx, arr) => (
                <button key={item.label} onClick={item.onClick} style={itemStyle(idx === arr.length - 1)} onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                  <span>{item.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.icon}</span>
                </button>
              ))}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 14px' }} />

              <div style={{ padding: '4px 14px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Timer size={12} /> Sleep Timer
                  </div>
                  {sleepTimerEndTime && (
                    <SleepTimerCountdown endTime={sleepTimerEndTime} />
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => { setSleepTimer(mins); setIsMoreMenuOpen(false); }}
                      style={{ flex: 1, padding: '4px 0', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                    >
                      {mins}m
                    </button>
                  ))}
                  {sleepTimerEndTime && (
                    <button
                      onClick={() => { clearSleepTimer(); setIsMoreMenuOpen(false); }}
                      style={{ width: '100%', marginTop: 4, padding: '6px 0', background: 'rgba(250,36,60,0.2)', color: '#FA243C', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                    >
                      Batalkan Timer
                    </button>
                  )}
                </div>
              </div>
            </div>
            {showPlaylists && (
              <div style={menuStyle}>
                <Link href="/playlist/create" onClick={() => setIsMoreMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  <span>New Playlist</span><Plus size={14} />
                </Link>
                <div style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>All playlists</div>
                {isPlaylistsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 14 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /></div>
                ) : playlists.length > 0 ? (
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)} disabled={addToPlaylistMutation.isPending} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'none', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', textAlign: 'left', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(255,255,255,0.06)' }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                        {selectedPlaylistId === pl.id && <span style={{ fontSize: 10, color: '#e0903a', flexShrink: 0 }}>Added</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Belum ada playlist.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }