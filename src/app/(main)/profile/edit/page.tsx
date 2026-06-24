'use client';

import { Loader2, Save, Camera, Upload, Crop } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { InstagramIcon, TikTokIcon, XIcon } from '@/components/icons/SocialIcons';
import { useEditProfileForm } from '@/hooks/useEditProfileForm';
import { useState } from 'react';
import { ImageCropModal } from '@/components/ui/ImageCropModal';

export default function EditProfilePage() {
  const {
    form,
    meta,
    loading,
    user,
    setField,
    handleAvatarUpload,
    handleBannerUpload,
    handleSubmit,
  } = useEditProfileForm();

  const [cropModal, setCropModal] = useState<{ isOpen: boolean; src: string; type: 'avatar' | 'banner' }>({ isOpen: false, src: '', type: 'avatar' });
  const [originalImages, setOriginalImages] = useState<{ avatar?: string; banner?: string }>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalImages(prev => ({ ...prev, [type]: url }));
    setCropModal({ isOpen: true, src: url, type });
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropModal(prev => ({ ...prev, isOpen: false }));
    if (cropModal.type === 'avatar') {
      await handleAvatarUpload(croppedFile);
    } else {
      await handleBannerUpload(croppedFile);
    }
  };

  if (loading || !user || meta.isFetching) {
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
            onClick={() => history.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={meta.isSubmitting}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {meta.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
      </div>

      {meta.error && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
          {meta.error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: PROFILE
         ═══════════════════════════════════════════════════════════ */}
      <SectionHeader title="Profile" />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        {/* Banner */}
        <div className="relative h-[140px] w-full overflow-hidden bg-gradient-to-r from-[#FA243C]/20 to-[#FF6275]/10 group">
          {form.bannerUrl && (
            <Image src={form.bannerUrl} alt="Banner" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            {form.bannerUrl && (
              <button
                type="button"
                onClick={() => {
                  const srcToAdjust = originalImages.banner || (form.bannerUrl ? `/api/proxy?url=${encodeURIComponent(form.bannerUrl)}` : null);
                  if (srcToAdjust) {
                    setCropModal({ isOpen: true, src: srcToAdjust, type: 'banner' });
                  }
                }}
                disabled={meta.isUploadingBanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/80 cursor-pointer hover:bg-black/60 transition-colors"
              >
                <Crop size={12} />
                Adjust
              </button>
            )}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/80 cursor-pointer hover:bg-black/60 transition-colors">
              {meta.isUploadingBanner ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              {meta.isUploadingBanner ? 'Uploading...' : 'Change Banner'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'banner')} disabled={meta.isUploadingBanner} />
            </label>
          </div>
        </div>

        {/* Avatar */}
        <SettingsRow label="Profile Photo" hasBorder>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/5 shrink-0 group">
              {form.avatarUrl ? (
                <Image src={form.avatarUrl} alt="Avatar" fill sizes="64px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C] to-[#FF6275]" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const srcToAdjust = originalImages.avatar || (form.avatarUrl ? `/api/proxy?url=${encodeURIComponent(form.avatarUrl)}` : null);
                    if (srcToAdjust) {
                      setCropModal({ isOpen: true, src: srcToAdjust, type: 'avatar' });
                    } else {
                      document.getElementById('avatar-upload-input')?.click();
                    }
                  }}
                  disabled={meta.isUploadingAvatar}
                  className="cursor-pointer flex items-center justify-center w-full h-full border-none bg-transparent"
                >
                  {meta.isUploadingAvatar ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors text-white text-[13px] font-medium max-w-fit">
                {meta.isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {meta.isUploadingAvatar ? 'Uploading...' : 'Change Picture'}
                <input id="avatar-upload-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'avatar')} disabled={meta.isUploadingAvatar} />
              </label>
              <p className="text-[11px] text-white/40">Recommended 500x500px, JPG/PNG, max 5MB.</p>
            </div>
          </div>
        </SettingsRow>

        {/* Username */}
        <SettingsRow label="Username" hasBorder>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setField('username', e.target.value)}
            className="settings-input"
            placeholder="username"
          />
          <p className="mt-1.5 text-[11px] text-white/30">{appUrl}/@{form.username || 'username'}</p>
        </SettingsRow>

        {/* Display Name */}
        <SettingsRow label="Display Name" hasBorder>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            className="settings-input"
            placeholder="Your Name"
          />
        </SettingsRow>

        {/* Bio */}
        <SettingsRow label="Bio" hasBorder>
          <textarea
            value={form.bio}
            onChange={(e) => setField('bio', e.target.value.slice(0, 160))}
            rows={2}
            className="settings-input resize-none"
            placeholder="Tell the world about yourself"
          />
          <p className="mt-1.5 text-[11px] text-white/30 text-right">{form.bio.length}/160</p>
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
            value={form.socialInstagram}
            onChange={(e) => setField('socialInstagram', e.target.value)}
            className="settings-input"
            placeholder="@username"
          />
        </SettingsRow>
        <SettingsRow label="X (Twitter)" icon={<XIcon size={16} className="text-white" />} hasBorder>
          <input
            type="text"
            value={form.socialTwitter}
            onChange={(e) => setField('socialTwitter', e.target.value)}
            className="settings-input"
            placeholder="@handle"
          />
        </SettingsRow>
        <SettingsRow label="TikTok" icon={<TikTokIcon size={16} className="text-white" />} hasBorder>
          <input
            type="text"
            value={form.socialTiktok}
            onChange={(e) => setField('socialTiktok', e.target.value)}
            className="settings-input"
            placeholder="@username"
          />
        </SettingsRow>
      </div>

      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.src}
        onClose={() => setCropModal(prev => ({ ...prev, isOpen: false }))}
        onCropComplete={handleCropComplete}
        circularCrop={cropModal.type === 'avatar'}
        aspect={cropModal.type === 'avatar' ? 1 : 16 / 5}
      />
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
