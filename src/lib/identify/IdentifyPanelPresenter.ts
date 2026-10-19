import { IdentifyMode } from '@/types/hooks/identify';

export class IdentifyPanelPresenter {
  public static readonly TOTAL_STROKE_CIRCUMFERENCE = 380;

  /**
   * Calculates the SVG circle strokeDashoffset based on countdown percentage (0-100).
   */
  public static calculateStrokeDashOffset(countdownPercent: number): number {
    const clamped = Math.max(0, Math.min(100, countdownPercent));
    return (clamped / 100) * this.TOTAL_STROKE_CIRCUMFERENCE;
  }

  public static getIdleBadge(mode: IdentifyMode, t: (key: string) => string): string {
    return (mode === 'audd' ? t('identify.tap_to_identify') : t('identify.tap_to_speak')).toUpperCase();
  }

  public static getIdleTitle(mode: IdentifyMode, t: (key: string) => string): string {
    return mode === 'audd' ? t('identify.title') : 'Sing or Say';
  }

  public static getIdleDescription(mode: IdentifyMode): string {
    return mode === 'audd'
      ? "Keep your device close to the audio source. We'll listen for 8 seconds and find your song."
      : "Speak or sing the lyrics/title, and we'll match it against the music library.";
  }

  public static getRecordingBadge(mode: IdentifyMode, t: (key: string) => string): string {
    return (mode === 'audd' ? t('identify.listening') : t('identify.speak_now')).toUpperCase();
  }

  public static getRecordingTitle(mode: IdentifyMode, t: (key: string) => string): string {
    return mode === 'audd' ? t('identify.listening') : 'Listening for Voice...';
  }

  public static getRecordingSecondsStatus(secondsLeft: number): string {
    return secondsLeft > 0 ? `${secondsLeft} seconds left` : 'Analyzing...';
  }

  public static getProcessingDescription(mode: IdentifyMode): string {
    return mode === 'audd'
      ? 'Matching waveform against database...'
      : 'Searching matching songs for speech...';
  }

  public static getNoMatchDescription(mode: IdentifyMode, transcript?: string): string {
    if (mode === 'audd') {
      return "We couldn't recognize the song playing nearby. Try holding your microphone closer to the speaker.";
    }
    return `We couldn't find any songs matching "${transcript || ''}". Try speaking standard keywords.`;
  }

  public static getErrorMessage(errorMessage?: string): string {
    return errorMessage || 'An unexpected error occurred during audio recording.';
  }

  public static canManualSearch(mode: IdentifyMode, rawMatchTitle?: string | null): boolean {
    return Boolean(mode === 'audd' && rawMatchTitle);
  }
}
