'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import Image from 'next/image';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateProfile, loading } = useAuth();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setName(user.user_metadata?.name || user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: updateError } = await updateProfile({
      name: name.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (updateError) {
      setError(updateError);
      setIsSubmitting(false);
    } else {
      router.push('/profile');
    }
  };

  if (loading || !user) return null;

  return (
    <div className="pb-32 pt-2 max-w-2xl mx-auto px-5 md:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden ring-[3px] ring-[#FA243C]/30 bg-white/5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar preview"
                fill
                sizes="128px"
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmYTIzM2IiLz48L3N2Zz4='; // fallback to red square
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FA243C] to-[#FF6275]" />
            )}
          </div>
          <p className="text-[13px] text-white/50">Avatar Preview</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[13px] font-semibold text-white/70 mb-2">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[15px] focus:outline-none focus:border-[#FA243C]/50 focus:ring-1 focus:ring-[#FA243C]/50 transition-all placeholder:text-white/30"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-[13px] font-semibold text-white/70 mb-2">
              Avatar Image URL
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[15px] focus:outline-none focus:border-[#FA243C]/50 focus:ring-1 focus:ring-[#FA243C]/50 transition-all placeholder:text-white/30"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="mt-2 text-[12px] text-white/40">
              Provide a direct link to an image.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FA243C] text-white font-bold hover:bg-[#FA243C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </form>
    </div>
  );
}
