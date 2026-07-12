'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Heart, Ellipsis } from 'lucide-react';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

interface MobileArtworkModeProps {
  currentTrack: any;
  coverUrl: string | null;
  isPlaying: boolean;
  isPreview: boolean;
  isLiked: boolean;
  toggleLikeMutation: any;
  handleToggleLike: (e?: any) => void;
  onClose: () => void;
}

export function MobileArtworkMode({
  currentTrack, coverUrl, isPlaying, isPreview, isLiked, toggleLikeMutation, handleToggleLike, onClose
}: MobileArtworkModeProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Artwork ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px', minHeight: 0,
      }}>
        <motion.div
          layoutId={`artwork-${currentTrack.id}`}
          animate={{
            scale: isPlaying ? 1 : 0.88,
            borderRadius: isPlaying ? 12 : 12,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'relative', width: '100%', maxWidth: 'min(100%, 360px, 38vh)',
            aspectRatio: '1 / 1', borderRadius: 12,
            overflow: 'hidden', background: '#1a1a2a',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {coverUrl && (
            <Image
              src={coverUrl}
              alt={currentTrack.name}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
          {isPreview && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              padding: '4px 12px', borderRadius: 999,
              fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.8px', fontWeight: 700,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              Preview
            </span>
          )}
        </motion.div>
      </div>

      {/* ── Track info + Like ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        marginTop: 14, marginBottom: 8, flexShrink: 0,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <motion.div
            key={currentTrack.id + '-title'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              fontSize: 21, fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.4px', lineHeight: 1.25,
            }}
          >
            {currentTrack.name}
          </motion.div>
          <motion.div
            key={currentTrack.id + '-artist'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              marginTop: 3, fontSize: 17, fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.2px',
            }}
          >
            {currentTrack.artists.primary.map((a: any, i: number) => (
              <span key={a.id}>
                <Link
                  href={`/artist/${a.id}`}
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {a.name}
                </Link>
                {i < currentTrack.artists.primary.length - 1 && ', '}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Apple Music Style: Heart + More Pill/Circles */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <button 
            onClick={handleToggleLike} 
            className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-md hover:bg-white/20"
            title={isLiked ? "Hapus dari Favorit" : "Favorit"}
          >
            {toggleLikeMutation.isPending 
              ? <Loader2 size={16} className="animate-spin text-white/80" /> 
              : <Heart size={16} fill={isLiked ? '#FA243C' : 'none'} className={isLiked ? "text-[#FA243C]" : "text-white/80"} strokeWidth={isLiked ? 0 : 2} />
            }
          </button>
          
          <div ref={moreMenuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }} 
              className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-md hover:bg-white/20"
              title="Lainnya"
            >
              <Ellipsis size={16} />
            </button>
            <TrackContextMenu
              track={currentTrack}
              isOpen={isMoreMenuOpen}
              position={null}
              onClose={() => setIsMoreMenuOpen(false)}
              showPlayerControls={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
