// LOCAL IMPORTS
import { useLibraryCollectionData } from './useLibraryCollectionData';

export function useLibrarySongs() {
  const collection = useLibraryCollectionData();
  return {
    ...collection,
    songs: collection.songs,
  };
}

