import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus } from "@/types/order";
import { StockService } from "./stockService";

export class OrderService {
  static async fetchOrders(isAdminView: boolean = false): Promise<Order[]> {
    try {
      console.log(`📦 Fetching orders - Admin view: ${isAdminView}`);

      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ No authenticated user found:", userError);
        throw new Error("Authentication required to fetch orders");
      }

      const isActualAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';
      console.log(`👤 User ${user.email} is admin: ${isActualAdmin}`);

      // Updated query with proper profile join
      let query = supabase
        .from("orders")
        .select(`
          *,
          profiles(
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            state
          )
        `)
        .order("created_at", { ascending: false });

      // Only allow admin view if user is actually an admin
      if (!isAdminView || !isActualAdmin) {
        console.log("👤 Customer view - filtering orders for user:", user.id);
        query = query.eq("user_id", user.id);
      } else {
        console.log("👨‍💼 Admin view - fetching all orders");
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error("❌ Error fetching orders:", error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      // Enhance orders with address data fallback (similar to useOrderDetails)
      const enhancedOrders = await Promise.all(
        (orders || []).map(async (order) => {
          // If profile data is missing key info, try to get address data as fallback
          if (!order.profiles || (!order.profiles.phone || !order.profiles.first_name)) {
            try {
              const { data: addressData } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", order.user_id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (addressData) {
                return {
                  ...order,
                  profiles: {
                    ...(order.profiles || {}),
                    // Use address data if profile data is missing
                    first_name: order.profiles?.first_name || addressData.first_name,
                    last_name: order.profiles?.last_name || addressData.last_name,
                    phone: order.profiles?.phone || addressData.phone,
                    address: order.profiles?.address || addressData.address_line_1,
                    city: order.profiles?.city || addressData.city,
                    postal_code: order.profiles?.postal_code || addressData.postal_code,
                    country: order.profiles?.country || addressData.country,
                    state: (order.profiles as any)?.state || addressData.state,
                    email: order.profiles?.email || null, // Keep original email logic
                  },
                  // Store address data separately for reference
                  address_data: addressData
                };
              }
            } catch (addressError) {
              console.warn(`Could not fetch address data for order ${order.id}:`, addressError);
            }
          }
          
          return order;
        })
      );

      console.log(`✅ Successfully fetched and enhanced ${enhancedOrders?.length || 0} orders`);
      return enhancedOrders || [];
    } catch (error) {
      console.error("💥 Unexpected error in fetchOrders:", error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    try {
      console.log(`📝 Updating order ${orderId.substring(0, 8)} status to ${newStatus}`);

      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ No authenticated user found:", userError);
        throw new Error("Authentication required to update orders");
      }

      // Only admins can update order status
      const isAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';
      if (!isAdmin) {
        throw new Error("Only administrators can update order status");
      }

      // Get current order status and items before updating
      const { data: currentOrder, error: orderFetchError } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (orderFetchError) {
        console.error("❌ Error fetching current order:", orderFetchError);
        throw new Error(`Failed to fetch current order: ${orderFetchError.message}`);
      }

      const currentStatus = currentOrder.status;

      // Handle stock management based on status changes
      if (newStatus === 'accepted' && currentStatus === 'pending') {
        console.log("📦 Order accepted - decreasing stock for items");
        
        // Fetch order items to decrease stock
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (itemsError) {
          console.error("❌ Error fetching order items:", itemsError);
          throw new Error(`Failed to fetch order items: ${itemsError.message}`);
        }

        if (orderItems && orderItems.length > 0) {
          try {
            await StockService.decreaseStockForOrder(orderItems);
          } catch (stockError) {
            console.error("❌ Stock decrease failed:", stockError);
            throw new Error(`Cannot accept order: ${stockError instanceof Error ? stockError.message : 'Stock update failed'}`);
          }
        }
      } else if (newStatus === 'cancelled' && (currentStatus === 'accepted' || currentStatus === 'processing')) {
        console.log("🔄 Order cancelled - restoring stock for items");
        
        // Fetch order items to restore stock
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (itemsError) {
          console.error("❌ Error fetching order items for cancellation:", itemsError);
          // Don't throw error for stock restoration failure on cancellation
        } else if (orderItems && orderItems.length > 0) {
          try {
            await StockService.increaseStockForOrder(orderItems);
          } catch (stockError) {
            console.warn("⚠️ Stock restoration failed on cancellation:", stockError);
            // Don't throw error, just log warning
          }
        }
      }

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) {
        console.error("❌ Error updating order status:", error);
        throw new Error(`Failed to update order status: ${error.message}`);
      }

      console.log(`✅ Successfully updated order ${orderId.substring(0, 8)} status to ${newStatus}`);
    } catch (error) {
      console.error("💥 Unexpected error in updateOrderStatus:", error);
      throw error;
    }
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      console.log(`🔍 Fetching order details for ${orderId.substring(0, 8)}`);

      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ No authenticated user found:", userError);
        throw new Error("Authentication required to fetch order details");
      }

      const isAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';

      // Updated query with proper profile join
      let query = supabase
        .from("orders")
        .select(`
          *,
          profiles(
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            state
          )
        `)
        .eq("id", orderId);

      // For non-admin users, filter by user_id
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data: order, error } = await query.maybeSingle();

      if (error) {
        console.error("❌ Error fetching order:", error);
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      if (!order) {
        console.log(`❌ Order ${orderId.substring(0, 8)} not found or access denied for user ${user.id}`);
        return null;
      }

      console.log(`✅ Successfully fetched order ${orderId.substring(0, 8)} for user ${user.id}`);
      return order;
    } catch (error) {
      console.error("💥 Unexpected error in getOrderById:", error);
      throw error;
    }
  }
}