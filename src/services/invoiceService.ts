
import { supabase } from "@/integrations/supabase/client";
import { InvoiceGenerator } from "@/utils/invoiceGenerator";
import { Order } from "@/types/order";

interface InvoiceSettings {
  id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  gst_number: string;
  fssai_number: string | null;
  pan_number: string | null;
  invoice_prefix: string;
  invoice_counter: number;
  terms_and_conditions: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
}

export class InvoiceService {
  static async getInvoiceSettings(): Promise<InvoiceSettings> {
    try {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn("Error fetching invoice settings, using defaults:", error);
      }

      return data || {
        id: "default",
        company_name: "Your Company Name",
        company_address: "Your Company Address",
        company_phone: "Your Phone Number",
        company_email: "your@email.com",
        gst_number: "Your GST Number",
        fssai_number: null,
        pan_number: null,
        invoice_prefix: "INV",
        invoice_counter: 1,
        terms_and_conditions: "Thank you for your business!",
        bank_name: null,
        account_number: null,
        ifsc_code: null
      };
    } catch (error) {
      console.warn("Error getting invoice settings, using defaults:", error);
      return {
        id: "default",
        company_name: "Your Company Name",
        company_address: "Your Company Address",
        company_phone: "Your Phone Number",
        company_email: "your@email.com",
        gst_number: "Your GST Number",
        fssai_number: null,
        pan_number: null,
        invoice_prefix: "INV",
        invoice_counter: 1,
        terms_and_conditions: "Thank you for your business!",
        bank_name: null,
        account_number: null,
        ifsc_code: null
      };
    }
  }

  static async generateInvoiceForOrder(orderId: string): Promise<Blob | null> {
    try {
      console.log(`📄 Generating invoice for order ${orderId.substring(0, 8)}`);

      // Fetch invoice settings with improved error handling
      const invoiceSettings = await this.getInvoiceSettings();
      console.log(`⚙️ Using invoice settings: ${invoiceSettings.company_name}`);

      // Fetch order details with consistent query for both admin and customer
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
        .maybeSingle();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        throw new Error(`Order not found: ${orderError.message}`);
      }

      if (!order) {
        console.error("Order not found for ID:", orderId);
        throw new Error("Order not found or you don't have access to this order");
      }

      console.log(`📦 Order found: ${order.id.substring(0, 8)} with status ${order.status}`);

      // Fetch order items with product details using consistent query
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products (
            name,
            description,
            hsn_code,
            gst_percentage
          )
        `)
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw new Error(`Could not fetch order items: ${itemsError.message}`);
      }

      if (!orderItems || orderItems.length === 0) {
        console.error("No items found for order:", orderId);
        throw new Error("No items found for this order");
      }

      console.log(`📋 Found ${orderItems.length} items for order`);

      // Generate consistent invoice number for both customer and admin
      const invoiceNumber = `${invoiceSettings.invoice_prefix}-${orderId.substring(0, 8)}`;

      const invoiceData = {
        order,
        orderItems: orderItems || [],
        companyInfo: {
          name: invoiceSettings.company_name,
          address: invoiceSettings.company_address,
          phone: invoiceSettings.company_phone,
          email: invoiceSettings.company_email,
          gst: invoiceSettings.gst_number,
          fssai: invoiceSettings.fssai_number,
          pan: invoiceSettings.pan_number,
        },
        invoiceNumber,
        termsAndConditions: invoiceSettings.terms_and_conditions,
        bankDetails: invoiceSettings.bank_name ? {
          bankName: invoiceSettings.bank_name,
          accountNumber: invoiceSettings.account_number,
          ifscCode: invoiceSettings.ifsc_code,
        } : null
      };

      console.log(`🧾 Generating PDF with invoice number: ${invoiceNumber}`);
      const pdfBlob = await InvoiceGenerator.generateInvoice(invoiceData);
      console.log(`✅ Invoice generated successfully for order ${orderId.substring(0, 8)}`);
      
      return pdfBlob;
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      // Re-throw with more context for customer-facing errors
      if (error.message?.includes('JWT')) {
        throw new Error("Authentication error. Please login and try again.");
      } else if (error.message?.includes('permission')) {
        throw new Error("You don't have permission to access this invoice.");
      }
      throw error;
    }
  }

  static async downloadInvoiceForOrder(orderId: string) {
    try {
      console.log(`🔽 Starting invoice download for order ${orderId.substring(0, 8)}`);
      const pdfBlob = await this.generateInvoiceForOrder(orderId);
      if (pdfBlob) {
        const filename = `invoice-${orderId.substring(0, 8)}.pdf`;
        console.log(`💾 Downloading invoice as: ${filename}`);
        InvoiceGenerator.downloadInvoice(pdfBlob, filename);
      } else {
        throw new Error("Failed to generate PDF invoice");
      }
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      throw error;
    }
  }
}
