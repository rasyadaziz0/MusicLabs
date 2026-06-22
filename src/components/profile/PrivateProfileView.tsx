'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock } from 'lucide-react';
import Image from 'next/image';
import { UserProfile } from '@/types/profile';
import { useTranslation } from '@/context/LanguageContext';

interface PrivateProfileViewProps {
  profile: UserProfile;
  isLoggedIn: boolean;
}

export default function PrivateProfileView({ profile, isLoggedIn }: PrivateProfileViewProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const displayName = profile.display_name || profile.username || 'User';
  const avatarUrl = profile.avatar_url;

  return (
    <div className="pb-32 pt-2 max-w-[1400px] mx-auto">
      {/* Back Button */}
      <div className="px-5 md:px-8 pt-2 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Private Profile Content */}
      <div className="flex flex-col items-center justify-center px-5 md:px-8 pt-12">
        {/* Avatar with lock overlay */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-white/5 ring-2 ring-white/10">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={112}
                height={112}
                className="w-full h-full object-cover opacity-50 blur-[2px]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Lock badge */}
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[#1a1a1e] border-2 border-white/10 flex items-center justify-center">
            <Lock size={18} className="text-white/60" />
          </div>
        </div>

        {/* Name */}
        <h1 className="text-xl font-bold text-white mb-1">{displayName}</h1>
        {profile.username && (
          <p className="text-sm text-white/40 mb-6">@{profile.username}</p>
        )}

        {/* Private notice card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-5 max-w-sm w-full text-center">
          <Lock size={20} className="text-white/30 mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-white/80 mb-1.5">
            Akun ini bersifat privat
          </p>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Profil ini disetel ke privat oleh pemiliknya. Kamu tidak bisa melihat playlist dan aktivitas mereka.
          </p>
        </div>
      </div>
    </div>
  );
}
