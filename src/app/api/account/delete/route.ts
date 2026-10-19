import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // 1. First try database RPC if configured
    try {
      await supabase.rpc('delete_user_account');
    } catch {
      // Continue to admin deletion fallback
    }

    // 2. Use admin client to completely delete all records and auth.users
    const admin = createAdminClient();

    await Promise.allSettled([
      admin.from('listening_history').delete().eq('user_id', userId),
      admin.from('liked_tracks').delete().eq('user_id', userId),
      admin.from('playlists').delete().eq('user_id', userId),
      admin.from('follows').delete().eq('follower_id', userId),
      admin.from('follows').delete().eq('following_id', userId),
      admin.from('playlist_collaborators').delete().eq('user_id', userId),
      admin.from('user_presence').delete().eq('user_id', userId),
      admin.from('profiles').delete().eq('id', userId),
    ]);

    const { error: adminDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (adminDeleteError) {
      console.error('[Account Deletion] Failed to delete user from auth.users:', adminDeleteError);
      return NextResponse.json({ error: 'Failed to fully delete account from authentication system' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[Account Deletion] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
