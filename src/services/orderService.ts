
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";
import { DebugUtils } from "@/utils/debugUtils";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    DebugUtils.log("OrderService", "🔍 fetchOrders() called");

    try {
      // First, get the orders with proper joins
      DebugUtils.log("OrderService", "📥 Fetching orders with profiles from database...");
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
          delivery_options!delivery_option_id (
            id,
            name,
            description,
            price
          ),
          profiles!user_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) {
        DebugUtils.error("OrderService", "Failed to fetch orders", ordersError);
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      DebugUtils.log("OrderService", `✅ Fetched ${ordersData?.length || 0} orders with joined data`);
      DebugUtils.table("OrderService", "Raw orders with profiles:", ordersData?.map(order => ({
        id: order.id.substring(0, 8),
        user_id: order.user_id.substring(0, 8),
        total: order.total,
        status: order.status,
        has_delivery_options: !!order.delivery_options,
        has_profiles: !!order.profiles,
        customer_name: order.profiles ? `${order.profiles.first_name} ${order.profiles.last_name}` : 'NO PROFILE',
        customer_email: order.profiles?.email || 'NO EMAIL',
        customer_address: order.profiles?.address || 'NO ADDRESS'
      })) || []);
      
      if (!ordersData || ordersData.length === 0) {
        DebugUtils.log("OrderService", "📭 No orders found in database");
        return [];
      }

      // Process orders and attach profile data
      const processedOrders = ordersData.map((order: any, index: number) => {
        DebugUtils.log("OrderService", `🔄 Processing order ${index + 1}/${ordersData.length} (ID: ${order.id.substring(0, 8)})`);
        
        let orderProfile: OrderProfile | null = null;

        if (order.profiles) {
          orderProfile = {
            first_name: order.profiles.first_name || null,
            last_name: order.profiles.last_name || null,
            email: order.profiles.email || null,
            phone: order.profiles.phone || null,
            address: order.profiles.address || null,
            city: order.profiles.city || null,
            postal_code: order.profiles.postal_code || null,
            country: order.profiles.country || null
          };
          DebugUtils.log("OrderService", `✅ Found real profile for order ${order.id.substring(0, 8)}:`, {
            name: `${orderProfile.first_name} ${orderProfile.last_name}`,
            email: orderProfile.email,
            address: orderProfile.address,
            city: orderProfile.city
          });
        } else {
          DebugUtils.log("OrderService", `⚠️ No profile found for order ${order.id.substring(0, 8)} (user_id: ${order.user_id.substring(0, 8)})`);
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
          customer_name: processedOrder.profiles ? `${processedOrder.profiles.first_name} ${processedOrder.profiles.last_name}` : 'No profile',
          customer_email: processedOrder.profiles?.email || 'No email',
          customer_address: processedOrder.profiles?.address || 'No address'
        });

        return processedOrder;
      });

      // Final summary
      const ordersWithProfiles = processedOrders.filter(order => order.profiles && order.profiles.first_name);
      const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
      
      DebugUtils.log("OrderService", "📊 Final processing summary:");
      DebugUtils.log("OrderService", `   - Orders with real profiles: ${ordersWithProfiles.length}`);
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
