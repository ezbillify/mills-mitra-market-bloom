
import { supabase } from "@/integrations/supabase/client";

export interface GSTR1Invoice {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_gstin: string | null;
  place_of_supply: string;
  reverse_charge: 'N' | 'Y';
  invoice_type: 'Regular' | 'SEZ supplies with payment' | 'SEZ supplies without payment' | 'Deemed Exp';
  ecommerce_gstin: string | null;
  rate: number;
  taxable_value: number;
  cess_amount: number;
  hsn_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

export interface GSTR1Summary {
  total_invoices: number;
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_cess: number;
  total_tax: number;
  total_invoice_value: number;
  period_from: string;
  period_to: string;
}

export class GSTR1Exporter {
  static async exportGSTR1Data(fromDate: string, toDate: string): Promise<{ invoices: GSTR1Invoice[], summary: GSTR1Summary }> {
    try {
      console.log(`📊 Exporting GSTR-1 data from ${fromDate} to ${toDate}`);

      // Fetch orders within the date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_profiles_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .eq('status', 'completed');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        console.log('No completed orders found in the specified date range');
        return {
          invoices: [],
          summary: {
            total_invoices: 0,
            total_taxable_value: 0,
            total_cgst: 0,
            total_sgst: 0,
            total_igst: 0,
            total_cess: 0,
            total_tax: 0,
            total_invoice_value: 0,
            period_from: fromDate,
            period_to: toDate
          }
        };
      }

      const invoices: GSTR1Invoice[] = [];
      let totalTaxableValue = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let totalCess = 0;

      // Process each order
      for (const order of orders) {
        // Fetch order items with product details
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (
              name,
              description,
              hsn_code,
              gst_percentage
            )
          `)
          .eq('order_id', order.id);

        if (itemsError || !orderItems) {
          console.error('Error fetching order items:', itemsError);
          continue;
        }

        // Determine place of supply (Karnataka vs outside Karnataka)
        const isKarnataka = order.shipping_address.toLowerCase().includes('karnataka') || 
                           order.shipping_address.toLowerCase().includes('bengaluru') ||
                           order.shipping_address.toLowerCase().includes('bangalore');

        // Process each item in the order
        for (const item of orderItems) {
          const product = item.products;
          if (!product) continue;

          const gstRate = product.gst_percentage || 18;
          const itemTotal = item.quantity * Number(item.price);
          const taxableValue = itemTotal / (1 + gstRate / 100); // Assuming price includes tax
          const totalTax = itemTotal - taxableValue;

          let cgstAmount = 0;
          let sgstAmount = 0;
          let igstAmount = 0;

          if (isKarnataka) {
            // Karnataka: CGST + SGST
            cgstAmount = totalTax / 2;
            sgstAmount = totalTax / 2;
          } else {
            // Outside Karnataka: IGST
            igstAmount = totalTax;
          }

          const customerName = order.profiles 
            ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Customer'
            : `Customer ${order.user_id.substring(0, 8)}`;

          const invoice: GSTR1Invoice = {
            invoice_number: `INV-${order.id.substring(0, 8)}`,
            invoice_date: new Date(order.created_at).toLocaleDateString('en-IN'),
            customer_name: customerName,
            customer_gstin: null, // Not available in current schema
            place_of_supply: isKarnataka ? 'Karnataka' : 'Outside Karnataka',
            reverse_charge: 'N',
            invoice_type: 'Regular',
            ecommerce_gstin: null,
            rate: gstRate,
            taxable_value: Number(taxableValue.toFixed(2)),
            cess_amount: 0,
            hsn_code: product.hsn_code || '1234',
            description: product.name,
            quantity: item.quantity,
            unit: 'PCS',
            unit_price: Number(item.price),
            discount: 0,
            cgst_rate: isKarnataka ? gstRate / 2 : 0,
            sgst_rate: isKarnataka ? gstRate / 2 : 0,
            igst_rate: isKarnataka ? 0 : gstRate,
            cgst_amount: Number(cgstAmount.toFixed(2)),
            sgst_amount: Number(sgstAmount.toFixed(2)),
            igst_amount: Number(igstAmount.toFixed(2)),
            total_amount: Number(itemTotal.toFixed(2))
          };

          invoices.push(invoice);

          // Add to totals
          totalTaxableValue += taxableValue;
          totalCGST += cgstAmount;
          totalSGST += sgstAmount;
          totalIGST += igstAmount;
        }
      }

      const summary: GSTR1Summary = {
        total_invoices: invoices.length,
        total_taxable_value: Number(totalTaxableValue.toFixed(2)),
        total_cgst: Number(totalCGST.toFixed(2)),
        total_sgst: Number(totalSGST.toFixed(2)),
        total_igst: Number(totalIGST.toFixed(2)),
        total_cess: Number(totalCess.toFixed(2)),
        total_tax: Number((totalCGST + totalSGST + totalIGST + totalCess).toFixed(2)),
        total_invoice_value: Number((totalTaxableValue + totalCGST + totalSGST + totalIGST + totalCess).toFixed(2)),
        period_from: fromDate,
        period_to: toDate
      };

      // Store the export data in the database
      const exportData = { invoices, summary } as any; // Type assertion to bypass the type checking

      await supabase
        .from('gstr1_exports')
        .insert({
          export_date: new Date().toISOString().split('T')[0],
          period_from: fromDate,
          period_to: toDate,
          total_taxable_value: summary.total_taxable_value,
          total_tax_amount: summary.total_tax,
          total_invoice_value: summary.total_invoice_value,
          export_data: exportData
        });

      console.log(`✅ GSTR-1 export completed: ${invoices.length} invoices processed`);
      return { invoices, summary };

    } catch (error) {
      console.error('Error exporting GSTR-1 data:', error);
      throw error;
    }
  }

  static generateCSV(invoices: GSTR1Invoice[]): string {
    const headers = [
      'Invoice Number', 'Invoice Date', 'Customer Name', 'Customer GSTIN', 'Place of Supply',
      'Reverse Charge', 'Invoice Type', 'E-commerce GSTIN', 'HSN Code', 'Description',
      'Quantity', 'Unit', 'Unit Price', 'Discount', 'Taxable Value',
      'CGST Rate', 'SGST Rate', 'IGST Rate', 'CGST Amount', 'SGST Amount', 'IGST Amount',
      'Cess Amount', 'Total Amount'
    ];

    const csvContent = [
      headers.join(','),
      ...invoices.map(invoice => [
        invoice.invoice_number,
        invoice.invoice_date,
        `"${invoice.customer_name}"`,
        invoice.customer_gstin || '',
        `"${invoice.place_of_supply}"`,
        invoice.reverse_charge,
        invoice.invoice_type,
        invoice.ecommerce_gstin || '',
        invoice.hsn_code,
        `"${invoice.description}"`,
        invoice.quantity,
        invoice.unit,
        invoice.unit_price,
        invoice.discount,
        invoice.taxable_value,
        invoice.cgst_rate,
        invoice.sgst_rate,
        invoice.igst_rate,
        invoice.cgst_amount,
        invoice.sgst_amount,
        invoice.igst_amount,
        invoice.cess_amount,
        invoice.total_amount
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  static downloadCSV(invoices: GSTR1Invoice[], filename: string) {
    const csvContent = this.generateCSV(invoices);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
