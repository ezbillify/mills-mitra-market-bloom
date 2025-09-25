import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      // Don't check if:
      // - Still loading auth
      // - No user logged in
      // - Already checked profile
      // - User is on login/register pages
      // - User is admin
      if (
        authLoading || 
        !user || 
        profileChecked ||
        ['/login', '/register', '/reset-password'].includes(location.pathname) ||
        location.pathname.startsWith('/admin')
      ) {
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single();

        const isGoogleUser = user.app_metadata?.providers?.includes('google');
        
        // Check if profile is incomplete
        const profileIncomplete = !profile?.first_name || !profile?.last_name || !profile?.phone;
        
        if (profileIncomplete && location.pathname !== '/account') {
          console.log('🔄 Profile incomplete, redirecting to /account');
          navigate('/account', { replace: true });
        }
        
        setProfileChecked(true);
      } catch (error) {
        console.error('Error checking profile:', error);
        setProfileChecked(true);
      }
    };

    checkProfileCompleteness();
  }, [user, authLoading, location.pathname, profileChecked, navigate]);

  // Reset profile check when user changes
  useEffect(() => {
    setProfileChecked(false);
  }, [user?.id]);

  return <>{children}</>;
};

export default AuthWrapper;
