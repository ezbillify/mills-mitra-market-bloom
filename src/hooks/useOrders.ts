
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching orders with profile data...");

      // First, get all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          total,
          status,
          created_at,
          shipping_address,
          tracking_number
        `)
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

      // Get unique user IDs from orders
      const userIds = [...new Set(ordersData.map(order => order.user_id))];
      console.log(`👥 Found ${userIds.length} unique users in orders`);

      // Fetch all profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .in("id", userIds);

      if (profilesError) {
        console.error("❌ Error fetching profiles:", profilesError);
        // Continue without profiles rather than failing completely
      }

      console.log(`📋 Fetched ${profilesData?.length || 0} profiles`);

      // Create a map of user_id to profile for quick lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
          console.log(`📝 Mapped profile for user ${profile.id.substring(0, 8)}: ${profile.first_name} ${profile.last_name} (${profile.email})`);
        });
      }

      // Process orders and attach profile data
      const processedOrders = ordersData.map((order: any) => {
        console.log(`🔄 Processing order ${order.id.substring(0, 8)} for user ${order.user_id.substring(0, 8)}`);
        
        const profile = profilesMap.get(order.user_id);
        let orderProfile: OrderProfile = null;

        if (profile) {
          orderProfile = {
            first_name: profile.first_name || null,
            last_name: profile.last_name || null,
            email: profile.email || null,
            phone: profile.phone || null
          };
          console.log(`✅ Found profile for user ${order.user_id.substring(0, 8)}: ${profile.first_name} ${profile.last_name}`);
        } else {
          console.log(`⚠️ No profile found for user ${order.user_id.substring(0, 8)}`);
        }

        return {
          id: order.id,
          user_id: order.user_id,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
          shipping_address: order.shipping_address,
          tracking_number: order.tracking_number,
          profiles: orderProfile
        };
      });

      console.log(`🎯 Processed ${processedOrders.length} orders with profile data`);
      
      // Log summary of profile data
      const ordersWithProfiles = processedOrders.filter(order => order.profiles);
      const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
      console.log(`📊 Orders with profiles: ${ordersWithProfiles.length}, without profiles: ${ordersWithoutProfiles.length}`);

      setOrders(processedOrders);
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
