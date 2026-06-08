'use client';

import { Search } from 'lucide-react';

interface LibrarySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function LibrarySearchBar({
  value,
  onChange,
  placeholder,
}: LibrarySearchBarProps) {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#FA243C]/40 focus:bg-white/[0.08] focus:outline-none transition-colors"
      />
    </div>
  );
}
