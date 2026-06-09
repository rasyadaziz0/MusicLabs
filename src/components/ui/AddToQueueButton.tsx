'use client';

import { ListPlus } from 'lucide-react';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/context/PlayerContext';
import { useState } from 'react';
import { ContextMenuItem } from './context-menu/ContextMenuItem';

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

  if (showText) {
    return (
      <ContextMenuItem
        icon={added ? <span className="text-[10px] font-bold text-[#FA243C] uppercase tracking-wider">Added</span> : <ListPlus size={15} />}
        label="Add to Queue"
        onClick={handleAdd}
        className={className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={cn(
        'inline-flex items-center justify-center transition-colors h-9 w-9 rounded-full border border-white/10 bg-white/5 text-muted hover:text-white',
        className
      )}
      title="Add to queue"
      aria-label="Add to queue"
    >
      {added ? <span className="text-[10px] text-[#FA243C] font-bold uppercase tracking-wider px-1">Added</span> : <ListPlus size={16} />}
    </button>
  );
}
