export interface MoodConfig {
  key: string;
  label: string;
  queries: readonly string[];
  include: readonly string[];
  exclude: readonly string[];
}

export type MoodKey = 'fokus' | 'galau' | 'semangat' | 'santai' | string;
