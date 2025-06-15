
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus } from "@/types/order";

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

      let query = supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_profiles_fkey(
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

      // If not admin view, filter by user_id for customer isolation
      if (!isAdminView) {
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

      console.log(`✅ Successfully fetched ${orders?.length || 0} orders`);
      return orders || [];
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

      // Query order with explicit user filtering for customers
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_profiles_fkey(
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
        .eq("id", orderId)
        .eq("user_id", user.id) // Customers can only see their own orders
        .maybeSingle();

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
