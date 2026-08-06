export interface SearchHeaderProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  searchMode: 'music' | 'users';
  setSearchMode: (mode: 'music' | 'users') => void;
  onCommit?: (val: string) => void;
}
