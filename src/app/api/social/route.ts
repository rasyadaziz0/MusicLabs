import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Get following IDs using admin (to bypass any RLS on follows if needed, but it's usually public)
    const { data: follows, error: followsError } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followsError) {
      return NextResponse.json({ error: followsError.message }, { status: 500 });
    }

    const followingIds = follows.map(f => f.following_id);
    if (followingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Get listening history using admin to bypass RLS!
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('listening_history')
      .select('id, user_id, track_id, played_at, profiles(id, username, display_name, bio, avatar_url, created_at)')
      .in('user_id', followingIds)
      .order('played_at', { ascending: false })
      .limit(30);

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    return NextResponse.json({ data: historyData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
