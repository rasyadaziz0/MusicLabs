'use client';

import React, { useState } from 'react';
import { Lock, Mail, Loader2, CheckCircle, KeyRound } from 'lucide-react';
import { SectionHeader } from './SettingsUI';
import { useAuth } from '@/context/AuthContext';
import { gooeyToast as toast } from 'goey-toast';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import Link from 'next/link';

interface SecuritySettingsProps {
  t: (key: string) => string;
}

export function SecuritySettings({ t }: SecuritySettingsProps) {
  const { user, resetPasswordForEmail } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  // Check if user is a Google user based on providers array.
  // If they have Google connected, show the direct "Set Password" page.
  // Otherwise, show the manual email reset flow.
  const isGoogleUser = user?.app_metadata?.providers?.includes('google');
  const isManualLogin = !isGoogleUser;

  const handleRequestPasswordChange = async () => {
    if (!user?.email) return;

    setIsSubmitting(true);
    const { error } = await resetPasswordForEmail(user.email, captchaToken);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    setEmailSent(true);
    toast.success(t('settings.password_email_sent'), {
      description: user.email,
    });
  };

  return (
    <>
      <SectionHeader title={t('settings.security')} />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        {/* Section label */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-1">
          <Lock size={18} className="text-[#FA243C]" />
          <span className="text-[14px] text-white/90 font-medium">
            {isManualLogin ? t('settings.change_password') : t('settings.set_password')}
          </span>
        </div>
        <p className="px-4 pb-3 text-[12px] text-white/40 leading-relaxed">
          {isManualLogin ? t('settings.change_password_desc') : t('settings.set_password_desc')}
        </p>

        {isManualLogin ? (
          /* Email reset flow for users who already have a password */
          emailSent ? (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] text-emerald-300 font-medium">
                  {t('settings.password_email_sent')}
                </p>
                <p className="text-[12px] text-white/40 mt-1">
                  {t('settings.password_email_sent_desc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex justify-center">
                <TurnstileWidget onSuccess={(token) => setCaptchaToken(token)} />
              </div>
              <button
                onClick={handleRequestPasswordChange}
                disabled={isSubmitting || !captchaToken}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white/90 text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                {t('settings.send_password_email')}
              </button>
            </div>
          )
        ) : (
          /* Direct link to set password for OAuth users without password */
          <div className="px-4 pb-4">
            <Link
              href="/settings/set-password"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white/90 text-[13px] font-semibold transition-colors"
            >
              <KeyRound size={14} />
              {t('settings.create_password_button')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
