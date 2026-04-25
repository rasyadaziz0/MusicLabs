import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// Validasi URL sederhana untuk menghindari crash fatal saat build/runtime awal
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!isValidUrl(supabaseUrl)) {
  console.warn(
    '⚠️ Supabase URL is missing or invalid. Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file.'
  );
}

if (!supabaseKey) {
  console.warn(
    '⚠️ Supabase key is missing. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file.'
  );
}

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
