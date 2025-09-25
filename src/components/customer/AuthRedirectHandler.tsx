import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthRedirectHandlerProps {
  user: User;
}

const AuthRedirectHandler = ({ user }: AuthRedirectHandlerProps) => {
  const [redirect, setRedirect] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", user.id)
          .single();

        const isGoogleUser = user.app_metadata?.providers?.includes('google');

        // If no profile exists (new user) or profile is incomplete
        if (error && error.code === 'PGRST116') {
          // New user - needs to complete profile
          setRedirect("/account");
        } else if (profile) {
          // Profile exists - check completeness
          const isComplete = profile.first_name && profile.last_name && profile.phone;
          
          if (!isComplete) {
            // Incomplete profile - go to account
            setRedirect("/account");
          } else {
            // Complete profile - go to home
            setRedirect("/");
          }
        } else {
          // Error fetching profile - safe default
          setRedirect("/account");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setRedirect("/account");
      }
      setLoading(false);
    };

    checkProfileAndRedirect();
  }, [user.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  return null;
};

export default AuthRedirectHandler;