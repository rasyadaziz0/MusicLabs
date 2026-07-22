import { formatTime } from '@/lib/utils';

interface EmbedProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/** Shared progress bar/scrubber for embed players. */
export function EmbedProgressBar({ currentTime, duration, onSeek }: EmbedProgressBarProps) {
  const displayTime = Math.min(currentTime, duration);
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div className="flex-1 flex items-center gap-[10px]">
      <span className="text-[11px] font-medium text-[#86868b] w-7 text-right tabular-nums">
        {formatTime(displayTime)}
      </span>

      <div
        className="flex-1 h-1.5 bg-[#d2d2d7] rounded-full cursor-pointer relative group flex items-center"
        onClick={onSeek}
      >
        <div
          className="absolute left-0 h-full bg-[#86868b] rounded-full transition-all duration-100 ease-linear pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute w-3.5 h-3.5 bg-[#86868b] rounded-full shadow-sm pointer-events-none"
          style={{ left: `calc(${progressPercent}% - 7px)` }}
        />
      </div>

      <span className="text-[11px] font-medium text-[#86868b] w-8 tabular-nums text-right">
        -{formatTime(duration - displayTime)}
      </span>
    </div>
  );
}
