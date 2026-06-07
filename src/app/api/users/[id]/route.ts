import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch follow counts
    const [followerResult, followingResult] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    // Fetch public playlists
    const { data: playlists } = await supabase
      .from('playlists')
      .select('id, name, description, cover_url, is_public, created_at')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      profile,
      followCounts: {
        followers: followerResult.count ?? 0,
        following: followingResult.count ?? 0,
      },
      publicPlaylists: playlists ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
