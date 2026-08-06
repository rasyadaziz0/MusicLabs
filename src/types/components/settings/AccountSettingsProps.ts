import { User } from '@supabase/supabase-js';

export interface AccountSettingsProps {
  t: (key: string) => string;
  user: User;
  handleClearHistory: () => void;
  isClearingHistory: boolean;
  handleSignOut: () => void;
  setShowDeleteModal: (show: boolean) => void;
}
