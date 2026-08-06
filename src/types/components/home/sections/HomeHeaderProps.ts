import { User } from '@supabase/supabase-js';

export interface HomeHeaderProps {
  user: User | null;
  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;
  handleSignOut: () => void;
}
