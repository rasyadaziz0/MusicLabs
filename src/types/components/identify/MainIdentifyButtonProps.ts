export interface MainIdentifyButtonProps {
  mode: 'audd' | 'speech';
  state: 'idle' | 'recording' | 'processing' | 'results' | 'no-match' | 'error';
  quota: { isExhausted: boolean; remaining: number };
  recorder: { secondsLeft: number };
  speech: { transcript: string };
  handleAuddIdentify: () => void;
  handleSpeechStart: () => void;
  handleCancel: () => void;
}
