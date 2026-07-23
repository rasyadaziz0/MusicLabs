'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { gooeyToast as toast } from 'goey-toast';
import Link from 'next/link';

export default function SetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Fallback translation if key is missing
    const tPasswordTooShort = t('settings.password_too_short') || 'Password must be at least 6 characters';
    const tPasswordMismatch = t('settings.password_mismatch') || 'Passwords do not match';
    const tPasswordUpdated = t('settings.password_updated') || 'Password updated successfully!';

    if (newPassword.length < 6) {
      setError(tPasswordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(tPasswordMismatch);
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    toast.success(tPasswordUpdated);
    router.push('/settings');
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4">
      <Link 
        href="/settings"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white/90 text-sm font-medium transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        {t('settings.security') || 'Security'}
      </Link>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
        <div className="w-12 h-12 bg-[#FA243C]/10 rounded-2xl flex items-center justify-center mb-6">
          <KeyRound size={24} className="text-[#FA243C]" />
        </div>
        
        <h1 className="text-xl font-bold text-white mb-2">
          {t('settings.set_password') || 'Set Password'}
        </h1>
        <p className="text-sm text-white/40 mb-8 leading-relaxed">
          {t('settings.set_password_desc') || 'Create a password for your account so you can also log in manually using your email address.'}
        </p>

        <form onSubmit={handleSavePassword} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[12px] text-white/50 font-medium mb-1.5">
              {t('settings.new_password') || 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[12px] text-white/50 font-medium mb-1.5">
              {t('settings.confirm_password') || 'Confirm Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
              {error}
            </div>
          )}

          {/* Save button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-white/90 text-black text-[14px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              {t('settings.save_password') || 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
