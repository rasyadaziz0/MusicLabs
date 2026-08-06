export interface EditProfileFormState {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  socialInstagram: string;
  socialTwitter: string;
  socialTiktok: string;
}

export interface EditProfileFormMeta {
  isSubmitting: boolean;
  isFetching: boolean;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  error: string | null;
}