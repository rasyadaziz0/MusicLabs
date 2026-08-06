export type IdentifyMode = 'audd' | 'speech';
export type IdentifyState = 'idle' | 'recording' | 'processing' | 'results' | 'error' | 'no-match';


export interface UseIdentifyQuotaReturn {
  remaining: number;
  used: number;
  isExhausted: boolean;
  consume: () => void;
  isLoading: boolean;
}