'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { decodeQuery, encodeQuery } from '@/lib/utils/searchEncode';
import { useSearchUsers } from '@/hooks/useFollow';
import { useMusicSearch } from '@/hooks/useMusicSearch';

import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchCategories } from '@/components/search/SearchCategories';
import { UserSearchResults } from '@/components/search/UserSearchResults';
import { MusicSearchResults } from '@/components/search/MusicSearchResults';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function SearchPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') ?? '';
  const queryFromUrl = decodeQuery(rawQuery);
  
  const [inputValue, setInputValue] = useState(queryFromUrl);
  const debouncedQuery = useDebouncedValue(inputValue, 500);
  const query = debouncedQuery.trim();
  const [searchMode, setSearchMode] = useState<'music' | 'users'>('music');
  
  const lastPushedQueryRef = useRef(queryFromUrl);

  // Sync state if URL changes externally
  useEffect(() => {
    if (queryFromUrl !== lastPushedQueryRef.current) {
      setInputValue(queryFromUrl);
      lastPushedQueryRef.current = queryFromUrl;
    }
  }, [queryFromUrl]);

  // Push URL changes
  useEffect(() => {
    const currentQuery = queryFromUrl.trim();
    if (query === currentQuery) return;

    lastPushedQueryRef.current = query;

    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', encodeQuery(query));
    } else {
      params.delete('q');
    }

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [query, queryFromUrl, searchParams, pathname, router]);

  // Data Hooks
  const { data: usersData, isLoading: isUsersLoading } = useSearchUsers(searchMode === 'users' ? query : '');
  
  const {
    isLoading,
    isArtistSongsLoading,
    isArtistNameSongsLoading,
    rankedSongs,
    rankedArtists,
    displayedSongs,
    selectedArtist,
  } = useMusicSearch(searchMode === 'music' ? query : '');

  return (
    <>
      <SearchHeader
        inputValue={inputValue}
        setInputValue={setInputValue}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
      />

      {query.length > 2 ? (
        <div className="space-y-1">
          {searchMode === 'users' ? (
            <UserSearchResults
              isUsersLoading={isUsersLoading}
              usersData={usersData}
              query={query}
            />
          ) : (
            <MusicSearchResults
              isLoading={isLoading}
              rankedArtists={rankedArtists}
              displayedSongs={displayedSongs}
              query={query}
              isArtistSongsLoading={isArtistSongsLoading}
              isArtistNameSongsLoading={isArtistNameSongsLoading}
              selectedArtist={selectedArtist}
              rankedSongsLength={rankedSongs.length}
            />
          )}
        </div>
      ) : (
        <SearchCategories />
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
