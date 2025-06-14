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
    console.log('🔍 Sanitizing profile data:', profile);
    
    if (!profile || (typeof profile === "object" && Object.prototype.hasOwnProperty.call(profile, "error"))) {
      console.log('❌ Profile is null or has error, returning null');
      return null;
    }
    
    // Ensure we have the expected structure
    const sanitized = {
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      email: profile.email || null,
      phone: profile.phone || null
    };
    
    console.log('✅ Profile sanitized:', sanitized);
    return sanitized;
  }

  const fetchOrders = async () => {
    try {
      console.log("🚀 Starting comprehensive order fetch with profiles...");

      // Fetch orders with proper profile joins and enhanced logging
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
          profiles!orders_user_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("❌ Supabase error fetching orders:", ordersError);
        toast({
          title: "Error",
          description: `Failed to fetch orders: ${ordersError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Successfully fetched ${ordersData?.length || 0} orders`);
      
      // Log sample order data for debugging
      if (ordersData && ordersData.length > 0) {
        console.log("📋 Sample order data:", {
          orderId: ordersData[0].id.substring(0, 8),
          userId: ordersData[0].user_id.substring(0, 8),
          profileData: ordersData[0].profiles,
          total: ordersData[0].total
        });
      }

      // Process and sanitize orders
      const sanitizedOrders = ordersData?.map((order: any, index) => {
        console.log(`🔄 Processing order ${index + 1}/${ordersData.length}:`, {
          id: order.id.substring(0, 8),
          userId: order.user_id.substring(0, 8),
          hasProfile: !!order.profiles,
          profileData: order.profiles
        });

        const sanitizedOrder = {
          ...order,
          profiles: sanitizeProfile(order.profiles),
        };

        console.log(`✅ Order ${index + 1} processed:`, {
          id: sanitizedOrder.id.substring(0, 8),
          profileName: sanitizedOrder.profiles ? 
            `${sanitizedOrder.profiles.first_name || ''} ${sanitizedOrder.profiles.last_name || ''}`.trim() : 
            'No profile',
          profileEmail: sanitizedOrder.profiles?.email || 'No email'
        });

        return sanitizedOrder;
      }) || [];

      console.log(`🎯 Final order processing complete: ${sanitizedOrders.length} orders ready`);
      setOrders(sanitizedOrders);
    } catch (error) {
      console.error("💥 Unexpected error fetching orders:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching orders",
        variant: "destructive",
      });
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
