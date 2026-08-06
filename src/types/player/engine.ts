export interface Html5EngineCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

export interface RadioMeta {
  title: string;
  station: string;
}

export type ActiveEngine = 'youtube' | 'html5' | 'radio' | 'none';


export interface RadioEngineCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onMetaUpdate: (meta: RadioMeta) => void;
  onError?: (errorMsg: string) => void;
}

export interface YouTubeEngineCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onDuration: (duration: number) => void;
  onError: (errorCode: number) => void;
}
