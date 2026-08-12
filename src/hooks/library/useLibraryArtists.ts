import {
    buildLibraryArtists
} from '@/lib/library/deriveLibrary';
import { useMemo } from 'react';
// LOCAL IMPORTS
import { useLibraryCollectionData } from './useLibraryCollectionData';

export function useLibraryArtists() {
  const collection = useLibraryCollectionData();
  const artists = useMemo(() => buildLibraryArtists(collection.songs), [collection.songs]);

  return {
    ...collection,
    artists,
  };
}

