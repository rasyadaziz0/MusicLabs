'use client';

import { Search as SearchIcon } from 'lucide-react';

interface SearchHeaderProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  searchMode: 'music' | 'users';
  setSearchMode: (mode: 'music' | 'users') => void;
}

export function SearchHeader({ inputValue, setInputValue, searchMode, setSearchMode }: SearchHeaderProps) {
  return (
    <div className="mb-10 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="relative group w-full md:w-[320px] lg:w-[400px]">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" size={16} />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search"
          className="bg-white/[0.08] border border-white/[0.04] rounded-[8px] py-[6px] pl-9 pr-4 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.12] transition-all text-white placeholder:text-white/50"
        />
      </div>

      {/* Toggle Music / Users */}
      <div className="flex bg-white/[0.06] rounded-[6px] p-[2px] border border-white/[0.04]">
        <button 
          onClick={() => setSearchMode('music')}
          className={`px-5 py-1 text-[13px] font-medium rounded-[4px] transition-colors ${searchMode === 'music' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
        >
          Music
        </button>
        <button 
          onClick={() => setSearchMode('users')}
          className={`px-5 py-1 text-[13px] font-medium rounded-[4px] transition-colors ${searchMode === 'users' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
        >
          Users
        </button>
      </div>
    </div>
  );
}
