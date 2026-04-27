'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCreatePlaylist } from '@/hooks/useMusicLibrary';

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const createPlaylistMutation = useCreatePlaylist();
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverUrl: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

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
        setErrorMessage(error.message || 'Gagal bikin playlist.');
      },
    });
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">Create</p>
          <h1 className="text-4xl font-display font-bold">New Playlist</h1>
          <p className="mt-3 text-muted">
            Bikin playlist pribadi kamu, terus isi dari search, liked songs, atau player bar.
          </p>
        </section>

        {!user ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Login dulu buat bikin playlist</h2>
            <p className="mt-2 text-muted">Playlist bakal disimpan ke akun Supabase kamu.</p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Login with Google
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
                Nama Playlist
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contoh: Late Night Drive"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition-colors focus:border-primary/50"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                Deskripsi
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                placeholder="Mood, genre, atau kegunaan playlist ini..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition-colors focus:border-primary/50"
              />
            </div>

            <div>
              <label htmlFor="coverUrl" className="mb-2 block text-sm font-medium text-white">
                Cover URL
              </label>
              <input
                id="coverUrl"
                value={form.coverUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, coverUrl: event.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition-colors focus:border-primary/50"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={createPlaylistMutation.isPending}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {createPlaylistMutation.isPending ? 'Creating...' : 'Create Playlist'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/library')}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
