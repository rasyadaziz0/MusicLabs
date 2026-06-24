'use client';

import { useCallback, useRef, useState } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  secondsLeft: number;
  error: string | null;
  startRecording: (durationMs?: number) => Promise<string | null>;
  stopRecording: () => void;
}

/**
 * Records audio from the microphone and returns it as a base64-encoded string.
 * Default duration: 8 seconds (sweet spot for AudD fingerprinting).
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setSecondsLeft(0);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(
    async (durationMs = 8000): Promise<string | null> => {
      setError(null);

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Microphone not supported in this browser.');
        return null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true, // Simplified constraints to test if this is the issue
        });
        streamRef.current = stream;

        // Pick a supported MIME type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        const chunks: Blob[] = [];

        return new Promise<string | null>((resolve) => {
          resolveRef.current = resolve;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = async () => {
            cleanup();
            if (chunks.length === 0) {
              resolve(null);
              return;
            }

            const blob = new Blob(chunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1] || null;
              resolve(base64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          };

          recorder.onerror = () => {
            setError('Recording failed.');
            cleanup();
            resolve(null);
          };

          recorder.start();
          setIsRecording(true);

          // Countdown
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

          // Auto-stop after duration
          timerRef.current = setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, durationMs);
        });
      } catch (err: unknown) {
        console.error('Mic Error:', err);
        const errorDetails = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        const msg = `Gagal akses mic (${errorDetails}). Pastikan mic tidak sedang dipakai aplikasi lain (Zoom/Discord) atau coba restart browser.`;
        setError(msg);
        cleanup();
        return null;
      }
    },
    [cleanup]
  );

  return { isRecording, secondsLeft, error, startRecording, stopRecording };
}
