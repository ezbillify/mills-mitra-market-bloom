
import { AuthContext } from '@/contexts/AuthContext';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading } = useAuthState();
  const authActions = useAuthActions();

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      ...authActions,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
