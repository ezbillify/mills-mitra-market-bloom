
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminAccessButton = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        const adminEmails = ['admin@ezbillify.com', 'admin@millsmitra.com'];
        const userIsAdmin = adminEmails.includes(profile?.email || user.email || '');
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (!isAdmin) return null;

  return (
    <Link to="/admin">
      <Button 
        variant="outline" 
        size="sm" 
        className="border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-primary transition-all duration-200 font-medium shadow-sm hover:shadow-md"
      >
        <Shield className="h-4 w-4 mr-2" />
        Admin Panel
      </Button>
    </Link>
  );
};

export default AdminAccessButton;
