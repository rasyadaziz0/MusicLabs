'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Heart } from 'lucide-react';
import { MoreMenu } from '@/components/player/NowPlayingUI';

interface MobileArtworkModeProps {
  currentTrack: any;
  coverUrl: string | null;
  isPlaying: boolean;
  isPreview: boolean;
  isLiked: boolean;
  toggleLikeMutation: any;
  handleToggleLike: (e?: any) => void;
  onClose: () => void;
  nowPlayingProps: any; // The original props from MobileNowPlayingUI to pass to MoreMenu
}

export function MobileArtworkMode({
  currentTrack, coverUrl, isPlaying, isPreview, isLiked, toggleLikeMutation, handleToggleLike, onClose, nowPlayingProps
}: MobileArtworkModeProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Artwork ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px',
      }}>
        <motion.div
          animate={{
            scale: isPlaying ? 1 : 0.88,
            borderRadius: isPlaying ? 12 : 12,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.8 }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, paddingTop: 2 }}>
          <button
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex',
              color: isLiked ? '#FA243C' : 'rgba(255,255,255,0.5)',
              transition: 'color 0.2s ease',
            }}
          >
            {toggleLikeMutation.isPending
              ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              : <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 1.8} />
            }
          </button>
          <MoreMenu {...nowPlayingProps} openMenuUpward={true} />
        </div>
      </div>
    </div>
  );
}
