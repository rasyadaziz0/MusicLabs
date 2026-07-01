import { Song } from '@/types/music';
import { IdentifyMode, IdentifyState } from '@/hooks/useIdentifyController';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIdentifyQuota } from '@/hooks/useIdentifyQuota';

export interface IIdentifyLayoutProps {
  mode: IdentifyMode;
  setMode: (mode: IdentifyMode) => void;
  state: IdentifyState;
  matchedSong: Song | null;
  rawMatch: { title: string; artist: string; album?: string } | null;
  speechResults: Song[];
  errorMessage: string;
  recorder: ReturnType<typeof useAudioRecorder>;
  speech: ReturnType<typeof useSpeechRecognition>;
  quota: ReturnType<typeof useIdentifyQuota>;
  handleAuddIdentify: () => void;
  handleSpeechStart: () => void;
  handlePlay: (song: Song, onAfterPlay?: () => void) => void;
  handleSearchForSong: (title: string, artist: string, onAfterSearch?: () => void) => void;
  handleCancel: () => void;
  resetState: () => void;
}

export interface IIdentifyHeaderProps {
  mode: IdentifyMode;
  setMode: (mode: IdentifyMode) => void;
  state: IdentifyState;
  speech: ReturnType<typeof useSpeechRecognition>;
  quota: ReturnType<typeof useIdentifyQuota>;
  onBack: () => void;
}

export interface IIdentifyIdleProps {
  mode: IdentifyMode;
  handleAuddIdentify: () => void;
  handleSpeechStart: () => void;
}

export interface IIdentifyRecordingProps {
  mode: IdentifyMode;
  countdownPercent: number;
  recorder: ReturnType<typeof useAudioRecorder>;
  speech: ReturnType<typeof useSpeechRecognition>;
  handleCancel: () => void;
}

export interface IIdentifyProcessingProps {
  mode: IdentifyMode;
}

export interface IIdentifyResultsProps {
  mode: IdentifyMode;
  state: IdentifyState;
  matchedSong: Song | null;
  speechResults: Song[];
  speech: ReturnType<typeof useSpeechRecognition>;
  handlePlay: (song: Song, onAfterPlay?: () => void) => void;
  handleSearchForSong: (title: string, artist: string, onAfterSearch?: () => void) => void;
  resetState: () => void;
}

export interface IIdentifyFeedbackProps {
  state: IdentifyState;
  mode: IdentifyMode;
  speech: ReturnType<typeof useSpeechRecognition>;
  rawMatch: { title: string; artist: string; album?: string } | null;
  errorMessage: string;
  resetState: () => void;
  handleSearchForSong: (title: string, artist: string, onAfterSearch?: () => void) => void;
}

export interface IIdentifySongResultsProps {
  matchedSong: Song;
  handlePlay: (song: Song, onAfterPlay?: () => void) => void;
  handleSearchForSong: (title: string, artist: string, onAfterSearch?: () => void) => void;
  resetState: () => void;
}

export interface ISingSayResultsProps {
  speechResults: Song[];
  transcript: string;
  handlePlay: (song: Song, onAfterPlay?: () => void) => void;
  resetState: () => void;
}
