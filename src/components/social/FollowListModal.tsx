'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { useFollowersList, useFollowingList } from '@/hooks/useFollow';
import UserCard from '@/components/ui/UserCard';

type TabType = 'followers' | 'following';

interface FollowListModalProps {
  userId: string;
  initialTab?: TabType;
  isOpen: boolean;
  onClose: () => void;
  followerCount: number;
  followingCount: number;
}

export default function FollowListModal({
  userId,
  initialTab = 'followers',
  isOpen,
  onClose,
  followerCount,
  followingCount,
}: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const { data: followers = [], isLoading: isFollowersLoading } = useFollowersList(
    isOpen && activeTab === 'followers' ? userId : null
  );

  const { data: following = [], isLoading: isFollowingLoading } = useFollowingList(
    isOpen && activeTab === 'following' ? userId : null
  );

  const currentList = activeTab === 'followers' ? followers : following;
  const isLoading = activeTab === 'followers' ? isFollowersLoading : isFollowingLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-[101] max-h-[75vh] flex flex-col bg-[#1a1a1e]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-[#FA243C]" />
                <h2 className="text-[18px] font-bold text-white tracking-tight">Connections</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
              >
                <X size={16} className="text-white/70" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-5 gap-1 mb-1">
              <TabButton
                active={activeTab === 'followers'}
                onClick={() => setActiveTab('followers')}
                label="Followers"
                count={followerCount}
              />
              <TabButton
                active={activeTab === 'following'}
                onClick={() => setActiveTab('following')}
                label="Following"
                count={followingCount}
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mx-5" />

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-2 px-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="w-11 h-11 rounded-full bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 bg-white/5 rounded" />
                        <div className="h-3 w-16 bg-white/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentList.length > 0 ? (
                currentList.map((userProfile) => (
                  <UserCard
                    key={userProfile.id}
                    userId={userProfile.id}
                    username={userProfile.username}
                    displayNameProfile={userProfile.display_name}
                    bio={userProfile.bio}
                    avatarUrl={userProfile.avatar_url}
                    showFollowButton={true}
                    onClick={() => {
                      onClose();
                      window.location.href = userProfile.username ? `/@${userProfile.username}` : `/user/${userProfile.id}`;
                    }}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users size={40} className="text-white/10 mb-3" />
                  <p className="text-[14px] text-white/40">
                    {activeTab === 'followers'
                      ? 'No followers yet'
                      : 'Not following anyone yet'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors
        ${active
          ? 'text-white bg-white/[0.08]'
          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
        }
      `}
    >
      {label}
      <span className={`ml-1.5 text-[12px] tabular-nums ${active ? 'text-[#FA243C]' : 'text-white/30'}`}>
        {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
      </span>
    </button>
  );
}
