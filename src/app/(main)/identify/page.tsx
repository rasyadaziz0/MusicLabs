'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, AudioLines, Mic, Music2, Play, Loader2, AlertCircle, Search } from 'lucide-react';
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

export default function IdentifyPage() {
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
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // Redirect to modal on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsDesktop(true);
      router.replace('/?modal=identify');
    } else {
      setIsDesktop(false);
    }
  }, [router]);

  // Reset when mode changes
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

    if (speech.error && state === 'recording') {
      setErrorMessage(speech.error);
      setState('error');
    }
  }, [speech.isListening, speech.transcript, speech.error, mode, state]);

  // ─── Play matched song ──────────────────────────────────────────
  const handlePlay = useCallback(
    (song: Song) => {
      playTrack(song, [song]);
      router.back();
    },
    [playTrack, router]
  );

  // ─── Navigate to search with the identified song info ──────────
  const handleSearchForSong = useCallback(
    (title: string, artist: string) => {
      const query = `${artist} ${title}`.trim();
      router.push(`/search?q=${encodeQuery(query)}`);
    },
    [router]
  );

  const isPlayable = matchedSong ? !matchedSong.id.startsWith('audd-') : false;

  const handleCancel = useCallback(() => {
    if (mode === 'audd') {
      recorder.stopRecording();
    } else {
      speech.stopListening();
    }
    setState('idle');
  }, [mode, recorder, speech]);

  // Prevent flash of mobile UI on desktop before redirect
  if (isDesktop === null || isDesktop === true) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-[#1a0a10] via-[#0d0d14] to-[#080816] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#FA243C]/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[#7B2BFC]/[0.04] blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-white pr-10">Identify Song</h1>
      </header>

      {/* Mode Tabs */}
      <div className="relative z-10 px-6 mt-2 mb-6">
        <div className="flex bg-white/[0.06] rounded-2xl p-1.5 border border-white/[0.04]">
          <button
            onClick={() => setMode('audd')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'audd'
                ? 'bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/25'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <AudioLines size={18} />
            Identify
          </button>
          <button
            onClick={() => setMode('speech')}
            disabled={!speech.isSupported}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'speech'
                ? 'bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/25'
                : 'text-white/50 hover:text-white/80'
            } ${!speech.isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={!speech.isSupported ? 'Not supported in this browser' : ''}
          >
            <Mic size={18} />
            Sing / Say
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* ── IDLE ── */}
        {state === 'idle' && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
            {mode === 'audd' ? (
              <>
                <div className="w-28 h-28 rounded-full bg-[#FA243C]/10 border-2 border-[#FA243C]/20 flex items-center justify-center">
                  <AudioLines size={48} className="text-[#FA243C]" />
                </div>
                <div>
                  <p className="text-white/90 font-semibold text-lg mb-1.5">
                    Play a song nearby
                  </p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    We&apos;ll listen for 8 seconds and identify it
                  </p>
                </div>
                <button
                  onClick={handleAuddIdentify}
                  disabled={quota.isExhausted}
                  className={`px-10 py-4 rounded-full font-bold text-base transition-all ${
                    quota.isExhausted
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-[#FA243C] text-white hover:bg-[#FA243C]/90 active:scale-95 shadow-xl shadow-[#FA243C]/30'
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
                <div className="w-28 h-28 rounded-full bg-[#FA243C]/10 border-2 border-[#FA243C]/20 flex items-center justify-center">
                  <Mic size={48} className="text-[#FA243C]" />
                </div>
                <div>
                  <p className="text-white/90 font-semibold text-lg mb-1.5">
                    Sing or say the song title
                  </p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    We&apos;ll transcribe your voice and search for matches
                  </p>
                </div>
                <button
                  onClick={handleSpeechStart}
                  className="px-10 py-4 rounded-full bg-[#FA243C] text-white font-bold text-base active:scale-95 transition-all shadow-xl shadow-[#FA243C]/30"
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
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full bg-[#FA243C]/5 identify-pulse-ring" />
              <div className="absolute inset-3 rounded-full bg-[#FA243C]/8 identify-pulse-ring" style={{ animationDelay: '0.3s' }} />
              <div className="absolute inset-6 rounded-full bg-[#FA243C]/12 identify-pulse-ring" style={{ animationDelay: '0.6s' }} />

              <div className="relative w-20 h-20 rounded-full bg-[#FA243C] flex items-center justify-center shadow-xl shadow-[#FA243C]/40">
                {mode === 'audd' ? (
                  <AudioLines size={36} className="text-white" />
                ) : (
                  <Mic size={36} className="text-white" />
                )}
              </div>
            </div>

            <div>
              <p className="text-white font-semibold text-xl">
                {mode === 'audd' ? 'Listening...' : 'Speak now...'}
              </p>
              {mode === 'audd' && recorder.secondsLeft > 0 && (
                <p className="text-[#FA243C] font-mono text-4xl font-bold mt-2">
                  {recorder.secondsLeft}s
                </p>
              )}
              {mode === 'speech' && speech.transcript && (
                <p className="text-white/60 text-sm mt-3 max-w-[300px] italic">
                  &ldquo;{speech.transcript}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={handleCancel}
              className="px-8 py-3 rounded-full border border-white/20 text-white/60 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {state === 'processing' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <Loader2 size={48} className="text-[#FA243C] animate-spin" />
            <p className="text-white/80 font-medium text-lg">
              {mode === 'audd' ? 'Identifying song...' : `Searching for "${speech.transcript}"...`}
            </p>
          </div>
        )}

        {/* ── RESULTS: AudD ── */}
        {state === 'results' && mode === 'audd' && matchedSong && (
          <div className="flex flex-col items-center gap-5 text-center w-full max-w-sm identify-result-enter">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Music2 size={16} className="text-green-400" />
            </div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Match Found</p>

            <div
              onClick={() => isPlayable ? handlePlay(matchedSong) : handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
              className="w-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-2xl p-5 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                  {getBestImageUrl(matchedSong.image) ? (
                    <Image
                      src={getBestImageUrl(matchedSong.image)!}
                      alt={matchedSong.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/40 to-[#1a1a1e]" />
                  )}
                  {isPlayable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={28} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-white truncate text-lg">{matchedSong.name}</p>
                  <p className="text-white/50 text-sm truncate mt-0.5">
                    {matchedSong.artists.primary.map((a) => a.name).join(', ')}
                  </p>
                  {matchedSong.album?.name && (
                    <p className="text-white/30 text-xs truncate mt-1">{matchedSong.album.name}</p>
                  )}
                </div>
                {isPlayable ? (
                  <Play size={22} className="text-[#FA243C] flex-shrink-0" />
                ) : (
                  <Search size={22} className="text-[#FA243C] flex-shrink-0" />
                )}
              </div>
            </div>

            {!isPlayable && (
              <button
                onClick={() => handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FA243C] text-white text-sm font-semibold transition-all shadow-lg shadow-[#FA243C]/20"
              >
                <Search size={14} />
                Search on AcadMusic
              </button>
            )}

            <button
              onClick={() => setState('idle')}
              className="px-6 py-2.5 rounded-full border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Try Another
            </button>
          </div>
        )}

        {/* ── RESULTS: Speech ── */}
        {state === 'results' && mode === 'speech' && speechResults.length > 0 && (
          <div className="w-full max-w-sm identify-result-enter">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider text-center mb-4">
              <Search size={12} className="inline mr-1" />
              Results for &ldquo;{speech.transcript}&rdquo;
            </p>
            <div className="space-y-2 max-h-[50dvh] overflow-y-auto scrollbar-hide">
              {speechResults.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] cursor-pointer transition-all group"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    {getBestImageUrl(song.image) ? (
                      <Image
                        src={getBestImageUrl(song.image)!}
                        alt={song.name}
                        fill
                        sizes="48px"
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
                  <Play size={18} className="text-white/30 group-hover:text-[#FA243C] flex-shrink-0 transition-colors" />
                </div>
              ))}
            </div>
            <button
              onClick={() => setState('idle')}
              className="w-full mt-4 px-6 py-3 rounded-full border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── NO MATCH ── */}
        {state === 'no-match' && (
          <div className="flex flex-col items-center gap-5 text-center identify-result-enter">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center">
              <Music2 size={28} className="text-white/30" />
            </div>
            <div>
              <p className="text-white/80 font-medium text-lg mb-1.5">Couldn&apos;t identify this song</p>
              {rawMatch?.title && (
                <p className="text-white/40 text-xs mb-2">
                  Heard something like: &ldquo;{rawMatch.title}&rdquo;{rawMatch.artist ? ` by ${rawMatch.artist}` : ''}
                </p>
              )}
              <p className="text-white/40 text-sm leading-relaxed">
                {mode === 'audd'
                  ? 'Try holding your mic closer, or use "Sing/Say" mode.'
                  : 'Try saying the song title more clearly.'}
              </p>
            </div>
            <button
              onClick={() => setState('idle')}
              className="px-8 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-5 text-center identify-result-enter">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-white/70 text-sm max-w-[300px]">{errorMessage}</p>
            <button
              onClick={() => setState('idle')}
              className="px-8 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
