'use client';

import { SpeechRecognitionService } from '@/lib/services/SpeechRecognitionService';
import { UseSpeechRecognitionReturn } from '@/types/hooks/speech';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps the Web Speech API (SpeechRecognition) for voice-to-text.
 * Gracefully returns isSupported=false on browsers without support (Firefox/older Safari).
 */
export function useSpeechRecognition(lang = 'en-US'): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<SpeechRecognitionService>(new SpeechRecognitionService());

  useEffect(() => {
    setIsSupported(SpeechRecognitionService.isSupported());
  }, []);

  const stopListening = useCallback(() => {
    serviceRef.current.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    
    if (!isSupported) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    setIsListening(true);
    serviceRef.current.start(
      lang,
      (text) => setTranscript(text),
      (err) => {
        setError(err);
        setIsListening(false);
      },
      () => setIsListening(false),
      15000
    );
  }, [lang, isSupported]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  useEffect(() => {
    const service = serviceRef.current;
    return () => {
      service.stop();
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
