export interface TopNavigationProps {
  mode: 'audd' | 'speech';
  setMode: (mode: 'audd' | 'speech') => void;
  isSpeechSupported: boolean;
}
