import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Component to handle profile-based redirect
const ProfileRedirect = ({ userId }: { userId: string }) => {
  const [redirect, setRedirect] = useState<string | null>(null);
  
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
        
        // If profile is incomplete (missing first_name or last_name), go to account page
        if (!profile?.first_name || !profile?.last_name) {
          setRedirect("/account");
        } else {
          // Profile is complete, go to home page
          setRedirect("/");
        }
      } catch (error) {
        // If there's an error checking profile, default to account page
        setRedirect("/account");
      }
    };
    
    checkProfile();
  }, [userId]);
  
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }
  
  return <div>Loading...</div>;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    // Check if user is admin and redirect accordingly
    const adminEmails = ['admin@ezbillify.com', 'admin@millsmitra.com'];
    const isAdmin = adminEmails.includes(user.email || '');
    
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <ProfileRedirect userId={user.id} />;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔑 Attempting login for:', email);
      const { error } = await signIn(email, password);
      
      if (!error) {
        // We'll handle the redirect in the auth state change listener
        // The ProfileRedirect component will handle the logic when user state updates
        console.log('✅ Login successful, auth state will handle redirect');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('🔍 Attempting Google sign in...');
      await signInWithGoogle();
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      toast({
        title: "Google sign in failed",
        description: "Please try again or use email/password login.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset sent",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <p className="text-center text-gray-600">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Sign in with Google
            </Button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => handleForgotPassword()}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Forgot your password?
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
