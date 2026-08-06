export interface UseAudioRecorderReturn {
  isRecording: boolean;
  secondsLeft: number;
  error: string | null;
  startRecording: (durationMs?: number) => Promise<string | null>;
  stopRecording: () => void;
}