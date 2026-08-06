export interface AuthGateProps {
  signInWithGoogle: (redirectTo?: string) => Promise<any>;
}
