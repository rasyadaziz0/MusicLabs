import { KeyboardShortcutsConfig } from '@/types/context/settings';
import { KeyStrokeNormalizer } from './KeyStrokeNormalizer';
import { IKeyboardShortcutDispatcher, ShortcutExecutionContext } from './types';

export class KeyboardShortcutDispatcher implements IKeyboardShortcutDispatcher {
  private static instance: KeyboardShortcutDispatcher;

  private constructor() { }

  public static getInstance(): KeyboardShortcutDispatcher {
    if (!KeyboardShortcutDispatcher.instance) {
      KeyboardShortcutDispatcher.instance = new KeyboardShortcutDispatcher();
    }
    return KeyboardShortcutDispatcher.instance;
  }

  public dispatch(
    e: KeyboardEvent,
    config: KeyboardShortcutsConfig,
    context: ShortcutExecutionContext
  ): boolean {
    const closeKey = config.closeNowPlaying || 'Escape';
    if (KeyStrokeNormalizer.matches(e, closeKey) || e.key === 'Escape' || e.code === 'Escape') {
      if (context.isNowPlayingOpen && context.onCloseNowPlaying) {
        e.preventDefault();
        e.stopPropagation();
        context.onCloseNowPlaying();
        return true;
      }
    }

    if (KeyStrokeNormalizer.isTypingTarget(e)) {
      return false;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) {
      return false;
    }

    if (!context.hasTrack) {
      return false;
    }

    const playKey = config.playPause || 'Space';
    const isPlayMatch =
      KeyStrokeNormalizer.matches(e, playKey) ||
      (playKey.toLowerCase() === 'space' && (e.key === 'k' || e.key === 'K'));

    if (isPlayMatch) {
      e.preventDefault();
      context.togglePlay();
      return true;
    }

    const nextKey = config.nextTrack || 'n';
    if (KeyStrokeNormalizer.matches(e, nextKey)) {
      e.preventDefault();
      context.nextTrack();
      return true;
    }

    const prevKey = config.prevTrack || 'p';
    if (KeyStrokeNormalizer.matches(e, prevKey)) {
      e.preventDefault();
      context.prevTrack();
      return true;
    }

    const fwdKey = config.forward10 || 'l';
    const isFwdMatch =
      KeyStrokeNormalizer.matches(e, fwdKey) ||
      (fwdKey.toLowerCase() === 'l' && e.code === 'ArrowRight');

    if (isFwdMatch) {
      e.preventDefault();
      const current = context.currentTime || 0;
      const dur = context.duration || Infinity;
      const targetTime = Math.min(dur, current + 10);
      context.seek(targetTime);
      return true;
    }

    const rewKey = config.rewind10 || 'j';
    const isRewMatch =
      KeyStrokeNormalizer.matches(e, rewKey) ||
      (rewKey.toLowerCase() === 'j' && e.code === 'ArrowLeft');

    if (isRewMatch) {
      e.preventDefault();
      const current = context.currentTime || 0;
      const targetTime = Math.max(0, current - 10);
      context.seek(targetTime);
      return true;
    }

    return false;
  }
}
