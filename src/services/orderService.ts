
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus } from "@/types/order";
import { InvoiceService } from "@/services/invoiceService";

export class OrderService {
  static async fetchOrders(): Promise<Order[]> {
    console.log("OrderService: Fetching orders with customer profiles...");

    try {
      const { data: ordersData, error } = await supabase
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
          profiles!orders_user_id_profiles_fkey (
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

      if (error) {
        console.error("OrderService: Failed to fetch orders", error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      console.log(`OrderService: Fetched ${ordersData?.length || 0} orders`);
      
      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      return this.processOrdersData(ordersData);
    } catch (error) {
      console.error("OrderService: Error fetching orders", error);
      throw error;
    }
  }

  private static processOrdersData(ordersData: any[]): Order[] {
    return ordersData.map((order: any) => {
      let orderProfile = null;

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
      }

      return {
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
    });
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    console.log(`OrderService: Updating order ${orderId} to status ${newStatus}`);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("OrderService: Failed to update order status", error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    console.log("OrderService: Successfully updated order status");

    if (newStatus === "processing") {
      await this.handleInvoiceGeneration(orderId);
    }
  }

  private static async handleInvoiceGeneration(orderId: string): Promise<void> {
    try {
      console.log("OrderService: Auto-generating PDF invoice");
      const pdfBlob = await InvoiceService.generateInvoiceForOrder(orderId);
      if (pdfBlob) {
        console.log("OrderService: PDF invoice auto-generated successfully");
      }
    } catch (error) {
      console.error("OrderService: Failed to auto-generate invoice", error);
    }
  }

  static async updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void> {
    console.log(`OrderService: Updating tracking number for order ${orderId}`);

    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber })
      .eq("id", orderId);

    if (error) {
      console.error("OrderService: Failed to update tracking number", error);
      throw new Error(`Failed to update tracking number: ${error.message}`);
    }

    console.log("OrderService: Successfully updated tracking number");
  }
}
