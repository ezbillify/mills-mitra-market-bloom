
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";

export interface CustomerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
}

export class CustomerService {
  static async fetchCustomers(): Promise<Customer[]> {
    try {
      console.log("👥 Fetching customers...");

      // This query will only work for admins due to RLS policies
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("❌ Error fetching customers:", profilesError);
        throw new Error(`Failed to fetch customers: ${profilesError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        console.log("⚠️ No customers found or insufficient permissions");
        return [];
      }

      // Fetch order statistics for each customer (only for admins)
      const customersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const { data: orderStats } = await supabase
              .from("orders")
              .select("total, created_at")
              .eq("user_id", profile.id);

            const totalOrders = orderStats?.length || 0;
            const totalSpent = orderStats?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
            const lastOrderDate = orderStats && orderStats.length > 0 
              ? orderStats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
              : null;

            // Transform to match the Customer interface from types/customer.ts
            const customerName = profile.first_name && profile.last_name 
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : profile.first_name || profile.last_name || profile.email || `Customer ${profile.id.substring(0, 8)}`;

            return {
              id: profile.id,
              name: customerName,
              email: profile.email || 'No email',
              phone: profile.phone || 'No phone',
              totalOrders: totalOrders,
              totalSpent: totalSpent,
              status: totalOrders > 0 ? 'active' as const : 'inactive' as const,
              joinDate: profile.created_at,
              profile: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                address: profile.address,
                city: profile.city,
                postal_code: profile.postal_code,
                country: profile.country,
              }
            } as Customer;
          } catch (error) {
            console.error(`Error fetching stats for customer ${profile.id}:`, error);
            const customerName = profile.first_name && profile.last_name 
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : profile.first_name || profile.last_name || profile.email || `Customer ${profile.id.substring(0, 8)}`;

            return {
              id: profile.id,
              name: customerName,
              email: profile.email || 'No email',
              phone: profile.phone || 'No phone',
              totalOrders: 0,
              totalSpent: 0,
              status: 'inactive' as const,
              joinDate: profile.created_at,
              profile: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                address: profile.address,
                city: profile.city,
                postal_code: profile.postal_code,
                country: profile.country,
              }
            } as Customer;
          }
        })
      );

      console.log(`✅ Successfully fetched ${customersWithStats.length} customers`);
      return customersWithStats;
    } catch (error) {
      console.error("💥 Unexpected error in fetchCustomers:", error);
      throw error;
    }
  }

  static async getCurrentUserProfile(): Promise<CustomerProfile | null> {
    try {
      console.log("👤 Fetching current user profile...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("❌ No authenticated user found");
        return null;
      }

      // This query will only return the current user's profile due to RLS
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching user profile:", error);
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      if (!profile) {
        console.log("❌ Profile not found for current user");
        return null;
      }

      console.log("✅ Successfully fetched current user profile");
      return profile;
    } catch (error) {
      console.error("💥 Unexpected error in getCurrentUserProfile:", error);
      throw error;
    }
  }

  static async updateCurrentUserProfile(updates: Partial<CustomerProfile>): Promise<void> {
    try {
      console.log("📝 Updating current user profile...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // This will only update the current user's profile due to RLS
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Error updating profile:", error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log("✅ Successfully updated user profile");
    } catch (error) {
      console.error("💥 Unexpected error in updateCurrentUserProfile:", error);
      throw error;
    }
  }
}

// Export the function that useCustomers is looking for
export const fetchCustomersData = CustomerService.fetchCustomers;
