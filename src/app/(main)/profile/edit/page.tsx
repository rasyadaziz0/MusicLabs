'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Loader2, Save, PenSquare } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateProfile, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setUsername(data.username || '');
          setName(data.display_name || user.user_metadata?.name || user.user_metadata?.full_name || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || '');
        }
        setIsFetching(false);
      };
      fetchProfile();
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // simple username validation
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (username && !usernameRegex.test(username)) {
      setError('Nama pengguna tidak boleh mengandung spasi dan hanya boleh berisi huruf, angka, garis bawah, dan titik.');
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await updateProfile({
      username: username.trim(),
      name: name.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (updateError) {
      setError(updateError);
      setIsSubmitting(false);
    } else {
      router.push('/profile');
    }
  };

  if (loading || !user || isFetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-white/50" size={32} />
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://music-labs-beryl.vercel.app');

  return (
    <div className="pb-32 pt-2 max-w-2xl mx-auto px-5 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Edit Profile</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Simpan
        </button>
      </div>

      {error && (
        <div className="p-4 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
          {error}
        </div>
      )}

      <form className="space-y-6">
        {/* Foto Profil */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12 pb-6 border-b border-white/10">
          <div className="w-full md:w-40">
            <span className="text-[15px] font-bold text-white">Foto profil</span>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white/5 group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar preview"
                  fill
                  sizes="128px"
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmYTIzM2IiLz48L3N2Zz4=';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C] to-[#FF6275]" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PenSquare className="text-white" size={24} />
              </div>
            </div>
            <div className="mt-4 w-full">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[14px] focus:outline-none focus:border-white/30 transition-all placeholder:text-white/30"
                placeholder="URL Gambar Profil"
              />
            </div>
          </div>
        </div>

        {/* Nama pengguna */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12 pb-6 border-b border-white/10">
          <div className="w-full md:w-40">
            <span className="text-[15px] font-bold text-white">Nama pengguna</span>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[14px] focus:outline-none focus:border-white/30 transition-all"
              placeholder="username"
            />
            <p className="mt-3 text-[13px] text-white/50">
              {appUrl}/@{username || 'username'}
            </p>
            <p className="mt-2 text-[12px] text-white/40 leading-relaxed">
              Nama pengguna hanya boleh berisi huruf, angka, garis bawah, dan titik. Nama pengguna harus unik.
            </p>
          </div>
        </div>

        {/* Nama */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12 pb-6 border-b border-white/10">
          <div className="w-full md:w-40">
            <span className="text-[15px] font-bold text-white">Nama</span>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[14px] focus:outline-none focus:border-white/30 transition-all"
              placeholder="Nama Lengkap"
            />
            <p className="mt-2 text-[12px] text-white/40 leading-relaxed">
              Nama panggilan Anda akan tampil di profil Anda.
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12 pb-6 border-b border-white/10">
          <div className="w-full md:w-40">
            <span className="text-[15px] font-bold text-white">Bio</span>
          </div>
          <div className="flex-1">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 80))}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[14px] focus:outline-none focus:border-white/30 transition-all resize-none"
              placeholder="Bio"
            />
            <div className="mt-2 text-[12px] text-white/40">
              {bio.length}/80
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
