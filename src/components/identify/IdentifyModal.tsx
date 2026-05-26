'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, AudioLines, Mic, Music2, Play, Loader2, AlertCircle, Search, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl, searchSongs } from '@/lib/api/musicApi';
import { encodeQuery } from '@/lib/utils/searchEncode';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIdentifyQuota } from '@/hooks/useIdentifyQuota';
import { Song } from '@/types/music';

type IdentifyMode = 'audd' | 'speech';
type IdentifyState = 'idle' | 'recording' | 'processing' | 'results' | 'error' | 'no-match';

interface IdentifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IdentifyModal({ isOpen, onClose }: IdentifyModalProps) {
  const { playTrack } = usePlayer();
  const router = useRouter();
  const recorder = useAudioRecorder();
  const speech = useSpeechRecognition();
  const quota = useIdentifyQuota();

  const [mode, setMode] = useState<IdentifyMode>('audd');
  const [state, setState] = useState<IdentifyState>('idle');
  const [matchedSong, setMatchedSong] = useState<Song | null>(null);
  const [rawMatch, setRawMatch] = useState<{ title: string; artist: string } | null>(null);
  const [speechResults, setSpeechResults] = useState<Song[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const prevTranscriptRef = useRef('');

  // Reset state when modal opens/closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setState('idle');
      setMatchedSong(null);
      setRawMatch(null);
      setSpeechResults([]);
      setErrorMessage('');
      speech.resetTranscript();
    }
  }, [isOpen]);

  useEffect(() => {
    setState('idle');
    setMatchedSong(null);
    setRawMatch(null);
    setSpeechResults([]);
    setErrorMessage('');
    speech.resetTranscript();
  }, [mode]);

  // ─── AudD: Identify via audio fingerprint ───────────────────────
  const handleAuddIdentify = useCallback(async () => {
    if (quota.isExhausted) {
      setErrorMessage('Monthly limit reached (300/300). Try "Sing/Say" mode instead!');
      setState('error');
      return;
    }

    setState('recording');
    setMatchedSong(null);
    setRawMatch(null);

    const audioBase64 = await recorder.startRecording(8000);

    if (!audioBase64) {
      if (recorder.error) {
        setErrorMessage(recorder.error);
        setState('error');
      } else {
        setState('idle');
      }
      return;
    }

    setState('processing');
    quota.consume();

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Identification failed.');
        setState('error');
        return;
      }

      if (data.match) {
        setMatchedSong(data.match);
        setRawMatch(data.raw || null);
        setState('results');
      } else {
        setRawMatch(data.raw || null);
        setState('no-match');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection.');
      setState('error');
    }
  }, [recorder, quota]);

  // ─── Speech: Sing/Say → search ──────────────────────────────────
  const handleSpeechStart = useCallback(() => {
    setState('recording');
    setSpeechResults([]);
    prevTranscriptRef.current = '';
    speech.startListening();
  }, [speech]);

  // When speech finishes, search with the transcript
  useEffect(() => {
    if (
      mode === 'speech' &&
      !speech.isListening &&
      speech.transcript &&
      speech.transcript !== prevTranscriptRef.current &&
      state === 'recording'
    ) {
      prevTranscriptRef.current = speech.transcript;
      setState('processing');

      searchSongs(speech.transcript)
        .then((data: any) => {
          const songs: Song[] = data?.results ?? data ?? [];
          if (songs.length > 0) {
            setSpeechResults(songs.slice(0, 6));
            setState('results');
          } else {
            setState('no-match');
          }
        })
        .catch(() => {
          setErrorMessage('Search failed. Please try again.');
          setState('error');
        });
    }

    // Handle speech errors
    if (speech.error && state === 'recording') {
      setErrorMessage(speech.error);
      setState('error');
    }
  }, [speech.isListening, speech.transcript, speech.error, mode, state]);

  // ─── Play matched song ──────────────────────────────────────────
  const handlePlay = useCallback(
    (song: Song) => {
      playTrack(song, [song]);
      onClose();
    },
    [playTrack, onClose]
  );

  // ─── Navigate to search with the identified song info ──────────
  const handleSearchForSong = useCallback(
    (title: string, artist: string) => {
      const query = `${artist} ${title}`.trim();
      router.push(`/search?q=${encodeQuery(query)}`);
      onClose();
    },
    [router, onClose]
  );

  // Check if a matched song is playable (Spotify or iTunes match) vs AudD-only stub
  const isPlayable = matchedSong ? !matchedSong.id.startsWith('audd-') : false;

  // ─── Cancel recording ───────────────────────────────────────────
  const handleCancel = useCallback(() => {
    if (mode === 'audd') {
      recorder.stopRecording();
    } else {
      speech.stopListening();
    }
    setState('idle');
  }, [mode, recorder, speech]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 identify-modal-enter">
        <div className="bg-[#1a1a1e]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-lg font-bold text-white">Identify Song</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex mx-6 mb-5 bg-white/[0.06] rounded-xl p-1 border border-white/[0.04]">
            <button
              onClick={() => setMode('audd')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'audd'
                  ? 'bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/20'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <AudioLines size={16} />
              Identify
            </button>
            <button
              onClick={() => setMode('speech')}
              disabled={!speech.isSupported}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'speech'
                  ? 'bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/20'
                  : 'text-white/50 hover:text-white/80'
              } ${!speech.isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={!speech.isSupported ? 'Not supported in this browser' : ''}
            >
              <Mic size={16} />
              Sing / Say
            </button>
          </div>

          {/* Content Area */}
          <div className="px-6 pb-6 min-h-[320px] flex flex-col items-center justify-center">
            {/* ── IDLE ── */}
            {state === 'idle' && (
              <div className="flex flex-col items-center gap-5 text-center">
                {mode === 'audd' ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#FA243C]/10 border border-[#FA243C]/20 flex items-center justify-center">
                      <AudioLines size={36} className="text-[#FA243C]" />
                    </div>
                    <div>
                      <p className="text-white/90 font-medium mb-1">
                        Play a song nearby
                      </p>
                      <p className="text-white/40 text-sm">
                        We'll listen for 8 seconds and identify it
                      </p>
                    </div>
                    <button
                      onClick={handleAuddIdentify}
                      disabled={quota.isExhausted}
                      className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
                        quota.isExhausted
                          ? 'bg-white/10 text-white/30 cursor-not-allowed'
                          : 'bg-[#FA243C] text-white hover:bg-[#FA243C]/90 hover:scale-105 active:scale-95 shadow-lg shadow-[#FA243C]/30'
                      }`}
                    >
                      {quota.isExhausted ? 'Limit Reached' : 'Start Listening'}
                    </button>
                    <p className="text-white/30 text-xs">
                      {quota.remaining}/{300} identifications left this month
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#FA243C]/10 border border-[#FA243C]/20 flex items-center justify-center">
                      <Mic size={36} className="text-[#FA243C]" />
                    </div>
                    <div>
                      <p className="text-white/90 font-medium mb-1">
                        Sing or say the song title
                      </p>
                      <p className="text-white/40 text-sm">
                        We'll transcribe your voice and search for matches
                      </p>
                    </div>
                    <button
                      onClick={handleSpeechStart}
                      className="px-8 py-3 rounded-full bg-[#FA243C] text-white font-bold text-sm hover:bg-[#FA243C]/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FA243C]/30"
                    >
                      Start Speaking
                    </button>
                    <p className="text-white/30 text-xs">Unlimited • Free forever</p>
                  </>
                )}
              </div>
            )}

            {/* ── RECORDING ── */}
            {state === 'recording' && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 rounded-full bg-[#FA243C]/5 identify-pulse-ring" />
                  <div className="absolute inset-2 rounded-full bg-[#FA243C]/8 identify-pulse-ring" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute inset-4 rounded-full bg-[#FA243C]/12 identify-pulse-ring" style={{ animationDelay: '0.6s' }} />

                  <div className="relative w-16 h-16 rounded-full bg-[#FA243C] flex items-center justify-center shadow-lg shadow-[#FA243C]/40">
                    {mode === 'audd' ? (
                      <AudioLines size={28} className="text-white" />
                    ) : (
                      <Mic size={28} className="text-white" />
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-white font-semibold text-lg">
                    {mode === 'audd' ? 'Listening...' : 'Speak now...'}
                  </p>
                  {mode === 'audd' && recorder.secondsLeft > 0 && (
                    <p className="text-[#FA243C] font-mono text-2xl font-bold mt-1">
                      {recorder.secondsLeft}s
                    </p>
                  )}
                  {mode === 'speech' && speech.transcript && (
                    <p className="text-white/60 text-sm mt-2 max-w-[280px] italic">
                      &ldquo;{speech.transcript}&rdquo;
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCancel}
                  className="px-6 py-2 rounded-full border border-white/20 text-white/60 text-sm hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── PROCESSING ── */}
            {state === 'processing' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 size={40} className="text-[#FA243C] animate-spin" />
                <p className="text-white/80 font-medium">
                  {mode === 'audd' ? 'Identifying song...' : `Searching for "${speech.transcript}"...`}
                </p>
              </div>
            )}

            {/* ── RESULTS ── */}
            {state === 'results' && mode === 'audd' && matchedSong && (
              <div className="flex flex-col items-center gap-4 text-center w-full identify-result-enter">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                  <Music2 size={14} className="text-green-400" />
                </div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Match Found</p>

                <div
                  onClick={() => isPlayable ? handlePlay(matchedSong) : handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
                  className="w-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-2xl p-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                      {getBestImageUrl(matchedSong.image) ? (
                        <Image
                          src={getBestImageUrl(matchedSong.image)!}
                          alt={matchedSong.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/40 to-[#1a1a1e]" />
                      )}
                      {isPlayable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={24} className="text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-white truncate text-base">{matchedSong.name}</p>
                      <p className="text-white/50 text-sm truncate">
                        {matchedSong.artists.primary.map((a) => a.name).join(', ')}
                      </p>
                      {matchedSong.album?.name && (
                        <p className="text-white/30 text-xs truncate mt-0.5">{matchedSong.album.name}</p>
                      )}
                    </div>
                    {isPlayable ? (
                      <Play size={20} className="text-[#FA243C] flex-shrink-0 group-hover:scale-110 transition-transform" />
                    ) : (
                      <Search size={20} className="text-[#FA243C] flex-shrink-0 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </div>

                {/* For AudD-only matches, show a helpful search button */}
                {!isPlayable && (
                  <button
                    onClick={() => handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FA243C] text-white text-sm font-semibold hover:bg-[#FA243C]/90 transition-all shadow-lg shadow-[#FA243C]/20"
                  >
                    <Search size={14} />
                    Search on AcadMusic
                  </button>
                )}
              </div>
            )}

            {state === 'results' && mode === 'speech' && speechResults.length > 0 && (
              <div className="w-full identify-result-enter">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider text-center mb-3">
                  <Search size={12} className="inline mr-1" />
                  Results for &ldquo;{speech.transcript}&rdquo;
                </p>
                <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-hide">
                  {speechResults.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handlePlay(song)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] cursor-pointer transition-all group"
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                        {getBestImageUrl(song.image) ? (
                          <Image
                            src={getBestImageUrl(song.image)!}
                            alt={song.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#1a1a1e]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{song.name}</p>
                        <p className="text-white/40 text-xs truncate">
                          {song.artists.primary.map((a) => a.name).join(', ')}
                        </p>
                      </div>
                      <Play size={16} className="text-white/30 group-hover:text-[#FA243C] flex-shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NO MATCH ── */}
            {state === 'no-match' && (
              <div className="flex flex-col items-center gap-4 text-center identify-result-enter">
                <div className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <Music2 size={24} className="text-white/30" />
                </div>
                <div>
                  <p className="text-white/80 font-medium mb-1">Couldn't identify this song</p>
                  {rawMatch?.title && (
                    <p className="text-white/40 text-xs mb-2">
                      Heard something like: &ldquo;{rawMatch.title}&rdquo;{rawMatch.artist ? ` by ${rawMatch.artist}` : ''}
                    </p>
                  )}
                  <p className="text-white/40 text-sm">
                    {mode === 'audd'
                      ? 'Try holding your mic closer, or use "Sing/Say" mode.'
                      : 'Try saying the song title more clearly.'}
                  </p>
                </div>
                <button
                  onClick={() => setState('idle')}
                  className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ── ERROR ── */}
            {state === 'error' && (
              <div className="flex flex-col items-center gap-4 text-center identify-result-enter">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={24} className="text-red-400" />
                </div>
                <p className="text-white/70 text-sm max-w-[280px]">{errorMessage}</p>
                <button
                  onClick={() => setState('idle')}
                  className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
