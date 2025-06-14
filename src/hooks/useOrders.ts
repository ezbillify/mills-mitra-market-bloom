import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// The OrderProfile type should only allow a valid profile object or null (NEVER { error: true }).
type OrderProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
} | null;

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "accepted"
    | "out_for_delivery"
    | "completed";
  created_at: string;
  shipping_address: string;
  tracking_number: string | null;
  profiles: OrderProfile;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Helper to sanitize profiles so the UI never gets the error object
  function sanitizeProfile(profile: any): OrderProfile {
    // Handle null, undefined, or invalid objects
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return null;
    }
    
    // Handle error objects or objects with error properties
    if ("error" in profile || "message" in profile) {
      return null;
    }
    
    // Return sanitized profile
    return {
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      email: profile.email || null,
      phone: profile.phone || null
    };
  }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching orders with profile data...");

      // First, let's test the basic orders query
      const { data: basicOrdersData, error: basicError } = await supabase
        .from("orders")
        .select("*")
        .limit(5);

      console.log("📋 Basic orders query result:", {
        count: basicOrdersData?.length || 0,
        error: basicError,
        sampleOrder: basicOrdersData?.[0]
      });

      // Now let's test if profiles table has data
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .limit(5);

      console.log("👤 Profiles table check:", {
        count: profilesData?.length || 0,
        error: profilesError,
        sampleProfile: profilesData?.[0]
      });

      // Now the full query with join
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          user_id,
          total,
          status,
          created_at,
          shipping_address,
          tracking_number,
          profiles (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false });

      console.log("🔗 Orders with profiles join result:", {
        count: ordersData?.length || 0,
        error: ordersError,
        rawData: ordersData?.slice(0, 2)
      });

      if (ordersError) {
        console.error("❌ Error fetching orders:", ordersError);
        toast({
          title: "Error",
          description: `Failed to fetch orders: ${ordersError.message}`,
          variant: "destructive",
        });
        setOrders([]);
        return;
      }

      console.log(`✅ Fetched ${ordersData?.length || 0} orders`);
      
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }
      
      // Process and sanitize orders
      const sanitizedOrders = ordersData.map((order: any, index: number) => {
        const sanitized = {
          ...order,
          profiles: sanitizeProfile(order.profiles),
        };
        
        console.log(`🔍 Order ${index + 1}:`, {
          id: sanitized.id.substring(0, 8),
          user_id: sanitized.user_id.substring(0, 8),
          rawProfiles: order.profiles,
          sanitizedProfiles: sanitized.profiles
        });
        
        return sanitized;
      });

      console.log(`✅ Processed ${sanitizedOrders.length} orders successfully`);
      setOrders(sanitizedOrders);
    } catch (error) {
      console.error("💥 Unexpected error in fetchOrders:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching orders",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus:
      | "pending"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "accepted"
      | "out_for_delivery"
      | "completed"
  ) => {
    try {
      console.log(`Updating order ${orderId} to status ${newStatus}`);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
        toast({
          title: "Error",
          description: `Failed to update order status: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      await fetchOrders();
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Unexpected error updating order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the order",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          console.log("Orders changed, refetching...");
          fetchOrders();
        }
      )
      .subscribe();

    // Also listen for profile changes since they affect order display
    const profilesChannel = supabase
      .channel("profiles-changes-for-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          console.log("Profiles changed, refetching orders...");
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  return {
    orders,
    loading,
    fetchOrders,
    updateOrderStatus,
  };
};
