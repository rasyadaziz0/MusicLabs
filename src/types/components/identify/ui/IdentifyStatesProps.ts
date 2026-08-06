import { IdentifyMode, IdentifyState } from '@/types/hooks/identify';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIdentifyQuota } from '@/hooks/useIdentifyQuota';

export interface IdentifyStatesProps {
  state: IdentifyState;
  mode: IdentifyMode;
  recorder: ReturnType<typeof useAudioRecorder>;
  speech: ReturnType<typeof useSpeechRecognition>;
  quota: ReturnType<typeof useIdentifyQuota>;
  rawMatch: { title: string; artist: string; album?: string } | null;
  errorMessage: string;
  onAuddIdentify: () => void;
  onSpeechStart: () => void;
  onCancel: () => void;
  onReset: () => void;
}
