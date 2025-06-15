
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

      // Always return settings, either from database or defaults
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
      // Return default settings instead of null
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

      // Fetch invoice settings - this will always return settings (either from DB or defaults)
      const invoiceSettings = await this.getInvoiceSettings();

      // Fetch order details with proper error handling
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
        throw new Error("Order not found or could not be fetched");
      }

      // Fetch order items with product details including HSN and GST
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
        throw new Error("Could not fetch order items");
      }

      if (!orderItems || orderItems.length === 0) {
        throw new Error("No items found for this order");
      }

      // Generate invoice number and update counter (only if not using default settings)
      let invoiceNumber = `${invoiceSettings.invoice_prefix}-${String(invoiceSettings.invoice_counter).padStart(4, '0')}`;
      
      if (invoiceSettings.id !== "default") {
        // Update the invoice counter for next invoice
        await supabase
          .from("invoice_settings")
          .update({ invoice_counter: invoiceSettings.invoice_counter + 1 })
          .eq("id", invoiceSettings.id);
      } else {
        // Use order ID for default invoice number
        invoiceNumber = `INV-${orderId.substring(0, 8)}`;
      }

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

      const pdfBlob = await InvoiceGenerator.generateInvoice(invoiceData);
      console.log(`✅ Invoice generated successfully for order ${orderId.substring(0, 8)}`);
      
      return pdfBlob;
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw error; // Re-throw to let the calling code handle the error properly
    }
  }

  static async downloadInvoiceForOrder(orderId: string) {
    try {
      const pdfBlob = await this.generateInvoiceForOrder(orderId);
      if (pdfBlob) {
        const filename = `invoice-${orderId.substring(0, 8)}.pdf`;
        InvoiceGenerator.downloadInvoice(pdfBlob, filename);
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      throw error;
    }
  }
}
