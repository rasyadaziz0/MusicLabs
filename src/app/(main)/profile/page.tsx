import { redirect } from 'next/navigation';
import { getServerCurrentUser, getServerUserProfile } from '@/lib/supabase/server-fetches';

export default async function ProfileRedirect() {
  const user = await getServerCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getServerUserProfile(user.id);

  if (profile?.username) {
    redirect(`/@${profile.username}`);
  } else {
    redirect('/profile/edit');
  }
}
