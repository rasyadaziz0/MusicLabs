"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { Props } from '@/types/components/auth/Props';
export default function TurnstileWidget({ onSuccess }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return <div className="text-red-500 text-xs">Error: Site Key not found</div>;
  }

  return (
    <div className="scale-[0.75] origin-center h-[50px]">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onSuccess}
        options={{
          theme: "dark",
        }}
      />
    </div>
  );
}
