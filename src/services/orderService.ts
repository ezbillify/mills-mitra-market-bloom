import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";
import { DebugUtils } from "@/utils/debugUtils";
import { InvoiceService } from "@/services/invoiceService";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    DebugUtils.log("OrderService", "🔍 fetchOrders() called - Enhanced customer-order matching with improved profile fetching");

    try {
      // First, fetch all profiles separately to ensure we have the complete customer data
      DebugUtils.log("OrderService", "📥 Step 1: Fetching ALL profiles from database...");
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        DebugUtils.error("OrderService", "Failed to fetch profiles", profilesError);
        // Continue without profiles instead of throwing error
      }

      DebugUtils.log("OrderService", `✅ Fetched ${allProfiles?.length || 0} profiles from database`);

      // Create a map of profiles by user ID for quick lookup
      const profileMap = new Map();
      allProfiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
        DebugUtils.log("OrderService", `📋 Mapped profile: ${profile.id.substring(0, 8)} - ${profile.first_name || 'No name'} ${profile.last_name || ''} (${profile.email || 'No email'})`);
      });

      // Now fetch orders with delivery options
      DebugUtils.log("OrderService", "📦 Step 2: Fetching orders with delivery options...");
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
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) {
        DebugUtils.error("OrderService", "Failed to fetch orders", ordersError);
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      DebugUtils.log("OrderService", `✅ Fetched ${ordersData?.length || 0} orders with delivery data`);
      
      if (!ordersData || ordersData.length === 0) {
        DebugUtils.log("OrderService", "📭 No orders found in database");
        return [];
      }

      // Enhanced processing with manual profile matching
      const processedOrders = ordersData.map((order: any, index: number) => {
        DebugUtils.log("OrderService", `🔄 Processing order ${index + 1}/${ordersData.length} (ID: ${order.id.substring(0, 8)})`);
        
        let orderProfile: OrderProfile | null = null;

        // Manual profile lookup using our profile map
        const customerProfile = profileMap.get(order.user_id);
        if (customerProfile) {
          orderProfile = {
            first_name: customerProfile.first_name,
            last_name: customerProfile.last_name,
            email: customerProfile.email,
            phone: customerProfile.phone,
            address: customerProfile.address,
            city: customerProfile.city,
            postal_code: customerProfile.postal_code,
            country: customerProfile.country
          };
          
          DebugUtils.log("OrderService", `✅ Profile manually matched for order ${order.id.substring(0, 8)}:`, {
            customer_id: order.user_id.substring(0, 8),
            name: `${orderProfile.first_name || ''} ${orderProfile.last_name || ''}`.trim() || 'No name',
            email: orderProfile.email || 'No email',
            phone: orderProfile.phone || 'No phone',
            has_address: !!(orderProfile.address || orderProfile.city)
          });
        } else {
          DebugUtils.log("OrderService", `⚠️ No profile found for order ${order.id.substring(0, 8)} (user_id: ${order.user_id.substring(0, 8)})`);
          DebugUtils.log("OrderService", "This customer may not have completed their profile setup or profile fetch failed");
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

        return processedOrder;
      });

      // Enhanced summary with customer-order statistics
      const ordersWithProfiles = processedOrders.filter(order => order.profiles && (order.profiles.first_name || order.profiles.last_name || order.profiles.email));
      const ordersWithoutProfiles = processedOrders.filter(order => !order.profiles);
      const ordersWithIncompleteProfiles = processedOrders.filter(order => 
        order.profiles && !order.profiles.first_name && !order.profiles.last_name && !order.profiles.email
      );
      
      DebugUtils.log("OrderService", "📊 Enhanced customer-order matching summary:");
      DebugUtils.log("OrderService", `   - Orders with complete customer profiles: ${ordersWithProfiles.length}`);
      DebugUtils.log("OrderService", `   - Orders with incomplete profiles: ${ordersWithIncompleteProfiles.length}`);
      DebugUtils.log("OrderService", `   - Orders without customer profiles: ${ordersWithoutProfiles.length}`);
      DebugUtils.log("OrderService", `   - Total orders processed: ${processedOrders.length}`);
      DebugUtils.log("OrderService", `   - Total profiles available: ${allProfiles?.length || 0}`);

      // Log sample of customer-order matches for debugging
      if (ordersWithProfiles.length > 0) {
        DebugUtils.table("OrderService", "Sample customer-order matches:", ordersWithProfiles.slice(0, 3).map(order => ({
          order_id: order.id.substring(0, 8),
          customer_name: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim(),
          customer_email: order.profiles?.email || 'No email',
          order_total: order.total,
          has_shipping_address: !!order.shipping_address
        })));
      }

      // Special check for the problematic customer
      const problemCustomerId = "a48bc14d-3872-427a-8d28-1ef0889834f3";
      const problemCustomerOrders = processedOrders.filter(order => order.user_id === problemCustomerId);
      const problemCustomerProfile = profileMap.get(problemCustomerId);
      
      DebugUtils.log("OrderService", `🎯 Special check for customer ${problemCustomerId.substring(0, 8)}:`);
      DebugUtils.log("OrderService", `   - Orders found: ${problemCustomerOrders.length}`);
      DebugUtils.log("OrderService", `   - Profile available: ${!!problemCustomerProfile}`);
      if (problemCustomerProfile) {
        DebugUtils.log("OrderService", `   - Profile data: ${problemCustomerProfile.first_name || 'No first name'} ${problemCustomerProfile.last_name || 'No last name'} (${problemCustomerProfile.email || 'No email'})`);
      }

      return processedOrders;

    } catch (error) {
      DebugUtils.error("OrderService", "Critical error in enhanced customer-order fetching", error);
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

    // Auto-generate PDF invoice when status changes to processing
    if (newStatus === "processing") {
      try {
        DebugUtils.log("OrderService", `📄 Auto-generating PDF invoice for order ${orderId.substring(0, 8)}`);
        const pdfBlob = await InvoiceService.generateInvoiceForOrder(orderId);
        if (pdfBlob) {
          DebugUtils.log("OrderService", `✅ PDF invoice auto-generated successfully`);
          // Note: For auto-download, you could trigger the download here
          // InvoiceService.downloadInvoiceForOrder(orderId);
        }
      } catch (error) {
        DebugUtils.error("OrderService", "Failed to auto-generate invoice", error);
        // Don't throw error here as the status update was successful
      }
    }
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
