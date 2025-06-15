
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔐 Checking admin status for user:', user?.email);
      
      if (!user) {
        console.log('❌ No user found, not admin');
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        // First check if user email is directly an admin email
        const adminEmails = ['admin@ezbillify.com', 'admin@millsmitra.com'];
        const isDirectAdmin = adminEmails.includes(user.email || '');
        
        if (isDirectAdmin) {
          console.log('✅ User is direct admin via email:', user.email);
          setIsAdmin(true);
          setChecking(false);
          return;
        }

        // Then check profile table for email
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          // If profile doesn't exist, check if user email is admin
          const userIsAdmin = adminEmails.includes(user.email || '');
          console.log('🔍 Fallback check via user email:', user.email, 'Is admin:', userIsAdmin);
          setIsAdmin(userIsAdmin);
        } else {
          const userIsAdmin = adminEmails.includes(profile?.email || user.email || '');
          console.log('🔍 Profile email check:', profile?.email, 'Is admin:', userIsAdmin);
          setIsAdmin(userIsAdmin);
        }
      } catch (error) {
        console.error('❌ Error checking admin status:', error);
        // Fallback to checking user email directly
        const adminEmails = ['admin@ezbillify.com', 'admin@millsmitra.com'];
        const userIsAdmin = adminEmails.includes(user.email || '');
        console.log('🔄 Exception fallback check:', user.email, 'Is admin:', userIsAdmin);
        setIsAdmin(userIsAdmin);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading || checking) {
    console.log('⏳ Loading admin check...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-green mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log('🚫 User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Admin access granted for:', user.email);
  return <>{children}</>;
};

export default AdminProtectedRoute;
