
import { supabase } from "@/integrations/supabase/client";
import { TaxCalculator } from "./taxCalculator";

export interface GSTR1Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  customerGSTIN?: string;
  customerName: string;
  customerAddress: string;
  items: GSTR1Item[];
  totalTaxableValue: number;
  totalTaxAmount: number;
  totalInvoiceValue: number;
  placeOfSupply: string;
  invoiceType: 'B2B' | 'B2C';
}

export interface GSTR1Item {
  hsnCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTaxAmount: number;
}

export interface GSTR1Summary {
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTaxAmount: number;
  totalInvoiceValue: number;
  invoiceCount: number;
}

export class GSTR1Exporter {
  static async fetchGSTR1Data(startDate: string, endDate: string): Promise<GSTR1Invoice[]> {
    // Fetch orders with detailed information
    let query = supabase
      .from("orders")
      .select(`
        id,
        created_at,
        total,
        shipping_address,
        profiles!user_id (
          first_name,
          last_name,
          email
        ),
        order_items (
          quantity,
          price,
          products (
            name,
            description,
            hsn_code,
            gst_percentage,
            product_type
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch GSTR-1 data: ${error.message}`);
    }

    return (orders || []).map((order: any) => {
      const customerName = order.profiles 
        ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Customer'
        : `Customer ${order.id.substring(0, 8)}`;

      const isKarnataka = order.shipping_address.toLowerCase().includes('karnataka') || 
                         order.shipping_address.toLowerCase().includes('bengaluru') ||
                         order.shipping_address.toLowerCase().includes('bangalore');

      let totalTaxableValue = 0;
      let totalTaxAmount = 0;

      const items: GSTR1Item[] = (order.order_items || []).map((item: any) => {
        const product = item.products;
        const gstRate = product.gst_percentage || 18;
        const taxableValue = Number(item.price) * item.quantity;
        const taxBreakdown = TaxCalculator.calculateTaxBreakdown(taxableValue, gstRate, order.shipping_address);

        totalTaxableValue += taxableValue;
        totalTaxAmount += taxBreakdown.totalTax;

        return {
          hsnCode: product.hsn_code || '1234',
          description: product.name,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          taxableValue,
          gstRate,
          cgstAmount: taxBreakdown.cgst,
          sgstAmount: taxBreakdown.sgst,
          igstAmount: taxBreakdown.igst,
          totalTaxAmount: taxBreakdown.totalTax
        };
      });

      return {
        invoiceNumber: `INV-${order.id.substring(0, 8)}`,
        invoiceDate: new Date(order.created_at).toLocaleDateString('en-IN'),
        customerName,
        customerAddress: order.shipping_address.replace(/\n/g, ' '),
        items,
        totalTaxableValue,
        totalTaxAmount,
        totalInvoiceValue: totalTaxableValue + totalTaxAmount,
        placeOfSupply: isKarnataka ? 'Karnataka' : 'Outside Karnataka',
        invoiceType: 'B2C' // Assuming B2C for now, can be enhanced later
      };
    });
  }

  static calculateGSTR1Summary(invoices: GSTR1Invoice[]): GSTR1Summary {
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    invoices.forEach(invoice => {
      totalTaxableValue += invoice.totalTaxableValue;
      
      invoice.items.forEach(item => {
        if (item.cgstAmount) totalCGST += item.cgstAmount;
        if (item.sgstAmount) totalSGST += item.sgstAmount;
        if (item.igstAmount) totalIGST += item.igstAmount;
      });
    });

    const totalTaxAmount = totalCGST + totalSGST + totalIGST;
    const totalInvoiceValue = totalTaxableValue + totalTaxAmount;

    return {
      totalTaxableValue,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTaxAmount,
      totalInvoiceValue,
      invoiceCount: invoices.length
    };
  }

  static async exportGSTR1CSV(startDate: string, endDate: string, filename: string = 'gstr1-data.csv') {
    const invoices = await this.fetchGSTR1Data(startDate, endDate);
    const summary = this.calculateGSTR1Summary(invoices);
    
    // Save to database
    await supabase.from("gstr1_exports").insert({
      export_date: new Date().toISOString().split('T')[0],
      period_from: startDate,
      period_to: endDate,
      total_taxable_value: summary.totalTaxableValue,
      total_tax_amount: summary.totalTaxAmount,
      total_invoice_value: summary.totalInvoiceValue,
      export_data: { invoices, summary }
    });

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Customer Name',
      'Customer Address',
      'Place of Supply',
      'Invoice Type',
      'HSN Code',
      'Item Description',
      'Quantity',
      'Unit Price',
      'Taxable Value',
      'GST Rate (%)',
      'CGST Amount',
      'SGST Amount',
      'IGST Amount',
      'Total Tax Amount',
      'Invoice Value'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    // Add invoice data
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const row = [
          invoice.invoiceNumber,
          invoice.invoiceDate,
          `"${invoice.customerName}"`,
          `"${invoice.customerAddress}"`,
          invoice.placeOfSupply,
          invoice.invoiceType,
          item.hsnCode,
          `"${item.description}"`,
          item.quantity,
          item.unitPrice.toFixed(2),
          item.taxableValue.toFixed(2),
          item.gstRate,
          (item.cgstAmount || 0).toFixed(2),
          (item.sgstAmount || 0).toFixed(2),
          (item.igstAmount || 0).toFixed(2),
          item.totalTaxAmount.toFixed(2),
          (item.taxableValue + item.totalTaxAmount).toFixed(2)
        ];
        csvRows.push(row.join(','));
      });
    });

    // Add summary
    csvRows.push(''); // Empty line
    csvRows.push('SUMMARY');
    csvRows.push(`Total Invoices,${summary.invoiceCount}`);
    csvRows.push(`Total Taxable Value,${summary.totalTaxableValue.toFixed(2)}`);
    csvRows.push(`Total CGST,${summary.totalCGST.toFixed(2)}`);
    csvRows.push(`Total SGST,${summary.totalSGST.toFixed(2)}`);
    csvRows.push(`Total IGST,${summary.totalIGST.toFixed(2)}`);
    csvRows.push(`Total Tax Amount,${summary.totalTaxAmount.toFixed(2)}`);
    csvRows.push(`Total Invoice Value,${summary.totalInvoiceValue.toFixed(2)}`);

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return summary;
  }

  static async exportGSTR1Excel(startDate: string, endDate: string, filename: string = 'gstr1-data.xlsx') {
    const invoices = await this.fetchGSTR1Data(startDate, endDate);
    const summary = this.calculateGSTR1Summary(invoices);

    const headers = [
      'Invoice Number',
      'Invoice Date', 
      'Customer Name',
      'Customer Address',
      'Place of Supply',
      'Invoice Type',
      'HSN Code',
      'Item Description',
      'Quantity',
      'Unit Price (₹)',
      'Taxable Value (₹)',
      'GST Rate (%)',
      'CGST Amount (₹)',
      'SGST Amount (₹)',
      'IGST Amount (₹)',
      'Total Tax Amount (₹)',
      'Invoice Value (₹)'
    ];

    const csvRows = [];
    csvRows.push(headers.join('\t'));

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const row = [
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.customerName,
          invoice.customerAddress.replace(/"/g, '""'),
          invoice.placeOfSupply,
          invoice.invoiceType,
          item.hsnCode,
          item.description.replace(/"/g, '""'),
          item.quantity,
          item.unitPrice.toFixed(2),
          item.taxableValue.toFixed(2),
          item.gstRate,
          (item.cgstAmount || 0).toFixed(2),
          (item.sgstAmount || 0).toFixed(2),
          (item.igstAmount || 0).toFixed(2),
          item.totalTaxAmount.toFixed(2),
          (item.taxableValue + item.totalTaxAmount).toFixed(2)
        ];
        csvRows.push(row.join('\t'));
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.xls'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return summary;
  }
}
