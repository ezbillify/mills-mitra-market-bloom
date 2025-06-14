
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureProfileExists } from '@/utils/profileUtils';

export const useAuthActions = () => {
  const { toast } = useToast();

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
        // Immediately ensure profile exists for new users with comprehensive data
        setTimeout(() => {
          ensureProfileExists(data.user.id, {
            email: email,
            first_name: firstName,
            last_name: lastName,
            user_metadata: data.user.user_metadata
          });
        }, 100);
        
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
      }, 200);
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

  return {
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };
};
