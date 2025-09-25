import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Phone Collection Modal Component
const PhoneCollectionModal = ({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to continue.",
        variant: "destructive",
      });
      return;
    }

    // Indian phone number validation (adjust as needed)
    const phoneRegex = /^[+]?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit Indian mobile number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
        phone: phone.trim(),
      });

      toast({
        title: "Profile completed!",
        description: "Your phone number has been saved.",
      });

      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to save phone number. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={10}
            />
            <p className="text-sm text-gray-500">
              We need your phone number to process orders and send updates.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !phone.trim()}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Component to handle profile-based redirect with phone check
const ProfileRedirect = ({ userId }: { userId: string }) => {
  const [redirect, setRedirect] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", userId)
          .single();

        // Check if phone number is missing (most critical)
        if (!profile?.phone) {
          setShowPhoneModal(true);
          setLoading(false);
          return;
        }

        // Check if name is missing
        if (!profile?.first_name || !profile?.last_name) {
          setRedirect("/account");
        } else {
          setRedirect("/");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setRedirect("/account");
      }
      setLoading(false);
    };

    checkProfile();
  }, [userId]);

  const handlePhoneComplete = async () => {
    setShowPhoneModal(false);
    setLoading(true);
    
    // Re-check profile after phone is added
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();

      if (!profile?.first_name || !profile?.last_name) {
        setRedirect("/account");
      } else {
        setRedirect("/");
      }
    } catch (error) {
      setRedirect("/account");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  if (showPhoneModal) {
    return (
      <>
        <PhoneCollectionModal 
          isOpen={true} 
          onComplete={handlePhoneComplete}
        />
        <div className="fixed inset-0 bg-white z-40 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Mills Mitra!</h2>
              <p className="text-gray-600">
                We need just one more detail to complete your registration.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check for auth fragment when redirected back
  useEffect(() => {
    const hash = window.location.hash;
    if (navigator.userAgent.includes("Android") && hash.includes("access_token")) {
      const hashParams = new URLSearchParams(hash.slice(1));
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
          if (error) {
            console.error("❌ Error setting session from redirect:", error);
          } else {
            window.dispatchEvent(new Event("SIGNED_IN"));
            // Let ProfileRedirect handle the phone number check
          }
        });
      }
    }

    // ✅ Handle injected session from MainActivity
    const listener = (event: any) => {
      const fragment = event.detail;
      if (fragment && fragment.includes("access_token")) {
        const params = new URLSearchParams(fragment.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
            if (error) {
              console.error("❌ Error setting session via JS event:", error);
            } else {
              window.dispatchEvent(new Event("SIGNED_IN"));
              // Let ProfileRedirect handle the phone number check
            }
          });
        }
      }
    };

    window.addEventListener("supabase-android-auth", listener);
    return () => window.removeEventListener("supabase-android-auth", listener);
  }, []);

  // ✅ If already signed in, redirect based on role and profile completeness
  if (user) {
    const adminEmails = ["admin@ezbillify.com", "admin@millsmitra.com"];
    const isAdmin = adminEmails.includes(user.email || "");

    return isAdmin ? (
      <Navigate to="/admin" replace />
    ) : (
      <ProfileRedirect userId={user.id} />
    );
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
      const { error } = await signIn(email, password);
      if (!error) {
        console.log("✅ Login success");
        // ProfileRedirect will handle routing based on profile completeness
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast({
        title: "Login failed",
        description: "Unexpected error. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // ✅ Updated Google Sign-In: only trigger Chrome Custom Tab if Android WebView
  const handleGoogleSignIn = async () => {
    const isAndroidWebView =
      /Android/i.test(navigator.userAgent) && /wv/.test(navigator.userAgent);

    setLoading(true);
    try {
      if (isAndroidWebView) {
        console.log("🔁 Redirecting to Chrome Custom Tab...");
        window.location.href = "supabase-login://google";
      } else {
        console.log("🌐 Regular browser login...");
        await signInWithGoogle();
        // ProfileRedirect will handle the phone number collection
      }
    } catch (error) {
      console.error("❌ Google sign in error:", error);
      toast({
        title: "Google sign in failed",
        description: "Try again or use email/password.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email first.",
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
          description: "Check your email inbox.",
        });
      }
    } catch (error) {
      console.error("❌ Password reset error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Try again.",
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
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
              {loading ? "Signing in..." : "Sign in with Google"}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleForgotPassword}
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