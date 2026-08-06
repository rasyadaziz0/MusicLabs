import { Innertube, UniversalCache } from 'youtubei.js';
import path from 'path';

let innertubePromise: Promise<Innertube> | null = null;
let lastInit = 0;
const TTL = 1000 * 60 * 10;
const CACHE_DIR = process.env.INNERTUBE_CACHE_DIR ?? path.resolve(process.cwd(), '.cache/innertube');

export async function getInnertube(forceRefresh = false): Promise<Innertube> {
  if (forceRefresh || (innertubePromise && Date.now() - lastInit > TTL)) {
    innertubePromise = null;
  }
  
  if (!innertubePromise) {
    lastInit = Date.now();
    innertubePromise = Innertube.create({
      // VPS filesystem is persistent, enable cache with explicit path for Docker non-root user
      cache: new UniversalCache(true, CACHE_DIR),
      generate_session_locally: true,
      retrieve_player: true,
    }).catch((err) => {
      innertubePromise = null;
      throw err;
    });
  }
  
  return innertubePromise;
}
