
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";
import { DebugUtils } from "@/utils/debugUtils";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    DebugUtils.log("OrderService", "🔍 fetchOrders() called");

    try {
      // First, get the orders
      DebugUtils.log("OrderService", "📥 Fetching orders from database...");
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
        DebugUtils.error("OrderService", "Failed to fetch orders", ordersError);
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      DebugUtils.log("OrderService", `✅ Fetched ${ordersData?.length || 0} orders`);
      DebugUtils.table("OrderService", "Raw orders data:", ordersData?.map(order => ({
        id: order.id.substring(0, 8),
        user_id: order.user_id.substring(0, 8),
        total: order.total,
        status: order.status,
        has_delivery_options: !!order.delivery_options
      })) || []);
      
      if (!ordersData || ordersData.length === 0) {
        DebugUtils.log("OrderService", "📭 No orders found in database");
        return [];
      }

      // Get unique user IDs from orders
      const userIds = [...new Set(ordersData.map(order => order.user_id))];
      DebugUtils.log("OrderService", `👥 Unique user IDs found: ${userIds.length}`);
      DebugUtils.table("OrderService", "User IDs to fetch profiles for:", userIds.map(id => ({
        user_id: id,
        short_id: id.substring(0, 8)
      })));

      // Fetch profiles for all users at once
      DebugUtils.log("OrderService", "👤 Fetching user profiles...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .in("id", userIds);

      if (profilesError) {
        DebugUtils.error("OrderService", "Failed to fetch profiles", profilesError);
        // Continue without throwing error, we'll use fallback data
      }

      DebugUtils.log("OrderService", `✅ Fetched ${profilesData?.length || 0} profiles`);
      DebugUtils.table("OrderService", "Profiles data:", profilesData?.map(profile => ({
        id: profile.id.substring(0, 8),
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone
      })) || []);

      // Create a map of user_id to profile for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
        DebugUtils.log("OrderService", `📝 Mapped profile: ${profile.id.substring(0, 8)} -> ${profile.first_name} ${profile.last_name}`);
      });

      DebugUtils.log("OrderService", `🗺️ Profile map contains ${profilesMap.size} entries`);

      // Process orders and attach profile data
      const processedOrders = ordersData.map((order: any, index: number) => {
        DebugUtils.log("OrderService", `🔄 Processing order ${index + 1}/${ordersData.length} (ID: ${order.id.substring(0, 8)})`);
        
        const profileData = profilesMap.get(order.user_id);
        DebugUtils.log("OrderService", `👤 Profile lookup result for ${order.user_id.substring(0, 8)}:`, profileData || "NOT FOUND");

        let orderProfile: OrderProfile | null = null;

        if (profileData) {
          orderProfile = {
            first_name: profileData.first_name || null,
            last_name: profileData.last_name || null,
            email: profileData.email || null,
            phone: profileData.phone || null
          };
          DebugUtils.log("OrderService", `✅ Created profile for order ${order.id.substring(0, 8)}:`, orderProfile);
        } else {
          // Create a fallback profile when no profile exists
          orderProfile = {
            first_name: 'Customer',
            last_name: `ID-${order.user_id.substring(0, 8)}`,
            email: 'No email provided',
            phone: null
          };
          DebugUtils.log("OrderService", `⚠️ Created fallback profile for order ${order.id.substring(0, 8)}:`, orderProfile);
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
          shipping_settings: order.delivery_options,
          profiles: orderProfile
        };

        DebugUtils.log("OrderService", `🎯 Final processed order ${index + 1}:`, {
          id: processedOrder.id.substring(0, 8),
          user_id: processedOrder.user_id.substring(0, 8),
          has_profiles: !!processedOrder.profiles,
          customer_name: processedOrder.profiles ? `${processedOrder.profiles.first_name} ${processedOrder.profiles.last_name}` : 'Unknown',
          customer_email: processedOrder.profiles?.email || 'No email'
        });

        return processedOrder;
      });

      // Final summary
      const ordersWithProfiles = processedOrders.filter(order => order.profiles && order.profiles.first_name && order.profiles.first_name !== 'Customer');
      const ordersWithFallbacks = processedOrders.filter(order => order.profiles?.first_name === 'Customer');
      const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
      
      DebugUtils.log("OrderService", "📊 Final processing summary:");
      DebugUtils.log("OrderService", `   - Orders with real profiles: ${ordersWithProfiles.length}`);
      DebugUtils.log("OrderService", `   - Orders with fallback profiles: ${ordersWithFallbacks.length}`);
      DebugUtils.log("OrderService", `   - Orders without profiles: ${ordersWithoutProfiles.length}`);
      DebugUtils.log("OrderService", `   - Total orders returned: ${processedOrders.length}`);

      return processedOrders;

    } catch (error) {
      DebugUtils.error("OrderService", "Critical error in fetchOrders", error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    DebugUtils.log("OrderService", `Updating order ${orderId.substring(0, 8)} to status ${newStatus}`);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      DebugUtils.error("OrderService", "Failed to update order status", error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    DebugUtils.log("OrderService", `✅ Successfully updated order status`);
  }

  static async updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void> {
    DebugUtils.log("OrderService", `Updating tracking number for order ${orderId.substring(0, 8)}: ${trackingNumber}`);

    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber })
      .eq("id", orderId);

    if (error) {
      DebugUtils.error("OrderService", "Failed to update tracking number", error);
      throw new Error(`Failed to update tracking number: ${error.message}`);
    }

    DebugUtils.log("OrderService", `✅ Successfully updated tracking number`);
  }
}
