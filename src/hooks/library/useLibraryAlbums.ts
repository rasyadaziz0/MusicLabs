import {
    buildLibraryAlbums
} from '@/lib/library/deriveLibrary';
import { useMemo } from 'react';
// LOCAL IMPORTS
import { useLibraryCollectionData } from './useLibraryCollectionData';

export function useLibraryAlbums() {
  const collection = useLibraryCollectionData();
  const albums = useMemo(() => buildLibraryAlbums(collection.songs), [collection.songs]);

  return {
    ...collection,
    albums,
  };
}

