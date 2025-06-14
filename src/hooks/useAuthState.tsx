
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/utils/profileUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Ensure profile exists for various auth events
        if (session?.user && ['SIGNED_IN', 'SIGNED_UP', 'TOKEN_REFRESHED'].includes(event)) {
          // Use immediate execution for signup, short delay for others
          const delay = event === 'SIGNED_UP' ? 100 : 500;
          setTimeout(() => {
            ensureProfileExists(session.user.id, session.user);
          }, delay);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Ensure profile exists for existing session
      if (session?.user) {
        setTimeout(() => {
          ensureProfileExists(session.user.id, session.user);
        }, 200);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
};
