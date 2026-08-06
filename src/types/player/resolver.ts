export type ResolveResultType =
  | 'youtube'   // Play via YouTube IFrame
  | 'html5'     // Play via HTML5 Audio (direct stream URL)
  | 'preview'   // Play via iTunes 30s preview
  | 'error';    // Nothing worked

export interface ResolveResult {
  type: ResolveResultType;
  videoId?: string;   // For 'youtube'
  audioUrl?: string;  // For 'html5' or 'preview'
}
