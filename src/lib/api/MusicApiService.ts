import * as Module from './music';

export class MusicApiService {
  static get apiFetchInternal() { return Module.apiFetchInternal; }
  static get resolveAudioUrl() { return Module.resolveAudioUrl; }
  static get searchSongs() { return Module.searchSongs; }
  static get searchArtists() { return Module.searchArtists; }
  static get searchAll() { return Module.searchAll; }
  static get searchAlbums() { return Module.searchAlbums; }
  static get getHomeFeed() { return Module.getHomeFeed; }
  static get getArtistInfo() { return Module.getArtistInfo; }
  static get getArtistTopTracks() { return Module.getArtistTopTracks; }
  static get getArtistSongs() { return Module.getArtistSongs; }
  static get getArtistAlbums() { return Module.getArtistAlbums; }
  static get getSong() { return Module.getSong; }
  static get getAlbum() { return Module.getAlbum; }
  static get getSongsByIds() { return Module.getSongsByIds; }
  static get getSongLyrics() { return Module.getSongLyrics; }
}
