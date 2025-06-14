
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    console.log("🔍 OrderService.fetchOrders() called");

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

    console.log(`✅ Raw data from Supabase:`, ordersData);
    console.log(`📊 Fetched ${ordersData?.length || 0} orders`);
    
    if (!ordersData || ordersData.length === 0) {
      console.log('📭 No orders found in database');
      return [];
    }

    // Process orders and ensure profile data is properly structured
    const processedOrders = ordersData.map((order: any, index: number) => {
      console.log(`🔄 Processing order ${index + 1}/${ordersData.length}`);
      console.log(`📋 Order ID: ${order.id.substring(0, 8)}, User ID: ${order.user_id.substring(0, 8)}`);
      console.log(`📝 Raw profiles data from DB:`, order.profiles);
      
      let orderProfile: OrderProfile | null = null;

      // Handle the profile data - it might be an object or null
      if (order.profiles && typeof order.profiles === 'object') {
        orderProfile = {
          first_name: order.profiles.first_name || null,
          last_name: order.profiles.last_name || null,
          email: order.profiles.email || null,
          phone: order.profiles.phone || null
        };
        console.log(`✅ Processed profile for order ${order.id.substring(0, 8)}:`, orderProfile);
      } else {
        console.log(`⚠️ No valid profile found for order ${order.id.substring(0, 8)}, raw profiles:`, order.profiles);
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

      console.log(`🎯 Final processed order ${index + 1}:`, {
        id: processedOrder.id.substring(0, 8),
        user_id: processedOrder.user_id.substring(0, 8),
        has_profiles: !!processedOrder.profiles,
        profiles_data: processedOrder.profiles
      });

      return processedOrder;
    });

    // Final summary
    const ordersWithProfiles = processedOrders.filter(order => order.profiles);
    const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
    console.log(`📊 Final summary:`);
    console.log(`   - Orders with profiles: ${ordersWithProfiles.length}`);
    console.log(`   - Orders without profiles: ${ordersWithoutProfiles.length}`);
    console.log(`   - Total orders returned: ${processedOrders.length}`);

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
