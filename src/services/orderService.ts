
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    console.log("🔍 OrderService.fetchOrders() called");

    // Use a single query with JOIN to get orders, profiles, and delivery options together
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
        delivery_option_id,
        delivery_price,
        profiles!orders_user_id_profiles_fkey (
          first_name,
          last_name,
          email,
          phone
        ),
        delivery_options!orders_delivery_option_id_fkey (
          id,
          name,
          description,
          price
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
      console.log(`🚚 Raw delivery options data:`, order.delivery_options);
      
      let orderProfile: OrderProfile | null = null;

      // Handle the profile data - it might be an object or null
      if (order.profiles && typeof order.profiles === 'object') {
        // Ensure we have proper fallback values for missing profile data
        orderProfile = {
          first_name: order.profiles.first_name || 'Customer',
          last_name: order.profiles.last_name || `ID-${order.user_id.substring(0, 8)}`,
          email: order.profiles.email || 'No email provided',
          phone: order.profiles.phone || null
        };
        console.log(`✅ Processed profile for order ${order.id.substring(0, 8)}:`, orderProfile);
      } else {
        // Create a fallback profile when no profile exists
        orderProfile = {
          first_name: 'Customer',
          last_name: `ID-${order.user_id.substring(0, 8)}`,
          email: 'No email provided',
          phone: null
        };
        console.log(`⚠️ Created fallback profile for order ${order.id.substring(0, 8)}:`, orderProfile);
      }

      const processedOrder: Order = {
        id: order.id,
        user_id: order.user_id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        delivery_option_id: order.delivery_option_id,
        delivery_price: order.delivery_price,
        shipping_settings: order.delivery_options, // Map delivery_options to shipping_settings for compatibility
        profiles: orderProfile
      };

      console.log(`🎯 Final processed order ${index + 1}:`, {
        id: processedOrder.id.substring(0, 8),
        user_id: processedOrder.user_id.substring(0, 8),
        has_profiles: !!processedOrder.profiles,
        has_shipping_settings: !!processedOrder.shipping_settings,
        shipping_name: processedOrder.shipping_settings?.name || 'No delivery method',
        profiles_data: processedOrder.profiles
      });

      return processedOrder;
    });

    // Final summary
    const ordersWithProfiles = processedOrders.filter(order => order.profiles);
    const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
    const ordersWithShipping = processedOrders.filter(order => order.shipping_settings);
    console.log(`📊 Final summary:`);
    console.log(`   - Orders with profiles: ${ordersWithProfiles.length}`);
    console.log(`   - Orders without profiles: ${ordersWithoutProfiles.length}`);
    console.log(`   - Orders with delivery info: ${ordersWithShipping.length}`);
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

  static async updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void> {
    console.log(`Updating tracking number for order ${orderId}: ${trackingNumber}`);

    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating tracking number:", error);
      throw new Error(`Failed to update tracking number: ${error.message}`);
    }
  }
}
