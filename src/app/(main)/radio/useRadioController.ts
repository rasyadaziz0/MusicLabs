import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchRadioStations, searchRadioByName, radioStationToSong } from '@/lib/api/radioApi';
import { RadioStation } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';

export const CATEGORIES = [
  { key: 'all', label: 'All Stations' },
  { key: 'pop', label: 'Pop' },
  { key: 'rock', label: 'Rock' },
  { key: 'jazz', label: 'Jazz' },
  { key: 'islamic', label: 'Islamic' },
  { key: 'news', label: 'News' },
  { key: 'dangdut', label: 'Dangdut' },
  { key: 'classical', label: 'Classical' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export function useRadioController() {
  const { currentTrack, isPlaying, isResolving, playTrack, togglePlay, isRadio, radioMeta } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  // Fetch Indonesian stations
  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['radioStations', 'ID'],
    queryFn: () => searchRadioStations('ID', 100),
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // Search query — searches globally
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['radioSearch', searchQuery],
    queryFn: () => searchRadioByName(searchQuery, 30),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  const handlePlayStation = (station: RadioStation) => {
    const song = radioStationToSong(station);
    // Check if this station is already playing
    if (currentTrack?.id === song.id && isRadio) {
      togglePlay();
    } else {
      playTrack(song);
    }
  };

  const filteredStations = (() => {
    const list = searchQuery.length >= 2 ? searchResults : stations;
    if (activeCategory === 'all') return list;
    return list.filter((s: RadioStation) => {
      const tags = s.tags.toLowerCase();
      const name = s.name.toLowerCase();
      return tags.includes(activeCategory) || name.includes(activeCategory);
    });
  })();

  const isStationPlaying = (station: RadioStation) => {
    return currentTrack?.id === `radio_${station.stationuuid}` && isRadio;
  };

  return {
    currentTrack,
    isPlaying,
    isResolving,
    togglePlay,
    isRadio,
    radioMeta,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    isLoading,
    isSearching,
    filteredStations,
    handlePlayStation,
    isStationPlaying,
  };
}
