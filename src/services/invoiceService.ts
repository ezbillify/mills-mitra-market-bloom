
import { supabase } from "@/integrations/supabase/client";
import { InvoiceGenerator } from "@/utils/invoiceGenerator";
import { Order } from "@/types/order";

export class InvoiceService {
  static async generateInvoiceForOrder(orderId: string): Promise<Blob | null> {
    try {
      console.log(`📄 Generating invoice for order ${orderId.substring(0, 8)}`);

      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!user_id (
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
        .single();

      if (orderError || !order) {
        console.error("Error fetching order:", orderError);
        return null;
      }

      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products (
            name,
            description
          )
        `)
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        return null;
      }

      const invoiceData = {
        order,
        orderItems: orderItems || [],
        companyInfo: {
          name: "Your Company Name",
          address: "123 Business Street, City, State 12345",
          phone: "+91 9876543210",
          email: "info@yourcompany.com",
          gst: "22AAAAA0000A1Z5"
        }
      };

      const pdfBlob = await InvoiceGenerator.generateInvoice(invoiceData);
      console.log(`✅ Invoice generated successfully for order ${orderId.substring(0, 8)}`);
      
      return pdfBlob;
    } catch (error) {
      console.error("Error generating invoice:", error);
      return null;
    }
  }

  static async downloadInvoiceForOrder(orderId: string) {
    const pdfBlob = await this.generateInvoiceForOrder(orderId);
    if (pdfBlob) {
      const filename = `invoice-${orderId.substring(0, 8)}.pdf`;
      InvoiceGenerator.downloadInvoice(pdfBlob, filename);
    }
  }
}
