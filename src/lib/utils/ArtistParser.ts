import * as Module from './artist';

export class ArtistParser {
  static get stripArtistIdPrefix() { return Module.stripArtistIdPrefix; }
  static get isSearchBasedId() { return Module.isSearchBasedId; }
  static get isDummyArtist() { return Module.isDummyArtist; }
  static get getArtistLink() { return Module.getArtistLink; }
  static get parse() { return Module.parse; }
  static get createUnknownArtist() { return Module.createUnknownArtist; }
}
