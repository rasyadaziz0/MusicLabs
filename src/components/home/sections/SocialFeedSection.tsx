import { SocialActivityCard } from '@/components/home/HomeCards';
import { User } from '@supabase/supabase-js';

interface SocialFeedSectionProps {
  user: User | null;
  socialFeed: any[];
  isSocialFeedLoading: boolean;
  playTrack: (song: any, context: any[]) => void;
}

export function SocialFeedSection({ user, socialFeed, isSocialFeedLoading, playTrack }: SocialFeedSectionProps) {
  if (!user) return null;

  return (
    <section className="px-2 pt-4">
      <div className="flex items-center gap-1 mb-4">
        <h2 className="text-[20px] font-bold text-white">Activity Feed</h2>
      </div>
      <div className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {isSocialFeedLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={`social-loading-${i}`}
              className="flex-shrink-0 w-[240px] md:w-[280px] h-[80px] rounded-[12px] bg-white/5 animate-pulse"
            />
          ))
        ) : socialFeed && socialFeed.length > 0 ? (
          socialFeed.map((item: any, index: number) => (
            <SocialActivityCard
              key={`${item.id}-social-${index}`}
              item={item}
              onPlay={() => playTrack(item.track, socialFeed.map((f: any) => f.track))}
            />
          ))
        ) : (
          <p className="text-sm text-muted">No recent activity from people you follow.</p>
        )}
      </div>
    </section>
  );
}
