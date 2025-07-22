
import { supabase } from "@/integrations/supabase/client";

export interface SalesData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  items: string;
  hsnCodes: string;
  quantity: number;
  amount: number;
  tax: number;
  total: number;
  status: string;
  shippingAddress: string;
  gstBreakdown: string;
}

export class SalesExporter {
  static async fetchSalesData(startDate?: string, endDate?: string): Promise<SalesData[]> {
    let query = supabase
      .from("orders")
      .select(`
        id,
        created_at,
        total,
        status,
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
            hsn_code,
            gst_percentage
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
      throw new Error(`Failed to fetch sales data: ${error.message}`);
    }

    return (orders || []).map((order: any) => {
      const customerName = order.profiles 
        ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'N/A'
        : 'N/A';
      
      const items = order.order_items?.map((item: any) => item.products?.name).join(', ') || 'N/A';
      const hsnCodes = order.order_items?.map((item: any) => item.products?.hsn_code || 'N/A').join(', ') || 'N/A';
      const totalQuantity = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      
      // Calculate tax breakdown based on individual items
      let totalTax = 0;
      let totalTaxableAmount = 0;
      const gstBreakdownParts: string[] = [];
      
      order.order_items?.forEach((item: any) => {
        const itemTotal = Number(item.price) * item.quantity;
        const gstRate = item.products?.gst_percentage || 18;
        const itemTax = (itemTotal * gstRate) / (100 + gstRate); // If price includes tax
        
        totalTax += itemTax;
        totalTaxableAmount += itemTotal - itemTax;
        
        if (gstRate > 0) {
          gstBreakdownParts.push(`${item.products?.name}: ${gstRate}% GST`);
        }
      });

      const gstBreakdown = gstBreakdownParts.join('; ') || 'No GST';

      return {
        orderId: order.id.substring(0, 8),
        orderDate: new Date(order.created_at).toLocaleDateString('en-IN'),
        customerName,
        customerEmail: order.profiles?.email || 'N/A',
        items,
        hsnCodes,
        quantity: totalQuantity,
        amount: totalTaxableAmount,
        tax: totalTax,
        total: Number(order.total),
        status: order.status,
        shippingAddress: order.shipping_address.replace(/\n/g, ' '),
        gstBreakdown
      };
    });
  }

  static exportToCSV(salesData: SalesData[], filename: string = 'sales-data.csv') {
    const headers = [
      'Order ID',
      'Order Date',
      'Customer Name',
      'Customer Email',
      'Items',
      'HSN Codes',
      'Quantity',
      'Taxable Amount',
      'Tax Amount',
      'Total Amount',
      'Status',
      'Shipping Address',
      'GST Breakdown'
    ];

    const csvContent = [
      headers.join(','),
      ...salesData.map(row => [
        row.orderId,
        row.orderDate,
        `"${row.customerName}"`,
        row.customerEmail,
        `"${row.items}"`,
        `"${row.hsnCodes}"`,
        row.quantity,
        row.amount.toFixed(2),
        row.tax.toFixed(2),
        row.total.toFixed(2),
        row.status,
        `"${row.shippingAddress}"`,
        `"${row.gstBreakdown}"`
      ].join(','))
    ].join('\n');

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
  }

  static exportToExcel(salesData: SalesData[], filename: string = 'sales-data.xlsx') {
    const headers = [
      'Order ID',
      'Order Date',
      'Customer Name',
      'Customer Email',
      'Items Purchased',
      'HSN Codes',
      'Total Quantity',
      'Taxable Amount (₹)',
      'Tax Amount (₹)',
      'Total Amount (₹)',
      'Order Status',
      'Shipping Address',
      'GST Breakdown'
    ];

    const csvContent = [
      headers.join('\t'),
      ...salesData.map(row => [
        row.orderId,
        row.orderDate,
        row.customerName,
        row.customerEmail,
        row.items.replace(/"/g, '""'),
        row.hsnCodes.replace(/"/g, '""'),
        row.quantity,
        row.amount.toFixed(2),
        row.tax.toFixed(2),
        row.total.toFixed(2),
        row.status,
        row.shippingAddress.replace(/"/g, '""'),
        row.gstBreakdown.replace(/"/g, '""')
      ].join('\t'))
    ].join('\n');

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
  }
}
