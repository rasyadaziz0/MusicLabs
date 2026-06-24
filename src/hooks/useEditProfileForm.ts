'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { uploadImage } from '@/lib/utils/uploadImage';
import { gooeyToast as toast } from 'goey-toast';

// ── Constants ──

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ── Types ──

interface EditProfileFormState {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  socialInstagram: string;
  socialTwitter: string;
  socialTiktok: string;
}

interface EditProfileFormMeta {
  isSubmitting: boolean;
  isFetching: boolean;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  error: string | null;
}

// ── Hook ──

export function useEditProfileForm() {
  const router = useRouter();
  const { user, updateProfile, loading } = useAuth();
  const profileRepo = ProfileRepository.getInstance();

  // Form fields
  const [form, setForm] = useState<EditProfileFormState>({
    username: '',
    name: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    socialInstagram: '',
    socialTwitter: '',
    socialTiktok: '',
  });

  // Meta state
  const [meta, setMeta] = useState<EditProfileFormMeta>({
    isSubmitting: false,
    isFetching: true,
    isUploadingAvatar: false,
    isUploadingBanner: false,
    error: null,
  });

  // ── Field setter (convenience) ──

  const setField = <K extends keyof EditProfileFormState>(key: K, value: EditProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Fetch profile on mount ──

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      const fetchProfile = async () => {
        const data = await profileRepo.getProfile(user.id);
        if (data) {
          setForm({
            username: data.username || '',
            name: data.display_name || user.user_metadata?.name || user.user_metadata?.full_name || '',
            bio: data.bio || '',
            avatarUrl: data.avatar_url || user.user_metadata?.avatar_url || '',
            bannerUrl: data.banner_url || '',
            socialInstagram: data.social_instagram || '',
            socialTwitter: data.social_twitter || '',
            socialTiktok: data.social_tiktok || '',
          });
        }
        setMeta((prev) => ({ ...prev, isFetching: false }));
      };
      fetchProfile();
    }
  }, [user, loading, router]);

  // ── File validation ──

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, WebP, and GIF files are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be under 5MB.';
    }
    return null;
  };

  // ── Generic upload handler factory ──
  // Replaces the duplicated handleAvatarUpload / handleBannerUpload

  const makeUploadHandler = (
    folder: 'avatars' | 'banners',
    profileColumn: 'avatar_url' | 'banner_url',
    formField: 'avatarUrl' | 'bannerUrl',
    uploadingKey: 'isUploadingAvatar' | 'isUploadingBanner',
    successMessage: string
  ) => {
    return async (file: File) => {
      if (!file || !user) return;

      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setMeta((prev) => ({ ...prev, [uploadingKey]: true }));
      try {
        const url = await uploadImage(file, folder);
        setField(formField, url);

        // Auto-save to DB so it doesn't revert on navigation
        await profileRepo.updateProfile(user.id, { [profileColumn]: url });

        toast.success(successMessage);
      } catch (err: unknown) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Failed to upload image');
      } finally {
        setMeta((prev) => ({ ...prev, [uploadingKey]: false }));
      }
    };
  };

  const handleAvatarUpload = makeUploadHandler(
    'avatars', 'avatar_url', 'avatarUrl', 'isUploadingAvatar', 'Avatar uploaded successfully!'
  );

  const handleBannerUpload = makeUploadHandler(
    'banners', 'banner_url', 'bannerUrl', 'isUploadingBanner', 'Banner uploaded successfully!'
  );

  // ── Submit ──

  const handleSubmit = async () => {
    setMeta((prev) => ({ ...prev, isSubmitting: true, error: null }));

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (form.username && !usernameRegex.test(form.username)) {
      setMeta((prev) => ({
        ...prev,
        isSubmitting: false,
        error: 'Username can only contain letters, numbers, underscores, and periods.',
      }));
      return;
    }

    const { error: updateError } = await updateProfile({
      username: form.username.trim(),
      name: form.name.trim(),
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl.trim(),
      bannerUrl: form.bannerUrl.trim(),
      socialInstagram: form.socialInstagram.trim(),
      socialTwitter: form.socialTwitter.trim(),
      socialTiktok: form.socialTiktok.trim(),
    });

    if (updateError) {
      setMeta((prev) => ({ ...prev, isSubmitting: false, error: updateError }));
    } else {
      toast.success('Profile updated!', {
        description: 'Your changes have been saved and synced successfully.'
      });
      router.push('/profile');
    }
  };

  return {
    form,
    meta,
    loading,
    user,
    setField,
    handleAvatarUpload,
    handleBannerUpload,
    handleSubmit,
  };
}
