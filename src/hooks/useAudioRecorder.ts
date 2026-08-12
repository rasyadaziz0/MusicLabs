'use client';

import { AudioRecorderService } from '@/lib/services/AudioRecorderService';
import { UseAudioRecorderReturn } from '@/types/hooks/audio';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Records audio from the microphone and returns it as a base64-encoded string.
 * Default duration: 8 seconds (sweet spot for AudD fingerprinting).
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<AudioRecorderService>(new AudioRecorderService());
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    serviceRef.current.cleanup();
    setIsRecording(false);
    setSecondsLeft(0);
  }, []);

  const stopRecording = useCallback(() => {
    serviceRef.current.stop();
  }, []);

  const startRecording = useCallback(
    async (durationMs = 8000): Promise<string | null> => {
      setError(null);

      return new Promise<string | null>((resolve) => {
        resolveRef.current = resolve;

        serviceRef.current.start(
          durationMs,
          (base64) => {
            cleanup();
            resolve(base64);
          },
          (err) => {
            console.error('Mic Error:', err);
            const errorDetails = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
            setError(`Gagal akses mic (${errorDetails}). Pastikan mic tidak sedang dipakai aplikasi lain.`);
            cleanup();
            resolve(null);
          }
        ).then(() => {
          setIsRecording(true);
          const totalSeconds = Math.ceil(durationMs / 1000);
          setSecondsLeft(totalSeconds);
          
          countdownRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
              if (prev <= 1) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }).catch((err) => {
          console.error('Mic Error:', err);
          setError(err instanceof Error ? err.message : String(err));
          cleanup();
          resolve(null);
        });
      });
    },
    [cleanup]
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { isRecording, secondsLeft, error, startRecording, stopRecording };
}
