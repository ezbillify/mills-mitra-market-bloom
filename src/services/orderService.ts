
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    console.log("🔍 OrderService.fetchOrders() called");

    // First, get the orders
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
        delivery_options!orders_delivery_option_id_fkey (
          id,
          name,
          description,
          price
        )
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("❌ Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`✅ Raw orders data from Supabase:`, ordersData);
    console.log(`📊 Fetched ${ordersData?.length || 0} orders`);
    
    if (!ordersData || ordersData.length === 0) {
      console.log('📭 No orders found in database');
      return [];
    }

    // Get unique user IDs from orders
    const userIds = [...new Set(ordersData.map(order => order.user_id))];
    console.log(`👥 Fetching profiles for ${userIds.length} unique users:`, userIds.map(id => id.substring(0, 8)));

    // Fetch profiles for all users at once
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .in("id", userIds);

    if (profilesError) {
      console.error("❌ Error fetching profiles:", profilesError);
      // Continue without throwing error, we'll use fallback data
    }

    console.log(`✅ Fetched ${profilesData?.length || 0} profiles:`, profilesData);

    // Create a map of user_id to profile for quick lookup
    const profilesMap = new Map();
    profilesData?.forEach(profile => {
      profilesMap.set(profile.id, profile);
      console.log(`📝 Mapped profile: ${profile.id.substring(0, 8)} -> ${profile.first_name} ${profile.last_name} (${profile.email})`);
    });

    // Process orders and attach profile data
    const processedOrders = ordersData.map((order: any, index: number) => {
      console.log(`🔄 Processing order ${index + 1}/${ordersData.length}`);
      console.log(`📋 Order ID: ${order.id.substring(0, 8)}, User ID: ${order.user_id.substring(0, 8)}`);
      
      const profileData = profilesMap.get(order.user_id);
      console.log(`👤 Profile lookup for user ${order.user_id.substring(0, 8)}:`, profileData);

      let orderProfile: OrderProfile | null = null;

      if (profileData) {
        orderProfile = {
          first_name: profileData.first_name || null,
          last_name: profileData.last_name || null,
          email: profileData.email || null,
          phone: profileData.phone || null
        };
        console.log(`✅ Using real profile for order ${order.id.substring(0, 8)}:`, orderProfile);
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
        customer_name: processedOrder.profiles ? `${processedOrder.profiles.first_name} ${processedOrder.profiles.last_name}` : 'Unknown',
        customer_email: processedOrder.profiles?.email || 'No email'
      });

      return processedOrder;
    });

    // Final summary
    const ordersWithProfiles = processedOrders.filter(order => order.profiles && order.profiles.first_name);
    const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles || !order.profiles.first_name);
    const ordersWithShipping = processedOrders.filter(order => order.shipping_settings);
    console.log(`📊 Final summary:`);
    console.log(`   - Orders with real profiles: ${ordersWithProfiles.length}`);
    console.log(`   - Orders with fallback profiles: ${ordersWithoutProfiles.length}`);
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
