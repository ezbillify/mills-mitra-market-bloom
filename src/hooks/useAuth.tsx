
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Enhanced profile creation function with better error handling and retry logic
  const ensureProfileExists = async (userId: string, userData?: any) => {
    try {
      console.log('Ensuring profile exists for user:', userId, userData);
      
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
        return;
      }

      if (existingProfile) {
        console.log('Profile already exists for user:', userId, existingProfile);
        return;
      }

      // Extract user data from various sources
      const email = userData?.email || userData?.user_metadata?.email || null;
      const firstName = userData?.first_name || userData?.user_metadata?.first_name || null;
      const lastName = userData?.last_name || userData?.user_metadata?.last_name || null;

      console.log('Creating profile with data:', { userId, email, firstName, lastName });

      // Create profile with extracted data
      const profileData = {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (insertError) {
        console.error('Error creating profile:', insertError);
        
        // If it's a conflict error, try to update instead
        if (insertError.code === '23505') {
          console.log('Profile conflict detected, trying to update instead...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: email,
              first_name: firstName,
              last_name: lastName,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating profile after conflict:', updateError);
          } else {
            console.log('Profile updated successfully after conflict for user:', userId);
          }
        } else {
          toast({
            title: "Profile Creation Error",
            description: "There was an issue setting up your profile. Please contact support if this persists.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Profile created successfully for user:', userId);
      }
    } catch (error) {
      console.error('Unexpected error in ensureProfileExists:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Ensure profile exists for various auth events
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Use a longer delay to ensure database operations complete
          setTimeout(() => {
            ensureProfileExists(session.user.id, session.user);
          }, 500);
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
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // For immediate signup (when email confirmation is disabled)
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });
      } else if (data.user) {
        // Immediately ensure profile exists for new users
        setTimeout(() => {
          ensureProfileExists(data.user.id, {
            email: email,
            first_name: firstName,
            last_name: lastName,
            user_metadata: data.user.user_metadata
          });
        }, 1000);
        
        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      // Ensure profile exists on sign in
      setTimeout(() => {
        ensureProfileExists(data.user.id, data.user);
      }, 500);
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
