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
    const sanitized = {
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      email: profile.email || null,
      phone: profile.phone || null
    };
    
    return sanitized;
  }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching orders with profile data...");

      // First, let's try a different approach - fetch orders and profiles separately to debug
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

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
        console.log('📭 No orders found');
        setOrders([]);
        return;
      }

      // Now fetch profiles for all user_ids in the orders
      const userIds = [...new Set(ordersData.map(order => order.user_id))];
      console.log(`🔍 Fetching profiles for ${userIds.length} unique users:`, userIds.map(id => id.substring(0, 8)));

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("❌ Error fetching profiles:", profilesError);
      } else {
        console.log(`✅ Fetched ${profilesData?.length || 0} profiles:`, profilesData?.map(p => ({
          id: p.id.substring(0, 8),
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email
        })));
      }

      // Create a map of profiles by user_id for quick lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }
      
      // Process and sanitize orders with detailed logging
      const sanitizedOrders = ordersData.map((order: any, index: number) => {
        console.log(`🔄 Processing order ${index + 1}/${ordersData.length}:`, {
          orderId: order.id.substring(0, 8),
          userId: order.user_id.substring(0, 8),
        });
        
        // Look up the profile for this order's user_id
        const userProfile = profilesMap.get(order.user_id);
        console.log(`🔍 Profile lookup for user ${order.user_id.substring(0, 8)}:`, userProfile ? {
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          email: userProfile.email
        } : 'NOT FOUND');
        
        const sanitizedProfile = sanitizeProfile(userProfile);
        
        if (sanitizedProfile) {
          console.log(`✅ Valid profile found for order ${order.id.substring(0, 8)}:`, {
            firstName: sanitizedProfile.first_name,
            lastName: sanitizedProfile.last_name,
            email: sanitizedProfile.email
          });
        } else {
          console.log(`⚠️ No valid profile for order ${order.id.substring(0, 8)}`);
        }
        
        const processed = {
          ...order,
          profiles: sanitizedProfile,
        };
        
        return processed;
      });

      console.log(`🎯 All ${sanitizedOrders.length} orders processed successfully`);
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
