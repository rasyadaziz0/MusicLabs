import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import Image from 'next/image';
import { UserProfile } from '@/types/profile';
import { usePlaylistCollaborators, useAddCollaborator, useRemoveCollaborator } from '@/hooks/useCollaborators';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { useAuth } from '@/context/AuthContext';

interface CollaboratorModalProps {
  playlistId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaboratorModal({ playlistId, isOpen, onClose }: CollaboratorModalProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: collaborators = [] } = usePlaylistCollaborators(playlistId);
  const addMutation = useAddCollaborator();
  const removeMutation = useRemoveCollaborator();

  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await ProfileRepository.getInstance().searchUsers(query, 10);
        // Exclude current user from results
        setSearchResults(results.filter(u => u.id !== user?.id));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, user?.id]);

  if (!isOpen) return null;

  const isCollaborator = (userId: string) => collaborators.some(c => c.user_id === userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-6">Manage Collaborators</h2>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users to invite..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {query ? (
            // Search Results
            <div className="space-y-3">
              {isSearching ? (
                <div className="text-center text-sm text-white/50 py-4">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative">
                        {profile.avatar_url ? (
                          <Image src={profile.avatar_url} alt={profile.username || ''} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
                            {profile.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{profile.display_name || profile.username}</div>
                        <div className="text-xs text-white/50">@{profile.username}</div>
                      </div>
                    </div>
                    
                    {isCollaborator(profile.id) ? (
                      <button 
                        onClick={() => removeMutation.mutate({ playlistId, userId: profile.id })}
                        className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="Remove collaborator"
                      >
                        <Check size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => user && addMutation.mutate({ playlistId, userId: profile.id, addedBy: user.id })}
                        className="p-2 rounded-full bg-primary text-white hover:bg-primary/80 transition-colors"
                        title="Add collaborator"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-white/50 py-4">No users found</div>
              )}
            </div>
          ) : (
            // Current Collaborators
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Current Collaborators ({collaborators.length})</h3>
              {collaborators.length > 0 ? (
                <div className="space-y-3">
                  {collaborators.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative">
                          {c.profile?.avatar_url ? (
                            <Image src={c.profile.avatar_url} alt={c.profile.username || ''} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
                              {c.profile?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{c.profile?.display_name || c.profile?.username}</div>
                          <div className="text-xs text-white/50">@{c.profile?.username}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeMutation.mutate({ playlistId, userId: c.user_id })}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-white/50 py-4">No collaborators yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
