import { Song } from '@/types/music';


  export function normalizeSearchText(value: string) {
    return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  export function getMatchScore(text: string, query: string) {
    if (!text) return 0;
    if (text === query) return 120;
    if (text.startsWith(query)) return 80;
    if (text.includes(query)) return 50;

    const queryWords = query.split(' ').filter(Boolean);
    let matchedWords = 0;
    for (const w of queryWords) {
      if (text.includes(w)) matchedWords++;
    }
    if (matchedWords > 0) {
      return matchedWords * 10;
    }

    return 0;
  }

  export function isArtistMatch(song: Song, artistName: string) {
    const target = normalizeSearchText(artistName);
    if (!target) return false;

    const names = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
      .map((a) => normalizeSearchText(a.name))
      .filter(Boolean);

    return names.some((name) =>
      name === target
      || name.startsWith(target)
      || target.startsWith(name)
      || name.includes(target)
    );
  }

