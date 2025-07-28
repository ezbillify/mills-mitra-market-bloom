import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
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
          navigate("/account"); // ✅ You can redirect to /account or /#
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
            navigate("/account"); // ✅ Auto-login redirect
          }
        });
      }
    }
  };

  window.addEventListener("supabase-android-auth", listener);
  return () => window.removeEventListener("supabase-android-auth", listener);
}, []);


  // ✅ If already signed in, redirect based on role
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
              Sign in with Google
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
