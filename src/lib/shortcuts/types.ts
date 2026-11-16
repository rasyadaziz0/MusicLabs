import { KeyboardShortcutsConfig } from '@/types/context/settings';

export interface ShortcutExecutionContext {
  hasTrack: boolean;
  currentTime: number;
  duration: number;
  isNowPlayingOpen?: boolean;
  onCloseNowPlaying?: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
}

export interface IKeyboardShortcutDispatcher {
  dispatch(
    e: KeyboardEvent,
    config: KeyboardShortcutsConfig,
    context: ShortcutExecutionContext
  ): boolean;
}
