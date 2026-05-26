'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCreatePlaylist } from '@/hooks/useMusicLibrary';
import { Music, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const createPlaylistMutation = useCreatePlaylist();
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverUrl: '',
    isPublic: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const friendlyCreatePlaylistError =
    'Playlist belum bisa dibuat sekarang. Coba lagi sebentar lagi.';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setErrorMessage('Nama playlist wajib diisi.');
      return;
    }

    setErrorMessage('');

    createPlaylistMutation.mutate(form, {
      onSuccess: (playlist) => {
        router.push(`/playlist/${playlist.id}`);
      },
      onError: (error: Error) => {
        console.error('Create playlist gagal:', error);
        setErrorMessage(friendlyCreatePlaylistError);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl pt-10 px-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-white">New Playlist</h1>
        {user && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-1.5 text-[13px] font-semibold text-[#FA243C] hover:bg-[#FA243C]/10 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-playlist-form"
              disabled={createPlaylistMutation.isPending || !form.name.trim()}
              className="px-4 py-1.5 text-[13px] font-semibold bg-[#FA243C] text-white rounded-md hover:bg-[#FA243C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        )}
      </div>

      {!user ? (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-[#1c1c1e] rounded-xl border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Music size={32} className="text-[#FA243C]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Create Your Playlist</h2>
          <p className="text-white/60 text-[14px] max-w-sm mb-6">
            Sign in to create custom playlists, save your favorite tracks, and build your music library.
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="px-6 py-2.5 rounded-lg bg-[#FA243C] text-white text-[14px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
          >
            Sign In with Google
          </button>
        </div>
      ) : (
        <div className="bg-[#1c1c1e] border border-white/5 rounded-xl p-6 sm:p-8 shadow-2xl">
          <form
            id="create-playlist-form"
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-8"
          >
            {/* Left: Cover Image Area */}
            <div className="flex-shrink-0 flex flex-col gap-4 items-center sm:items-start w-full sm:w-auto">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-md group">
                {form.coverUrl ? (
                  <Image
                    src={form.coverUrl}
                    alt="Cover Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/20">
                    <Music size={64} strokeWidth={1} />
                  </div>
                )}
                
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-white/90 text-xs font-semibold tracking-wider">PREVIEW</span>
                </div>
              </div>
              <input
                type="text"
                value={form.coverUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, coverUrl: event.target.value }))
                }
                placeholder="Paste Image URL here..."
                className="w-full sm:w-56 text-[13px] bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FA243C]/50 focus:bg-white/10 transition-colors"
              />
            </div>

            {/* Right: Info Inputs */}
            <div className="flex-1 space-y-6">
              <div>
                <label htmlFor="name" className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 ml-1">
                  Name
                </label>
                <input
                  id="name"
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Give your playlist a name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[15px] font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-[#FA243C] focus:bg-white/10 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 ml-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  placeholder="What's this playlist about?"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#FA243C] focus:bg-white/10 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isPublic}
                  onClick={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.isPublic ? 'bg-[#FA243C]' : 'bg-white/10'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.isPublic ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <div>
                  <span className="text-[14px] font-medium text-white">Public Playlist</span>
                  <p className="text-[12px] text-white/50">Allow anyone to listen to this playlist</p>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
