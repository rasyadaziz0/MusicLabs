export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private timer: NodeJS.Timeout | null = null;
  private resolveCallback: ((value: string | null) => void) | null = null;

  public async start(
    durationMs: number,
    onStop: (base64: string | null) => void,
    onError: (err: unknown) => void
  ): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone not supported in this browser.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;

      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      const chunks: Blob[] = [];
      this.resolveCallback = onStop;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.stopStream();
        if (chunks.length === 0) {
          if (this.resolveCallback) this.resolveCallback(null);
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1] || null;
          if (this.resolveCallback) this.resolveCallback(base64);
        };
        reader.onerror = () => {
          if (this.resolveCallback) this.resolveCallback(null);
        };
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        onError(event);
        this.stopStream();
        if (this.resolveCallback) this.resolveCallback(null);
      };

      this.mediaRecorder.start();

      this.timer = setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, durationMs);
    } catch (err) {
      onError(err);
      this.stopStream();
    }
  }

  public stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    } else {
      this.stopStream();
    }
  }

  public cleanup(): void {
    this.stopStream();
  }

  private stopStream(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  private getSupportedMimeType(): string {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return 'audio/webm';
  }
}
