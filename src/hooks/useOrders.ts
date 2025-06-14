
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
    console.log('🔍 DETAILED Profile Analysis:', {
      rawProfile: profile,
      typeofProfile: typeof profile,
      isArray: Array.isArray(profile),
      isNull: profile === null,
      isUndefined: profile === undefined,
      hasFirstName: profile?.first_name,
      hasLastName: profile?.last_name,
      hasEmail: profile?.email,
      profileKeys: profile ? Object.keys(profile) : 'no keys'
    });
    
    // Handle null, undefined, or invalid objects
    if (!profile || typeof profile !== "object" || profile === null || Array.isArray(profile)) {
      console.log('❌ Profile is null/undefined/invalid/array, returning null');
      return null;
    }
    
    // Handle error objects or objects with error properties
    if (Object.prototype.hasOwnProperty.call(profile, "error") || 
        Object.prototype.hasOwnProperty.call(profile, "message")) {
      console.log('❌ Profile has error property, returning null');
      return null;
    }
    
    // Ensure we have the expected structure
    const sanitized = {
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      email: profile.email || null,
      phone: profile.phone || null
    };
    
    console.log('✅ Profile sanitized successfully:', sanitized);
    return sanitized;
  }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("🚀 DEBUGGING: Starting order fetch with enhanced logging...");

      // Now fetch orders with profile join using the correct foreign key name
      console.log("🔗 Fetching orders WITH profile join...");
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
          profiles!orders_user_id_profiles_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("❌ Supabase error fetching orders with profiles:", ordersError);
        toast({
          title: "Error",
          description: `Failed to fetch orders: ${ordersError.message}`,
          variant: "destructive",
        });
        setOrders([]);
        return;
      }

      console.log(`✅ Orders with profiles fetched: ${ordersData?.length || 0}`);
      
      // Handle empty results
      if (!ordersData || ordersData.length === 0) {
        console.log("📋 No orders found in database");
        setOrders([]);
        return;
      }
      
      // Detailed analysis of each order
      console.log("🔍 DETAILED ORDER ANALYSIS:");
      ordersData.forEach((order, index) => {
        console.log(`📦 Order ${index + 1}/${ordersData.length}:`, {
          orderId: order.id.substring(0, 8),
          userId: order.user_id.substring(0, 8),
          total: order.total,
          status: order.status,
          profileRaw: order.profiles,
          profileType: typeof order.profiles,
          profileIsArray: Array.isArray(order.profiles),
          profileIsNull: order.profiles === null,
          // Safe property access
          profileFirstName: order.profiles && typeof order.profiles === 'object' && 'first_name' in order.profiles ? order.profiles.first_name : 'N/A',
          profileLastName: order.profiles && typeof order.profiles === 'object' && 'last_name' in order.profiles ? order.profiles.last_name : 'N/A',
          profileEmail: order.profiles && typeof order.profiles === 'object' && 'email' in order.profiles ? order.profiles.email : 'N/A'
        });
      });

      // Process and sanitize orders
      const sanitizedOrders = ordersData.map((order: any, index) => {
        console.log(`🔄 Processing order ${index + 1}:`, order.id.substring(0, 8));

        const sanitizedOrder = {
          ...order,
          profiles: sanitizeProfile(order.profiles),
        };

        console.log(`✅ Order ${index + 1} processed with profile:`, {
          id: sanitizedOrder.id.substring(0, 8),
          hasProfile: !!sanitizedOrder.profiles,
          profileData: sanitizedOrder.profiles
        });

        return sanitizedOrder;
      });

      console.log(`🎯 FINAL RESULT: ${sanitizedOrders.length} orders processed successfully`);
      
      // Log first few orders for verification
      if (sanitizedOrders.length > 0) {
        console.log("📊 First 2 processed orders:", sanitizedOrders.slice(0, 2).map(order => ({
          id: order.id.substring(0, 8),
          userId: order.user_id.substring(0, 8),
          total: order.total,
          profileName: order.profiles ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() : 'No profile',
          profileEmail: order.profiles?.email || 'No email'
        })));
      }
      
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
