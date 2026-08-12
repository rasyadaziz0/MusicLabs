/**
 * @deprecated Use standalone functions from './slug' instead.
 * This shim is kept temporarily to avoid massive file changes in one go.
 */
import * as Module from './slug';

export class SlugHelper {
  /** @deprecated use `slugify()` from './slug' */
  static get slugify() { return Module.slugify; }
  /** @deprecated use `stripTrackIdPrefix()` from './slug' */
  static get stripTrackIdPrefix() { return Module.stripTrackIdPrefix; }
  /** @deprecated use `restoreTrackId()` from './slug' */
  static get restoreTrackId() { return Module.restoreTrackId; }
  /** @deprecated use `buildArtistSlug()` from './slug' */
  static get buildArtistSlug() { return Module.buildArtistSlug; }
  /** @deprecated use `buildTrackPath()` from './slug' */
  static get buildTrackPath() { return Module.buildTrackPath; }
}
