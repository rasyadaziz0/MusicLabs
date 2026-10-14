import { Search as SearchIcon } from 'lucide-react';

export interface SearchHeaderProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  searchMode: 'music' | 'users' | 'playlists';
  setSearchMode: (mode: 'music' | 'users' | 'playlists') => void;
  onCommit?: (val: string) => void;
}
