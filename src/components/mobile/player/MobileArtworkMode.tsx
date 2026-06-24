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
        padding: '0 4px',
      }}>
        <motion.div
          layoutId={`artwork-${currentTrack.id}`}
          animate={{
            scale: isPlaying ? 1 : 0.88,
            borderRadius: isPlaying ? 12 : 12,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'relative', width: '100%', maxWidth: 360,
            aspectRatio: '1', borderRadius: 12,
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
        marginTop: 24, marginBottom: 20,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <motion.div
            key={currentTrack.id + '-title'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
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

        {/* Like + More */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleLike} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            {toggleLikeMutation.isPending 
              ? <Loader2 size={20} className="animate-spin" /> 
              : <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? "text-[#fa233b]" : ""} strokeWidth={isLiked ? 0 : 2} />
            }
          </button>
          
          <div ref={moreMenuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }} 
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Ellipsis size={20} />
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
