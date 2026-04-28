'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  Loader2,
  Heart,
  Ellipsis,
  ListPlus,
  Share2,
  Plus,
  Link2,
} from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime, cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import type { NowPlayingState } from '@/hooks/useNowPlaying';

type NowPlayingUIProps = NowPlayingState & {
  isOpen: boolean;
  onClose: () => void;
};

export function NowPlayingUI({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  isResolving,
  isPreview,
  currentTime,
  duration,
  volume,
  togglePlay,
  nextTrack,
  prevTrack,
  seek,
  setVolume,
  lines,
  isSynced,
  isLyricsLoading,
  activeIndex,
  isLiked,
  playlists,
  isPlaylistsLoading,
  toggleLikeMutation,
  addToPlaylistMutation,
  isLyricsOpen,
  isMoreMenuOpen,
  selectedPlaylistId,
  openMenuUpward,
  setIsLyricsOpen,
  setIsMoreMenuOpen,
  lyricsScrollRef,
  mobileLyricsScrollRef,
  moreMenuRef,
  handleToggleLike,
  handleShareAction,
  handleCopyLinkAction,
  handleAddToLibraryAction,
  handleMoreAction,
  handleAddToPlaylist,
}: NowPlayingUIProps) {
  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-[70] bg-void overflow-hidden"
        >
          <div className="absolute inset-0">
            {getBestImageUrl(currentTrack.image) && (
              <Image
                src={getBestImageUrl(currentTrack.image)!}
                alt="bg"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-[#171722]/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3f3638]/65 via-[#3e3842]/62 to-[#4f453a]/62" />
          </div>

          <div className="relative z-10 h-full px-4 py-4 md:px-8 md:py-6 overflow-y-auto pb-24">
            <button
              onClick={onClose}
              className="absolute left-4 top-4 md:left-8 md:top-6 w-10 h-10 rounded-full bg-white/12 border border-white/12 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <X size={17} />
            </button>

            <div className="min-h-full flex items-center w-full max-w-[1600px] mx-auto pt-16 md:pt-0">
              <div className="w-full grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] items-center gap-12 lg:gap-32 lg:px-16 px-2">

                <div className="w-full max-w-[400px] mx-auto">
                  <div className="bg-white/8 border border-white/10 rounded-2xl p-3 shadow-2xl">
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden">
                      {getBestImageUrl(currentTrack.image) ? (
                        <Image
                          src={getBestImageUrl(currentTrack.image)!}
                          alt={currentTrack.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
                      )}
                      {isPreview ? (
                        <span className="absolute right-2 top-2 px-2 py-1 rounded-full text-[10px] uppercase tracking-wide font-semibold bg-black/45 border border-white/25">
                          Preview
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <h2 className="truncate text-[38px] font-bold leading-tight">{currentTrack.name}</h2>
                      <p className="mt-1 truncate text-[18px] font-semibold text-white/70">
                        {currentTrack.artists.primary.map((artist) => artist.name).join(', ')}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2 pt-1">
                      <button
                        onClick={handleToggleLike}
                        disabled={toggleLikeMutation.isPending}
                        className={cn(
                          'w-7 h-7 rounded-full bg-white/12 hover:bg-white/22 transition-colors flex items-center justify-center',
                          'disabled:opacity-60',
                          isLiked && 'text-primary'
                        )}
                        title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                        aria-label={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                      >
                        {toggleLikeMutation.isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                        )}
                      </button>

                      <div ref={moreMenuRef} className="relative">
                        <button
                          onClick={handleMoreAction}
                          className="w-7 h-7 rounded-full bg-white/12 hover:bg-white/22 transition-colors flex items-center justify-center"
                          title="Menu lagu"
                          aria-label="Menu lagu"
                        >
                          <Ellipsis size={14} />
                        </button>

                        {isMoreMenuOpen && (
                          <div
                            className={cn('absolute left-full z-30 ml-2', openMenuUpward ? 'bottom-0' : 'top-0')}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="relative flex items-start">
                              <div className="w-[270px] overflow-hidden rounded-xl border border-white/20 bg-[#26323f]/82 backdrop-blur-md shadow-2xl">
                                <button
                                  type="button"
                                  onClick={handleAddToLibraryAction}
                                  className="flex w-full items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none transition-colors hover:bg-white/8"
                                >
                                  <span className="text-base">Add to Library</span>
                                  <Plus size={16} className="text-white/80" />
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none transition-colors hover:bg-white/8"
                                >
                                  <span className="text-base">Add to Playlist</span>
                                  <ListPlus size={16} className="text-white/80" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => { void handleToggleLike(event); }}
                                  className="flex w-full items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none transition-colors hover:bg-white/8"
                                  title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                                  aria-label={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                                >
                                  <span className="text-base">Favourite</span>
                                  <Heart size={15} className="text-white/80" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleShareAction}
                                  className="flex w-full items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none transition-colors hover:bg-white/8"
                                >
                                  <span className="text-base">Share</span>
                                  <Share2 size={16} className="text-white/80" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCopyLinkAction}
                                  className="flex w-full items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none transition-colors hover:bg-white/8"
                                >
                                  <span className="text-base">Copy Link</span>
                                  <Link2 size={16} className="text-white/80" />
                                </button>
                              </div>

                              <div className="ml-1 w-[270px] overflow-hidden rounded-xl border border-white/20 bg-[#26323f]/85 backdrop-blur-md shadow-2xl">
                                <Link
                                  href="/playlist/create"
                                  className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none hover:bg-white/8"
                                  onClick={() => { setIsMoreMenuOpen(false); }}
                                >
                                  <span className="text-base">New Playlist</span>
                                  <Plus size={18} />
                                </Link>

                                <div className="border-b border-white/10 px-4 py-2 text-sm font-semibold text-white/50">
                                  All playlists
                                </div>

                                {isPlaylistsLoading ? (
                                  <div className="flex items-center justify-center py-4 text-muted">
                                    <Loader2 size={15} className="animate-spin" />
                                  </div>
                                ) : playlists.length > 0 ? (
                                  <div className="max-h-64 overflow-y-auto">
                                    {playlists.map((playlist) => {
                                      const isSelected = selectedPlaylistId === playlist.id;
                                      return (
                                        <button
                                          key={playlist.id}
                                          type="button"
                                          onClick={() => handleAddToPlaylist(playlist.id)}
                                          disabled={addToPlaylistMutation.isPending}
                                          className="flex w-full items-center justify-between border-b border-white/10 px-4 py-2.5 text-left text-[32px] font-semibold leading-none transition-colors hover:bg-white/8 disabled:opacity-60"
                                        >
                                          <span className="truncate text-base">{playlist.name}</span>
                                          {isSelected && <span className="text-xs text-primary">Added</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="px-4 py-3 text-sm text-muted">Belum ada playlist.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="relative h-1.5 rounded-full bg-white/20">
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={(event) => seek(Number(event.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className="absolute h-full rounded-full bg-white"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-white/65">
                      <span>{formatTime(currentTime)}</span>
                      <span>-{formatTime(Math.max(duration - currentTime, 0))}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-6">
                    <button className="text-white/70 hover:text-white transition-colors" aria-label="Shuffle">
                      <Shuffle size={16} />
                    </button>
                    <button
                      onClick={prevTrack}
                      className="text-white hover:scale-105 transition-transform"
                      aria-label="Previous"
                    >
                      <SkipBack size={24} fill="currentColor" />
                    </button>
                    <button
                      onClick={togglePlay}
                      disabled={isResolving}
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isResolving ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={21} fill="black" />
                      ) : (
                        <Play size={21} fill="black" className="ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={nextTrack}
                      className="text-white hover:scale-105 transition-transform"
                      aria-label="Next"
                    >
                      <SkipForward size={24} fill="currentColor" />
                    </button>
                    <button className="text-white/70 hover:text-white transition-colors" aria-label="Repeat">
                      <Repeat size={16} />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <Volume2 size={14} className="text-white/70" />
                    <div className="relative h-1.5 rounded-full bg-white/20 flex-1">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="absolute h-full rounded-full bg-white" style={{ width: `${volume * 100}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsLyricsOpen(true)}
                    className="mt-4 lg:hidden w-full rounded-xl bg-white/12 hover:bg-white/20 border border-white/10 px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors"
                  >
                    Buka Lirik
                  </button>
                </div>

                <div className="hidden lg:flex h-full items-center justify-start lg:justify-end lg:pl-8">
                  <div className="w-full max-w-[800px]">
                    <div ref={lyricsScrollRef} className="space-y-8 max-h-[75vh] overflow-y-auto mask-gradient pr-8">
                      {isLyricsLoading ? (
                        [...Array(6)].map((_, index) => (
                          <div
                            key={`skeleton-${index}`}
                            className="h-12 rounded-xl bg-white/10 animate-pulse"
                            style={{ opacity: 1 - index * 0.1 }}
                          />
                        ))
                      ) : lines.length > 0 ? (
                        lines.map((line, index) => (
                          <button
                            key={`${line.time}-${index}`}
                            data-lyric-index={index}
                            onClick={() => isSynced && !line.isPlaceholder && seek(line.time)}
                            className={cn(
                              'block text-left w-full transition-all duration-300 font-semibold tracking-tight py-1',
                              isSynced && !line.isPlaceholder ? 'cursor-pointer' : 'cursor-default',
                              activeIndex === index
                                ? 'text-white blur-0 text-4xl md:text-5xl lg:text-[40px] leading-[1.3]'
                                : 'text-white/25 blur-[1.5px] text-3xl md:text-4xl lg:text-[38px] leading-[1.35]'
                            )}
                          >
                            {line.text}
                          </button>
                        ))
                      ) : (
                        <div className="text-white/65 text-2xl">Lirik belum tersedia untuk lagu ini.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <AnimatePresence>
            {isLyricsOpen && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-[90] lg:hidden bg-void/95 backdrop-blur-sm"
              >
                <div className="relative h-full px-4 pt-5 pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setIsLyricsOpen(false)}
                      className="w-10 h-10 rounded-full bg-white/12 border border-white/12 hover:bg-white/20 transition-colors flex items-center justify-center"
                      aria-label="Tutup lirik"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <p className="text-sm font-semibold text-white/80">Lirik</p>
                    <div className="w-10 h-10" />
                  </div>

                  <div ref={mobileLyricsScrollRef} className="space-y-8 max-h-[calc(100vh-92px)] overflow-y-auto mask-gradient pr-1">
                    {isLyricsLoading ? (
                      [...Array(6)].map((_, index) => (
                        <div
                          key={`mobile-skeleton-${index}`}
                          className="h-12 rounded-xl bg-white/10 animate-pulse"
                          style={{ opacity: 1 - index * 0.1 }}
                        />
                      ))
                    ) : lines.length > 0 ? (
                      lines.map((line, index) => (
                        <button
                          key={`mobile-${line.time}-${index}`}
                          data-lyric-index={index}
                          onClick={() => isSynced && !line.isPlaceholder && seek(line.time)}
                          className={cn(
                            'block text-left w-full transition-all duration-300 font-semibold tracking-tight py-1',
                            isSynced && !line.isPlaceholder ? 'cursor-pointer' : 'cursor-default',
                            activeIndex === index
                              ? 'text-white blur-0 text-3xl leading-[1.3]'
                              : 'text-white/25 blur-[1.5px] text-2xl leading-[1.35]'
                          )}
                        >
                          {line.text}
                        </button>
                      ))
                    ) : (
                      <div className="text-white/65 text-xl">Lirik belum tersedia untuk lagu ini.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
