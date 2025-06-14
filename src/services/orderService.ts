
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
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
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`✅ Fetched ${ordersData?.length || 0} orders`);
    
    if (!ordersData || ordersData.length === 0) {
      console.log('📭 No orders found');
      return [];
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
      let orderProfile: OrderProfile | null = null;

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
