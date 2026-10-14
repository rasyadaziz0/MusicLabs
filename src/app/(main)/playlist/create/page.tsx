'use client';

import PlaylistImporter from '@/components/playlist/PlaylistImporter';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useCreatePlaylist } from '@/hooks/library/useCreatePlaylist';
import { uploadImage } from '@/lib/utils/uploadImage';
import { gooeyToast as toast } from 'goey-toast';
import { AlertCircle, ListMusic, Loader2, Music, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

function CreatePlaylistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInWithGoogle } = useAuth();
  const { flags } = useFeatureFlags();

  const initialTab = searchParams.get('tab') === 'import' ? 'import' : 'create';
  const [activeTab, setActiveTab] = useState<'create' | 'import'>(initialTab);

  const createPlaylistMutation = useCreatePlaylist();
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverUrl: '',
    isPublic: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const friendlyCreatePlaylistError =
    'Playlist belum bisa dibuat sekarang. Coba lagi sebentar lagi.';

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const url = await uploadImage(file, 'playlists');
      setForm((current) => ({ ...current, coverUrl: url }));
      toast.success('Cover uploaded successfully!');
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

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
    <div className="mx-auto max-w-4xl pt-6 sm:pt-10 px-4 sm:px-6 pb-36">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-white">
          {activeTab === 'import' ? 'Import Playlist' : 'New Playlist'}
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3.5 py-1.5 text-[13px] font-semibold text-[#FA243C] hover:bg-[#FA243C]/10 active:bg-[#FA243C]/20 rounded-md transition-colors"
          >
            Cancel
          </button>
          {activeTab === 'create' && user && (
            <button
              type="submit"
              form="create-playlist-form"
              disabled={createPlaylistMutation.isPending || !form.name.trim()}
              className="px-4 py-1.5 text-[13px] font-semibold bg-[#FA243C] text-white rounded-md hover:bg-[#FA243C]/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          )}
        </div>
      </div>

      {/* Top Segmented Controls: Buat Manual vs Import Playlist (Simple, Dark, Clean) */}
      {flags.feature_import_playlist && (
        <div className="flex p-1 rounded-xl bg-[#1c1c1e] border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Music size={15} />
            <span>Buat Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'import'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ListMusic size={15} />
            <span>Import Playlist</span>
          </button>
        </div>
      )}

      {/* Tab: Import Playlist */}
      {activeTab === 'import' && flags.feature_import_playlist ? (
        <PlaylistImporter />
      ) : (
        /* Tab: Buat Manual */
        !user ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-[#1c1c1e] rounded-xl border border-white/5 p-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Music size={32} className="text-[#FA243C]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Create Your Playlist</h2>
            <p className="text-white/60 text-[14px] max-w-sm mb-6">
              Sign in to create custom playlists, save your favorite tracks, and build your music library.
            </p>
            <button
              type="button"
              onClick={() => signInWithGoogle('/playlist/create')}
              className="px-6 py-2.5 rounded-lg bg-[#FA243C] text-white text-[14px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          <div className="bg-[#1c1c1e] border border-white/5 rounded-xl p-5 sm:p-8">
            <form
              id="create-playlist-form"
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-8"
            >
              {/* Left: Cover Image Area */}
              <div className="flex-shrink-0 flex flex-col gap-4 items-center sm:items-start w-full sm:w-auto">
                <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
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

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white/90 text-xs font-semibold tracking-wider">PREVIEW</span>
                  </div>
                </div>
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors text-white text-[13px] font-medium w-full sm:w-56 mt-2">
                  {isUploadingCover ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isUploadingCover ? 'Uploading...' : 'Upload Cover'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={isUploadingCover} />
                </label>
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

                <ToggleSwitch
                  checked={form.isPublic}
                  onChange={(checked) => setForm(prev => ({ ...prev, isPublic: checked }))}
                  label="Public Playlist"
                  description="Allow anyone to listen to this playlist"
                />

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )
      )}
    </div>
  );
}

export default function CreatePlaylistPage() {
  return (
    <Suspense fallback={null}>
      <CreatePlaylistContent />
    </Suspense>
  );
}
