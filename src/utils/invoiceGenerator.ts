
import jsPDF from 'jspdf';
import { Order } from '@/types/order';

interface InvoiceItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    description: string | null;
  };
}

interface InvoiceData {
  order: Order;
  orderItems: InvoiceItem[];
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gst: string;
  };
}

export class InvoiceGenerator {
  private static getCompanyInfo() {
    return {
      name: "Your Company Name",
      address: "123 Business Street, City, State 12345",
      phone: "+91 9876543210",
      email: "info@yourcompany.com",
      gst: "22AAAAA0000A1Z5"
    };
  }

  static async generateInvoice(invoiceData: InvoiceData): Promise<Blob> {
    const { order, orderItems } = invoiceData;
    const doc = new jsPDF();
    
    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = '#1f2937';
    const secondaryColor = '#6b7280';
    const accentColor = '#3b82f6';
    
    // Header
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 25);
    
    // Company Info
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.companyInfo.name, 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.companyInfo.address, 20, 65);
    doc.text(`Phone: ${invoiceData.companyInfo.phone}`, 20, 72);
    doc.text(`Email: ${invoiceData.companyInfo.email}`, 20, 79);
    doc.text(`GST: ${invoiceData.companyInfo.gst}`, 20, 86);
    
    // Invoice details
    const invoiceNumber = `INV-${order.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', pageWidth - 80, 55);
    doc.text('Invoice Date:', pageWidth - 80, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, pageWidth - 80, 62);
    doc.text(invoiceDate, pageWidth - 80, 72);
    
    // Customer Info
    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Customer'
      : `Customer ${order.user_id.substring(0, 8)}`;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 105);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(customerName, 20, 115);
    if (order.profiles?.email) {
      doc.text(order.profiles.email, 20, 122);
    }
    if (order.profiles?.phone) {
      doc.text(order.profiles.phone, 20, 129);
    }
    
    // Shipping Address
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ship To:', 20, 145);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const shippingLines = order.shipping_address.split('\n');
    let yPos = 155;
    shippingLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 7;
    });
    
    // Items table
    const tableStartY = Math.max(yPos + 10, 180);
    
    // Table header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, tableStartY, pageWidth - 40, 15, 'F');
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, tableStartY + 10);
    doc.text('Qty', pageWidth - 120, tableStartY + 10);
    doc.text('Price', pageWidth - 80, tableStartY + 10);
    doc.text('Total', pageWidth - 40, tableStartY + 10);
    
    // Table rows
    let currentY = tableStartY + 20;
    let subtotal = 0;
    
    orderItems.forEach((item, index) => {
      const itemTotal = item.quantity * Number(item.price);
      subtotal += itemTotal;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Item name (wrap if too long)
      const itemName = item.products.name;
      if (itemName.length > 30) {
        const words = itemName.split(' ');
        let line = '';
        let lineY = currentY;
        
        words.forEach((word) => {
          if ((line + word).length > 30) {
            doc.text(line, 25, lineY);
            line = word + ' ';
            lineY += 7;
          } else {
            line += word + ' ';
          }
        });
        doc.text(line, 25, lineY);
        currentY = lineY + 7;
      } else {
        doc.text(itemName, 25, currentY);
        currentY += 12;
      }
      
      // Quantity, price, total
      doc.text(item.quantity.toString(), pageWidth - 120, currentY - 5);
      doc.text(`₹${Number(item.price).toFixed(2)}`, pageWidth - 80, currentY - 5);
      doc.text(`₹${itemTotal.toFixed(2)}`, pageWidth - 40, currentY - 5);
      
      // Line separator
      if (index < orderItems.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.line(20, currentY + 2, pageWidth - 20, currentY + 2);
        currentY += 10;
      }
    });
    
    // Totals section
    currentY += 20;
    const totalsX = pageWidth - 100;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX - 30, currentY);
    doc.text(`₹${subtotal.toFixed(2)}`, totalsX + 10, currentY);
    
    if (order.delivery_price && order.delivery_price > 0) {
      currentY += 10;
      doc.text('Shipping:', totalsX - 30, currentY);
      doc.text(`₹${Number(order.delivery_price).toFixed(2)}`, totalsX + 10, currentY);
    }
    
    // Total line
    currentY += 15;
    doc.setDrawColor(31, 41, 55);
    doc.line(totalsX - 40, currentY - 5, pageWidth - 20, currentY - 5);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', totalsX - 30, currentY);
    doc.text(`₹${Number(order.total).toFixed(2)}`, totalsX + 10, currentY);
    
    // Footer
    const footerY = pageHeight - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Thank you for your business!', 20, footerY);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 20, footerY + 7);
    
    // Return PDF as blob
    return doc.output('blob');
  }

  static downloadInvoice(pdfBlob: Blob, filename: string) {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
