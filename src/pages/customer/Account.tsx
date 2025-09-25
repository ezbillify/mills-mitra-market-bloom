import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";

// Updated schema with required phone number
const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z
    .string()
    .min(1, { message: "Phone number is required." })
    .refine((val) => val.length >= 10 && /^[0-9]{10,15}$/.test(val), {
      message: "Phone number must be 10-15 digits only.",
    }),
  address: z.string().optional(),
});

const Account = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
    },
    mode: "onChange",
  });

  // Check if user signed up with Google
  useEffect(() => {
    if (user) {
      const providers = user.app_metadata?.providers || [];
      setIsGoogleUser(providers.includes('google'));
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) return;
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Fetch profile data from database
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(data);

        // Populate form with database data (priority) or auth metadata (fallback)
        form.reset({
          firstName: data?.first_name || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "",
          lastName: data?.last_name || user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
          email: user.email || "",
          phone: data?.phone || user.user_metadata?.phone || "",
          address: data?.address || user.user_metadata?.address || "",
        });
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setLoading(true);

    try {
      // 1. Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone || "",
          address: values.address || "",
        },
      });

      if (authError) throw authError;

      // 2. Update or insert profile in database
      const profileData = {
        id: user?.id,
        first_name: values.firstName,
        last_name: values.lastName,
        email: user?.email,
        phone: values.phone || "",
        address: values.address || "",
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (dbError) throw dbError;

      // 3. Refresh user session
      await updateUser();

      toast({
        title: "Profile updated successfully!",
        description: isGoogleUser && values.phone ? "Your phone number has been saved. You can now proceed to shop!" : "Your profile has been updated.",
      });

      // If this was a Google user completing their profile, redirect to home
      if (isGoogleUser && values.phone && !profile?.phone) {
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error updating profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user === undefined) return null;

  const hasPhone = profile?.phone || user?.user_metadata?.phone;
  const isProfileIncomplete = isGoogleUser && !hasPhone;

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Enhanced Google user phone number alert */}
      {isProfileIncomplete && (
        <Alert className="w-full max-w-2xl mx-auto border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Complete your registration:</strong> Please add your phone number below to finish setting up your account and enable online payments.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isProfileIncomplete ? "Complete Your Profile" : "Account Settings"}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isProfileIncomplete 
              ? "Add your phone number to complete registration"
              : "Update your personal information and contact details"
            }
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe@example.com"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className="text-red-500">*</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (Required for online payments)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1234567890" 
                        {...field}
                        className={isProfileIncomplete ? "border-orange-300 focus:border-orange-500" : ""}
                        maxLength={15}
                        onInput={(e) => {
                          // Only allow numbers
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {isProfileIncomplete && (
                      <p className="text-sm text-orange-600">
                        Enter your 10-digit mobile number to continue
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={loading}
                className={`w-full ${isProfileIncomplete ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
              >
                {loading 
                  ? "Updating..." 
                  : isProfileIncomplete 
                    ? "Complete Registration" 
                    : "Update Profile"
                }
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Address Management - only show if profile is complete */}
      {!isProfileIncomplete && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage your saved addresses for faster checkout
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/address-book")}
              className="flex items-center gap-2"
            >
              Manage Addresses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Account;