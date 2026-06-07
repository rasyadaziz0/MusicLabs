'use client';

import { ListPlus, Plus } from 'lucide-react';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/context/PlayerContext';
import { useState } from 'react';

interface AddToQueueButtonProps {
  track: Song;
  className?: string;
  showText?: boolean;
}

export default function AddToQueueButton({ track, className, showText = false }: AddToQueueButtonProps) {
  const { addToQueue } = usePlayer();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addToQueue(track);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={cn(
        'inline-flex items-center justify-center transition-colors',
        showText ? 'w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 flex items-center justify-between group' : 'h-9 w-9 rounded-full border border-white/10 bg-white/5 text-muted hover:text-white',
        className
      )}
      title="Add to queue"
      aria-label="Add to queue"
    >
      {showText ? (
        <>
          <span>Add to Queue</span>
          <span className="text-white/40 group-hover:text-white/80 transition-colors">
            {added ? <span className="text-xs text-[#FA243C]">Added</span> : <ListPlus size={15} />}
          </span>
        </>
      ) : (
        added ? <span className="text-xs text-[#FA243C] font-medium px-1">Added</span> : <ListPlus size={16} />
      )}
    </button>
  );
}
