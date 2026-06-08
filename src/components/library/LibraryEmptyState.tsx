'use client';

import Link from 'next/link';
import { Music2 } from 'lucide-react';

interface LibraryEmptyStateProps {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function LibraryEmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
  onCtaClick,
}: LibraryEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/40">
        <Music2 size={24} />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/50">{description}</p>
      {ctaLabel && onCtaClick ? (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-5 inline-flex rounded-full bg-[#FA243C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FA243C]/90 transition-colors"
        >
          {ctaLabel}
        </button>
      ) : null}
      {ctaHref && ctaLabel && !onCtaClick ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex rounded-full bg-[#FA243C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FA243C]/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
