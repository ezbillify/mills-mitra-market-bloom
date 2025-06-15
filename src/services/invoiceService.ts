
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
      console.log("🔧 Attempting to fetch invoice settings...");
      
      // Try to fetch invoice settings - this will work for admins
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn("⚠️ Could not fetch invoice settings (likely due to RLS for customer):", error.message);
      }

      if (data) {
        console.log("✅ Successfully fetched invoice settings from database");
        return data;
      }

      // Fallback to default settings for customers who can't access invoice_settings table
      console.log("📋 Using default invoice settings (customer fallback)");
      return {
        id: "default",
        company_name: "Your Company Name",
        company_address: "123 Business Street, City, State 12345",
        company_phone: "+91 9876543210",
        company_email: "info@yourcompany.com",
        gst_number: "22AAAAA0000A1Z5",
        fssai_number: null,
        pan_number: null,
        invoice_prefix: "INV",
        invoice_counter: 1,
        terms_and_conditions: "Thank you for your business! Please make payment within 30 days of invoice date.",
        bank_name: null,
        account_number: null,
        ifsc_code: null
      };
    } catch (error) {
      console.warn("⚠️ Error getting invoice settings, using defaults:", error);
      return {
        id: "default",
        company_name: "Your Company Name",
        company_address: "123 Business Street, City, State 12345",
        company_phone: "+91 9876543210",
        company_email: "info@yourcompany.com",
        gst_number: "22AAAAA0000A1Z5",
        fssai_number: null,
        pan_number: null,
        invoice_prefix: "INV",
        invoice_counter: 1,
        terms_and_conditions: "Thank you for your business! Please make payment within 30 days of invoice date.",
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

      // Check if current user is admin to determine query approach
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ No authenticated user found:", userError);
        throw new Error("Authentication required to generate invoice");
      }

      const isAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';
      console.log(`👤 User ${user.email} is admin: ${isAdmin}`);

      let orderQuery = supabase
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
        .eq("id", orderId);

      // For non-admin users, add user_id filter to respect RLS
      if (!isAdmin) {
        console.log("🔒 Adding user filter for customer access");
        orderQuery = orderQuery.eq("user_id", user.id);
      }

      const { data: order, error: orderError } = await orderQuery.maybeSingle();

      if (orderError) {
        console.error("❌ Error fetching order:", orderError);
        throw new Error(`Order not found: ${orderError.message}`);
      }

      if (!order) {
        console.error("❌ Order not found for ID:", orderId);
        throw new Error("Order not found or you don't have access to this order");
      }

      console.log(`📦 Order found: ${order.id.substring(0, 8)} with status ${order.status}`);

      // Fetch order items - use consistent query that works for both admin and customer
      let itemsQuery = supabase
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

      const { data: orderItems, error: itemsError } = await itemsQuery;

      if (itemsError) {
        console.error("❌ Error fetching order items:", itemsError);
        throw new Error(`Could not fetch order items: ${itemsError.message}`);
      }

      if (!orderItems || orderItems.length === 0) {
        console.error("❌ No items found for order:", orderId);
        throw new Error("No items found for this order");
      }

      console.log(`📋 Found ${orderItems.length} items for order`);

      // Generate consistent invoice number format
      const invoiceNumber = `${invoiceSettings.invoice_prefix}-${orderId.substring(0, 8).toUpperCase()}`;

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
      console.error("💥 Error generating invoice:", error);
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
        const filename = `invoice-${orderId.substring(0, 8).toUpperCase()}.pdf`;
        console.log(`💾 Downloading invoice as: ${filename}`);
        InvoiceGenerator.downloadInvoice(pdfBlob, filename);
      } else {
        throw new Error("Failed to generate PDF invoice");
      }
    } catch (error: any) {
      console.error("💥 Error downloading invoice:", error);
      throw error;
    }
  }
}
