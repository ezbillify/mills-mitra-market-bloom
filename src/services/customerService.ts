
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
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

            return {
              ...profile,
              total_orders: totalOrders,
              total_spent: totalSpent,
              last_order_date: lastOrderDate,
            };
          } catch (error) {
            console.error(`Error fetching stats for customer ${profile.id}:`, error);
            return {
              ...profile,
              total_orders: 0,
              total_spent: 0,
              last_order_date: null,
            };
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

  static async getCurrentUserProfile(): Promise<Customer | null> {
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

  static async updateCurrentUserProfile(updates: Partial<Customer>): Promise<void> {
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
