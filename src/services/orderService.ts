import { supabase } from "@/integrations/supabase/client";
import { Order, OrderProfile, OrderStatus } from "@/types/order";
import { DebugUtils } from "@/utils/debugUtils";
import { InvoiceService } from "@/services/invoiceService";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    DebugUtils.log("OrderService", "🔍 fetchOrders() called - Enhanced customer-order matching");

    try {
      // Fetch orders with enhanced profile joins and better error handling
      DebugUtils.log("OrderService", "📥 Fetching orders with comprehensive profile data...");
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
      
      if (!ordersData || ordersData.length === 0) {
        DebugUtils.log("OrderService", "📭 No orders found in database");
        return [];
      }

      // Enhanced processing with better customer-order matching
      const processedOrders = ordersData.map((order: any, index: number) => {
        DebugUtils.log("OrderService", `🔄 Processing order ${index + 1}/${ordersData.length} (ID: ${order.id.substring(0, 8)})`);
        
        let orderProfile: OrderProfile | null = null;

        // Enhanced profile processing with better null handling
        if (order.profiles) {
          orderProfile = {
            first_name: order.profiles.first_name,
            last_name: order.profiles.last_name,
            email: order.profiles.email,
            phone: order.profiles.phone,
            address: order.profiles.address,
            city: order.profiles.city,
            postal_code: order.profiles.postal_code,
            country: order.profiles.country
          };
          
          DebugUtils.log("OrderService", `✅ Profile matched for order ${order.id.substring(0, 8)}:`, {
            customer_id: order.user_id.substring(0, 8),
            name: `${orderProfile.first_name || ''} ${orderProfile.last_name || ''}`.trim() || 'No name',
            email: orderProfile.email || 'No email',
            has_address: !!(orderProfile.address || orderProfile.city)
          });
        } else {
          DebugUtils.log("OrderService", `⚠️ No profile found for order ${order.id.substring(0, 8)} (user_id: ${order.user_id.substring(0, 8)})`);
          DebugUtils.log("OrderService", "This customer may not have completed their profile setup");
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
