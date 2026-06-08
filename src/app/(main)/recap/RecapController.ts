import { Song } from '@/types/music';

export interface RecapContextAdapter {
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  monthLabel: string;
  topTracks: Song[];
  topArtists: any[];
  stats: any;
  hasData: boolean;
  isLoading: boolean;
  playTrack: (track: Song, queue?: Song[]) => void;
  user: any;
  signInWithGoogle: () => void;
}

export class RecapController {
  private adapter: RecapContextAdapter;

  constructor(adapter: RecapContextAdapter) {
    this.adapter = adapter;
  }

  get years(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2024; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get currentMonth(): number {
    return new Date().getMonth();
  }

  get isGuest(): boolean {
    return !this.adapter.user;
  }

  get monthLabel(): string {
    return this.adapter.monthLabel;
  }

  get month(): number {
    return this.adapter.month;
  }

  get year(): number {
    return this.adapter.year;
  }

  get isLoading(): boolean {
    return this.adapter.isLoading;
  }

  get hasData(): boolean {
    return this.adapter.hasData;
  }

  get stats(): any {
    return this.adapter.stats;
  }

  get topTracks(): Song[] {
    return this.adapter.topTracks;
  }

  get topArtists(): any[] {
    return this.adapter.topArtists;
  }

  setYear = (y: number) => {
    this.adapter.setYear(y);
  };

  setMonth = (m: number) => {
    this.adapter.setMonth(m);
  };

  signIn = () => {
    this.adapter.signInWithGoogle();
  };

  playTrack = (song: Song) => {
    this.adapter.playTrack(song, this.adapter.topTracks);
  };
}
