export class SpeechRecognitionService {
  private recognition: any = null;
  private timeout: NodeJS.Timeout | null = null;
  
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start(
    lang: string,
    onResult: (transcript: string) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void,
    timeoutMs: number = 15000
  ): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech recognition not supported in this browser.');
      return;
    }

    if (this.recognition) {
      this.recognition.stop();
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = lang;
    this.recognition.interimResults = true;
    this.recognition.continuous = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      onResult(final || interim);
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        onError('Microphone access denied. Check browser permissions AND Windows Privacy Settings (Allow desktop apps to access microphone).');
      } else if (event.error === 'no-speech') {
        onError('No speech detected. Try again.');
      } else if (event.error !== 'aborted') {
        onError(`Speech recognition error: ${event.error}`);
      }
      this.cleanup();
      onEnd();
    };

    this.recognition.onend = () => {
      this.cleanup();
      onEnd();
    };

    this.recognition.start();

    this.timeout = setTimeout(() => {
      this.stop();
    }, timeoutMs);
  }

  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.cleanup();
  }

  public cleanup(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.recognition = null;
  }
}
