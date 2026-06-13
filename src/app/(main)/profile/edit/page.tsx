'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Loader2, Save, PenSquare, Camera, Upload } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/utils/uploadImage';

// Instagram icon (not in this lucide version)
function InstagramIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// TikTok icon (not in lucide)
function TikTokIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.35 8.35 0 0 0 4.76 1.49V6.69h-1z" />
    </svg>
  );
}

// X/Twitter icon
function XIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateProfile, signOut, loading } = useAuth();

  // Profile fields
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Social links
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  // Upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadImage(file, 'avatars');
      setAvatarUrl(url);
      
      // Auto-save to DB so it doesn't revert
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      
      toast.success('Avatar uploaded successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingBanner(true);
    try {
      const url = await uploadImage(file, 'banners');
      setBannerUrl(url);
      
      // Auto-save to DB so it doesn't revert
      await supabase.from('profiles').update({ banner_url: url }).eq('id', user.id);
      
      toast.success('Banner uploaded successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to upload banner');
    } finally {
      setIsUploadingBanner(false);
    }
  };

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
          setBannerUrl(data.banner_url || '');
          setSocialInstagram(data.social_instagram || '');
          setSocialTwitter(data.social_twitter || '');
          setSocialTiktok(data.social_tiktok || '');
          setSocialTiktok(data.social_tiktok || '');
        }
        setIsFetching(false);
      };
      fetchProfile();
    }
  }, [user, loading, router]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (username && !usernameRegex.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and periods.');
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await updateProfile({
      username: username.trim(),
      name: name.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      socialInstagram: socialInstagram.trim(),
      socialTwitter: socialTwitter.trim(),
      socialTiktok: socialTiktok.trim(),
    });

    if (updateError) {
      setError(updateError);
      setIsSubmitting(false);
    } else {
      toast.success('Profile updated!');
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: PROFILE
         ═══════════════════════════════════════════════════════════ */}
      <SectionHeader title="Profile" />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        {/* Banner */}
        <div className="relative h-[140px] w-full overflow-hidden bg-gradient-to-r from-[#FA243C]/20 to-[#FF6275]/10 group">
          {bannerUrl && (
            <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/80 cursor-pointer hover:bg-black/60 transition-colors">
              {isUploadingBanner ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={isUploadingBanner} />
            </label>
          </div>
        </div>

        {/* Avatar */}
        <SettingsRow label="Profile Photo" hasBorder>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/5 shrink-0 group">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill sizes="64px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C] to-[#FF6275]" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer flex items-center justify-center w-full h-full">
                  {isUploadingAvatar ? <Loader2 size={16} className="animate-spin text-white" /> : <Upload size={16} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors text-white text-[13px] font-medium max-w-fit">
                {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isUploadingAvatar ? 'Uploading...' : 'Upload Picture'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
              <p className="text-[11px] text-white/40">Recommended 500x500px, JPG/PNG, max 5MB.</p>
            </div>
          </div>
        </SettingsRow>

        {/* Username */}
        <SettingsRow label="Username" hasBorder>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="settings-input"
            placeholder="username"
          />
          <p className="mt-1.5 text-[11px] text-white/30">{appUrl}/@{username || 'username'}</p>
        </SettingsRow>

        {/* Display Name */}
        <SettingsRow label="Display Name" hasBorder>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="settings-input"
            placeholder="Your Name"
          />
        </SettingsRow>

        {/* Bio */}
        <SettingsRow label="Bio" hasBorder>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            rows={2}
            className="settings-input resize-none"
            placeholder="Tell the world about yourself"
          />
          <p className="mt-1.5 text-[11px] text-white/30 text-right">{bio.length}/160</p>
        </SettingsRow>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: SOCIAL LINKS
         ═══════════════════════════════════════════════════════════ */}
      <SectionHeader title="Social Links" />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        <SettingsRow label="Instagram" icon={<InstagramIcon size={18} className="text-[#E4405F]" />}>
          <input
            type="text"
            value={socialInstagram}
            onChange={(e) => setSocialInstagram(e.target.value)}
            className="settings-input"
            placeholder="@username"
          />
        </SettingsRow>
        <SettingsRow label="X (Twitter)" icon={<XIcon size={16} className="text-white" />} hasBorder>
          <input
            type="text"
            value={socialTwitter}
            onChange={(e) => setSocialTwitter(e.target.value)}
            className="settings-input"
            placeholder="@handle"
          />
        </SettingsRow>
        <SettingsRow label="TikTok" icon={<TikTokIcon size={16} className="text-white" />} hasBorder>
          <input
            type="text"
            value={socialTiktok}
            onChange={(e) => setSocialTiktok(e.target.value)}
            className="settings-input"
            placeholder="@username"
          />
        </SettingsRow>
      </div>

      {/* Inline styles for settings inputs */}
      <style jsx global>{`
        .settings-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .settings-input:focus {
          border-color: rgba(255,255,255,0.2);
        }
        .settings-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}


/* ─── Sub-components ──────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[13px] font-semibold text-white/40 uppercase tracking-wider px-1 mb-2.5">{title}</h2>
  );
}

function SettingsRow({
  label,
  icon,
  children,
  hasBorder = false,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  hasBorder?: boolean;
}) {
  return (
    <div className={`px-4 py-3.5 ${hasBorder ? 'border-t border-white/[0.04]' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[13px] font-semibold text-white/60">{label}</span>
      </div>
      {children}
    </div>
  );
}

