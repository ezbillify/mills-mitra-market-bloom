
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

      const isActualAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';
      console.log(`👤 User ${user.email} is admin: ${isActualAdmin}`);

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

      // Only admins can update order status
      const isAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';
      if (!isAdmin) {
        throw new Error("Only administrators can update order status");
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

      const isAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';

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
