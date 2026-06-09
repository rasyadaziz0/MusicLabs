'use client';

import { Clock, X, TrendingUp } from 'lucide-react';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { SearchCategories } from './SearchCategories';

export function RecentAndTrending({ onSearch }: { onSearch: (query: string) => void }) {
  const { recentSearches, removeSearch, clearAll } = useRecentSearches();

  const curatedTrending = ['Taylor Swift', 'New Releases', 'Top 50', 'Pop Hits', 'Viral 50'];

  return (
    <div className="space-y-10">
      {recentSearches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-white">Recent Searches</h2>
            <button onClick={clearAll} className="text-xs font-medium text-white/50 hover:text-white transition-colors">
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search) => (
              <div key={search} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-4 pr-3 py-2 transition-colors group cursor-pointer" onClick={() => onSearch(search)}>
                <Clock size={14} className="text-white/50" />
                <span className="text-sm font-medium text-white">{search}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSearch(search); }} 
                  className="p-1 ml-1 text-white/30 hover:text-white transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-[20px] font-bold text-white">Trending</h2>
        <div className="flex flex-wrap gap-2">
          {curatedTrending.map((search) => (
            <div key={search} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full px-4 py-2 transition-colors cursor-pointer" onClick={() => onSearch(search)}>
              <TrendingUp size={14} className="text-white/50" />
              <span className="text-sm font-medium text-white">{search}</span>
            </div>
          ))}
        </div>
      </div>

      <SearchCategories />
    </div>
  );
}
