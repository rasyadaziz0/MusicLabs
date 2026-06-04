import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { usePlayer } from '@/context/PlayerContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIdentifyQuota } from '@/hooks/useIdentifyQuota';
import { Song } from '@/types/music';
import { encodeQuery } from '@/lib/utils/searchEncode';

import { AuddStrategy } from '@/services/identify/AuddStrategy';
import { SpeechStrategy } from '@/services/identify/SpeechStrategy';

export type IdentifyMode = 'audd' | 'speech';
export type IdentifyState = 'idle' | 'recording' | 'processing' | 'results' | 'error' | 'no-match';

export function useIdentifyController() {
  const { playTrack } = usePlayer();
  const router = useRouter();
  
  // Dependencies
  const recorder = useAudioRecorder();
  const speech = useSpeechRecognition();
  const quota = useIdentifyQuota();

  // State
  const [mode, setMode] = useState<IdentifyMode>('audd');
  const [state, setState] = useState<IdentifyState>('idle');
  const [matchedSong, setMatchedSong] = useState<Song | null>(null);
  const [rawMatch, setRawMatch] = useState<{ title: string; artist: string; album?: string } | null>(null);
  const [speechResults, setSpeechResults] = useState<Song[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  const prevTranscriptRef = useRef('');

  // Reset when mode changes
  const resetTranscriptRef = useRef(speech.resetTranscript);
  resetTranscriptRef.current = speech.resetTranscript;

  useEffect(() => {
    setState('idle');
    setMatchedSong(null);
    setRawMatch(null);
    setSpeechResults([]);
    setErrorMessage('');
    resetTranscriptRef.current();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const strategy = new AuddStrategy();
    const result = await strategy.execute(audioBase64, { accessToken: session?.access_token });

    if (result.type === 'error') {
      setErrorMessage(result.errorMessage || 'Identification failed');
      setState('error');
    } else if (result.type === 'match') {
      setMatchedSong(result.match || null);
      setRawMatch(result.rawMatch || null);
      setState('results');
    } else {
      setRawMatch(result.rawMatch || null);
      setState('no-match');
    }
  }, [recorder, quota]);

  const handleSpeechStart = useCallback(() => {
    setState('recording');
    setSpeechResults([]);
    prevTranscriptRef.current = '';
    speech.startListening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.startListening]);

  useEffect(() => {
    const processSpeech = async () => {
      if (
        mode === 'speech' &&
        !speech.isListening &&
        speech.transcript &&
        speech.transcript !== prevTranscriptRef.current &&
        state === 'recording'
      ) {
        prevTranscriptRef.current = speech.transcript;
        setState('processing');

        const strategy = new SpeechStrategy();
        const result = await strategy.execute(speech.transcript);

        if (result.type === 'error') {
          setErrorMessage(result.errorMessage || 'Search failed');
          setState('error');
        } else if (result.type === 'match') {
          setSpeechResults(result.results || []);
          setState('results');
        } else {
          setRawMatch(result.rawMatch || null);
          setState('no-match');
        }
      }
    };

    processSpeech();

    if (speech.error && state === 'recording') {
      setErrorMessage(speech.error);
      setState('error');
    }
  }, [speech.isListening, speech.transcript, speech.error, mode, state]);

  const handlePlay = useCallback(
    (song: Song, onAfterPlay?: () => void) => {
      playTrack(song, [song]);
      if (onAfterPlay) onAfterPlay();
    },
    [playTrack]
  );

  const handleSearchForSong = useCallback(
    (title: string, artist: string, onAfterSearch?: () => void) => {
      const query = `${artist} ${title}`.trim();
      router.push(`/search?q=${encodeQuery(query)}`);
      if (onAfterSearch) onAfterSearch();
    },
    [router]
  );

  const handleCancel = useCallback(() => {
    if (mode === 'audd') {
      recorder.stopRecording();
    } else {
      speech.stopListening();
    }
    setState('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, recorder.stopRecording, speech.stopListening]);

  const resetState = useCallback(() => {
    setState('idle');
  }, []);

  return {
    mode,
    setMode,
    state,
    matchedSong,
    rawMatch,
    speechResults,
    errorMessage,
    recorder,
    speech,
    quota,
    handleAuddIdentify,
    handleSpeechStart,
    handlePlay,
    handleSearchForSong,
    handleCancel,
    resetState,
  };
}
