import { Song } from '@/types/music';

export type IdentifyResultType = 'match' | 'no-match' | 'error';

export interface IdentifyResult {
  type: IdentifyResultType;
  match?: Song | null;
  rawMatch?: { title: string; artist: string; album?: string } | null;
  results?: Song[]; // for multiple matches like in speech mode
  errorMessage?: string;
}

export interface IIdentifyStrategy<Input = any> {
  execute(input: Input, authContext: { accessToken?: string }): Promise<IdentifyResult>;
}
