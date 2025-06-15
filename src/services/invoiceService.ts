
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
  static async getInvoiceSettings(): Promise<InvoiceSettings | null> {
    try {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Error fetching invoice settings:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting invoice settings:", error);
      return null;
    }
  }

  static async generateInvoiceForOrder(orderId: string): Promise<Blob | null> {
    try {
      console.log(`📄 Generating invoice for order ${orderId.substring(0, 8)}`);

      // Fetch invoice settings
      const invoiceSettings = await this.getInvoiceSettings();
      if (!invoiceSettings) {
        console.error("No invoice settings found");
        return null;
      }

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

      // Generate invoice number and update counter
      const invoiceNumber = `${invoiceSettings.invoice_prefix}-${String(invoiceSettings.invoice_counter).padStart(4, '0')}`;
      
      // Update the invoice counter for next invoice
      await supabase
        .from("invoice_settings")
        .update({ invoice_counter: invoiceSettings.invoice_counter + 1 })
        .eq("id", invoiceSettings.id);

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
