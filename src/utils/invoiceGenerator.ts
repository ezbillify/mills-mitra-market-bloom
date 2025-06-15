import jsPDF from 'jspdf';
import { Order } from '@/types/order';
import { TaxCalculator, TaxBreakdown } from './taxCalculator';

interface InvoiceItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    description: string | null;
    hsn_code?: string | null;
    gst_percentage?: number | null;
  };
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  fssai?: string | null;
  pan?: string | null;
}

interface BankDetails {
  bankName: string;
  accountNumber: string | null;
  ifscCode: string | null;
}

interface InvoiceData {
  order: Order;
  orderItems: InvoiceItem[];
  companyInfo: CompanyInfo;
  invoiceNumber: string;
  termsAndConditions?: string | null;
  bankDetails?: BankDetails | null;
}

export class InvoiceGenerator {
  static async generateInvoice(invoiceData: InvoiceData): Promise<Blob> {
    const { order, orderItems, companyInfo, invoiceNumber, termsAndConditions, bankDetails } = invoiceData;
    const doc = new jsPDF();
    
    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = '#1f2937';
    const secondaryColor = '#6b7280';
    const accentColor = '#3b82f6';
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 20, 25);
    
    // Company Info
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 20, 65);
    doc.text(`Phone: ${companyInfo.phone}`, 20, 72);
    doc.text(`Email: ${companyInfo.email}`, 20, 79);
    doc.text(`GST: ${companyInfo.gst}`, 20, 86);
    
    let currentY = 86;
    if (companyInfo.fssai) {
      currentY += 7;
      doc.text(`FSSAI: ${companyInfo.fssai}`, 20, currentY);
    }
    if (companyInfo.pan) {
      currentY += 7;
      doc.text(`PAN: ${companyInfo.pan}`, 20, currentY);
    }
    
    // Invoice details
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', pageWidth - 80, 55);
    doc.text('Invoice Date:', pageWidth - 80, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, pageWidth - 80, 62);
    doc.text(invoiceDate, pageWidth - 80, 72);
    
    // Payment method
    let paymentType = order.payment_type || "cod";
    let paymentText = paymentType === "cod"
      ? "Cash on Delivery"
      : paymentType === "razorpay"
      ? "Paid via Razorpay"
      : paymentType.charAt(0).toUpperCase() + paymentType.slice(1);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', pageWidth - 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(paymentText, pageWidth - 80, 87);
    
    // Customer Info
    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Customer'
      : `Customer ${order.user_id.substring(0, 8)}`;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 115);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(customerName, 20, 125);
    if (order.profiles?.email) {
      doc.text(order.profiles.email, 20, 132);
    }
    if (order.profiles?.phone) {
      doc.text(order.profiles.phone, 20, 139);
    }
    
    // Shipping Address
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ship To:', 20, 155);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const shippingLines = order.shipping_address.split('\n');
    let yPos = 165;
    shippingLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 7;
    });
    
    // Items table
    const tableStartY = Math.max(yPos + 10, 190);
    
    // Table header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, tableStartY, pageWidth - 40, 15, 'F');
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, tableStartY + 10);
    doc.text('HSN', 80, tableStartY + 10);
    doc.text('Qty', 110, tableStartY + 10);
    doc.text('Rate', 130, tableStartY + 10);
    doc.text('GST%', 155, tableStartY + 10);
    doc.text('Amount', pageWidth - 25, tableStartY + 10);
    
    // Table rows
    let currentTableY = tableStartY + 20;
    let subtotal = 0;
    let totalTaxAmount = 0;
    
    orderItems.forEach((item, index) => {
      const gstPercentage = item.products.gst_percentage || 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstPercentage, order.shipping_address);
      
      subtotal += taxBreakdown.taxableAmount;
      totalTaxAmount += taxBreakdown.totalTax;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Item details
      const itemName = item.products.name.length > 15 ? 
        item.products.name.substring(0, 15) + '...' : 
        item.products.name;
      
      doc.text(itemName, 25, currentTableY);
      doc.text(item.products.hsn_code || 'N/A', 80, currentTableY);
      doc.text(item.quantity.toString(), 110, currentTableY);
      doc.text(`₹${Number(item.price).toFixed(2)}`, 130, currentTableY);
      doc.text(`${gstPercentage}%`, 155, currentTableY);
      doc.text(`₹${itemTotal.toFixed(2)}`, pageWidth - 25, currentTableY);
      
      currentTableY += 12;
      
      // Line separator
      if (index < orderItems.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.line(20, currentTableY - 2, pageWidth - 20, currentTableY - 2);
        currentTableY += 3;
      }
    });
    
    // Totals section with improved tax breakdown
    currentTableY += 20;
    const totalsX = pageWidth - 120;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Subtotal
    doc.text('Subtotal:', totalsX - 50, currentTableY);
    doc.text(`₹${(subtotal + totalTaxAmount).toFixed(2)}`, totalsX + 10, currentTableY);
    
    // Tax breakdown by GST rate
    const taxByRate = new Map<number, { cgst: number, sgst: number, igst: number }>();
    
    orderItems.forEach(item => {
      const gstRate = item.products.gst_percentage || 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstRate, order.shipping_address);
      
      if (!taxByRate.has(gstRate)) {
        taxByRate.set(gstRate, { cgst: 0, sgst: 0, igst: 0 });
      }
      
      const existing = taxByRate.get(gstRate)!;
      existing.cgst += taxBreakdown.cgst || 0;
      existing.sgst += taxBreakdown.sgst || 0;
      existing.igst += taxBreakdown.igst || 0;
    });
    
    // Display tax breakdown by rate
    taxByRate.forEach((taxes, rate) => {
      currentTableY += 8;
      if (taxes.cgst > 0 && taxes.sgst > 0) {
        doc.text(`CGST (${rate/2}%):`, totalsX - 50, currentTableY);
        doc.text(`₹${taxes.cgst.toFixed(2)}`, totalsX + 10, currentTableY);
        currentTableY += 7;
        doc.text(`SGST (${rate/2}%):`, totalsX - 50, currentTableY);
        doc.text(`₹${taxes.sgst.toFixed(2)}`, totalsX + 10, currentTableY);
      } else if (taxes.igst > 0) {
        doc.text(`IGST (${rate}%):`, totalsX - 50, currentTableY);
        doc.text(`₹${taxes.igst.toFixed(2)}`, totalsX + 10, currentTableY);
      }
    });
    
    // Shipping charges
    if (order.delivery_price && order.delivery_price > 0) {
      currentTableY += 10;
      doc.text('Shipping Charges:', totalsX - 50, currentTableY);
      doc.text(`₹${Number(order.delivery_price).toFixed(2)}`, totalsX + 10, currentTableY);
    }
    
    // Total line
    currentTableY += 15;
    doc.setDrawColor(31, 41, 55);
    doc.line(totalsX - 60, currentTableY - 5, pageWidth - 20, currentTableY - 5);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', totalsX - 50, currentTableY);
    doc.text(`₹${Number(order.total).toFixed(2)}`, totalsX + 10, currentTableY);
    
    // Tax summary box
    currentTableY += 20;
    doc.setFillColor(248, 250, 252);
    doc.rect(20, currentTableY, pageWidth - 40, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Summary:', 25, currentTableY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const isKarnataka = order.shipping_address.toLowerCase().includes('karnataka') || 
                       order.shipping_address.toLowerCase().includes('bengaluru') ||
                       order.shipping_address.toLowerCase().includes('bangalore');
    
    if (isKarnataka) {
      doc.text(`Karnataka Address - Total GST: ₹${totalTaxAmount.toFixed(2)} (CGST + SGST)`, 25, currentTableY + 17);
    } else {
      doc.text(`Outside Karnataka - Total GST: ₹${totalTaxAmount.toFixed(2)} (IGST)`, 25, currentTableY + 17);
    }
    
    // Bank Details (if provided)
    if (bankDetails && bankDetails.bankName) {
      currentTableY += 35;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details:', 20, currentTableY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      currentTableY += 10;
      doc.text(`Bank: ${bankDetails.bankName}`, 20, currentTableY);
      
      if (bankDetails.accountNumber) {
        currentTableY += 7;
        doc.text(`Account: ${bankDetails.accountNumber}`, 20, currentTableY);
      }
      
      if (bankDetails.ifscCode) {
        currentTableY += 7;
        doc.text(`IFSC: ${bankDetails.ifscCode}`, 20, currentTableY);
      }
    }
    
    // Terms and Conditions
    if (termsAndConditions) {
      const termsStartY = Math.min(currentTableY + 20, pageHeight - 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', 20, termsStartY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      // Split terms into lines to fit the page width
      const maxWidth = pageWidth - 40;
      const termsLines = doc.splitTextToSize(termsAndConditions, maxWidth);
      let termsY = termsStartY + 10;
      
      termsLines.forEach((line: string) => {
        if (termsY < pageHeight - 20) {
          doc.text(line, 20, termsY);
          termsY += 7;
        }
      });
    }
    
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
