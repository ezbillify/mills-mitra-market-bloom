
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    console.log("🔍 Fetching orders with profile data using JOIN...");

    // Use a single query with JOIN to get orders and profiles together
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("❌ Error fetching orders with profiles:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`✅ Fetched ${ordersData?.length || 0} orders with profiles`);
    
    if (!ordersData || ordersData.length === 0) {
      console.log('📭 No orders found');
      return [];
    }

    // Process orders and ensure profile data is properly structured
    const processedOrders = ordersData.map((order: any) => {
      console.log(`🔄 Processing order ${order.id.substring(0, 8)} for user ${order.user_id.substring(0, 8)}`);
      console.log('📋 Raw profile data:', order.profiles);
      
      let orderProfile: OrderProfile | null = null;

      // Handle the profile data - it might be an object or null
      if (order.profiles && typeof order.profiles === 'object') {
        orderProfile = {
          first_name: order.profiles.first_name || null,
          last_name: order.profiles.last_name || null,
          email: order.profiles.email || null,
          phone: order.profiles.phone || null
        };
        console.log(`✅ Processed profile for user ${order.user_id.substring(0, 8)}:`, orderProfile);
      } else {
        console.log(`⚠️ No profile found for user ${order.user_id.substring(0, 8)}`);
      }

      const processedOrder: Order = {
        id: order.id,
        user_id: order.user_id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        profiles: orderProfile
      };

      console.log(`🎯 Final processed order:`, {
        id: processedOrder.id.substring(0, 8),
        user_id: processedOrder.user_id.substring(0, 8),
        profiles: processedOrder.profiles
      });

      return processedOrder;
    });

    // Log summary of profile data
    const ordersWithProfiles = processedOrders.filter(order => order.profiles);
    const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
    console.log(`📊 Final summary - Orders with profiles: ${ordersWithProfiles.length}, without profiles: ${ordersWithoutProfiles.length}`);

    return processedOrders;
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    console.log(`Updating order ${orderId} to status ${newStatus}`);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }
}
