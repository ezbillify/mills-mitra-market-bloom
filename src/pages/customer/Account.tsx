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
    .optional()
    .refine((val) => !val || (val.length >= 10 && /^[0-9]{10,15}$/.test(val)), {
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
          firstName: data?.first_name || user.user_metadata?.first_name || "",
          lastName: data?.last_name || user.user_metadata?.last_name || "",
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
        description: values.phone ? "Your phone number has been saved for faster checkout." : undefined,
      });

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

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Google user phone number alert */}
      {isGoogleUser && !hasPhone && (
        <Alert className="w-full max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Add your phone number</strong> to enable online payments during checkout. 
            Phone numbers are required for secure payment processing.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <p className="text-sm text-gray-600">
            Update your personal information and contact details
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
                      Phone Number 
                      {!hasPhone && <span className="text-red-500 ml-1">*</span>}
                      <span className="text-sm text-gray-500 ml-2">
                        (Required for online payments)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1234567890" 
                        {...field}
                        className={!hasPhone ? "border-orange-300 focus:border-orange-500" : ""}
                      />
                    </FormControl>
                    <FormMessage />
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
                className="w-full"
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Address Management */}
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
    </div>
  );
};

export default Account;
