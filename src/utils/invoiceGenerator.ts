
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
    const primaryColor = '#000000';
    const borderColor = '#000000';
    const headerBgColor = '#f5f5f5';
    
    // Helper function to draw borders
    const drawBorder = (x: number, y: number, width: number, height: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(x, y, width, height);
    };
    
    // Main border
    drawBorder(15, 15, pageWidth - 30, pageHeight - 30);
    
    // Header section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    // TAX INVOICE header (centered)
    const headerText = 'TAX INVOICE';
    const headerWidth = doc.getTextWidth(headerText);
    doc.text(headerText, (pageWidth - headerWidth) / 2, 30);
    
    // ORIGINAL FOR RECIPIENT (right aligned)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ORIGINAL FOR RECIPIENT', pageWidth - 20, 25, { align: 'right' });
    
    // Company info section (left side)
    let currentY = 45;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name.toUpperCase(), 20, currentY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    currentY += 6;
    
    // Company details
    const companyLines = [
      `GSTIN: ${companyInfo.gst}`,
      `FSSAI NO: ${companyInfo.fssai || 'N/A'}`,
      companyInfo.address,
      `Phone: ${companyInfo.phone}`,
      `Email: ${companyInfo.email}`
    ];
    
    companyLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 5;
    });
    
    // Invoice details (right side)
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-GB');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', pageWidth - 80, 45);
    doc.text('Invoice Date:', pageWidth - 80, 52);
    doc.text('Place of Supply:', pageWidth - 80, 59);
    doc.text('Due Date:', pageWidth - 80, 66);
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, pageWidth - 40, 45);
    doc.text(invoiceDate, pageWidth - 40, 52);
    
    // Extract state from shipping address
    const isKarnataka = order.shipping_address.toLowerCase().includes('karnataka') || 
                       order.shipping_address.toLowerCase().includes('bengaluru') ||
                       order.shipping_address.toLowerCase().includes('bangalore');
    doc.text(isKarnataka ? '29-KARNATAKA' : 'OUTSIDE KARNATAKA', pageWidth - 40, 59);
    doc.text(dueDate, pageWidth - 40, 66);
    
    // Bill To section
    currentY = 85;
    
    // Customer info
    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Customer'
      : `Customer ${order.user_id.substring(0, 8)}`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, currentY);
    
    doc.setFont('helvetica', 'normal');
    currentY += 6;
    doc.text(customerName, 20, currentY);
    
    // Shipping address (simplified)
    const addressLines = order.shipping_address.split(',').slice(0, 3);
    addressLines.forEach(line => {
      currentY += 5;
      doc.text(line.trim(), 20, currentY);
    });
    
    // Items table
    const tableStartY = 120;
    const tableHeight = 120;
    
    // Table structure
    const columns = [
      { header: 'Sl', x: 20, width: 15 },
      { header: 'Items', x: 35, width: 60 },
      { header: 'HSN / SAC', x: 95, width: 25 },
      { header: 'Rate / Item', x: 120, width: 20 },
      { header: 'Disc (%)', x: 140, width: 15 },
      { header: 'Qty', x: 155, width: 15 },
      { header: 'Taxable Vat', x: 170, width: 20 },
      { header: 'Tax Amount', x: 190, width: 20 },
      { header: 'Amount', x: 210, width: 25 }
    ];
    
    // Draw table header
    drawBorder(20, tableStartY, pageWidth - 40, 15);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, tableStartY, pageWidth - 40, 15, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    columns.forEach(col => {
      // Vertical lines
      if (col.x > 20) {
        doc.line(col.x, tableStartY, col.x, tableStartY + tableHeight);
      }
      // Header text
      doc.text(col.header, col.x + 2, tableStartY + 10);
    });
    
    // Right border
    doc.line(pageWidth - 20, tableStartY, pageWidth - 20, tableStartY + tableHeight);
    
    // Table rows
    let rowY = tableStartY + 20;
    let subtotal = 0;
    let totalTaxAmount = 0;
    
    orderItems.forEach((item, index) => {
      const gstPercentage = item.products.gst_percentage || 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstPercentage, order.shipping_address);
      
      subtotal += taxBreakdown.taxableAmount;
      totalTaxAmount += taxBreakdown.totalTax;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      // Row data
      doc.text((index + 1).toString(), 22, rowY);
      
      // Item name (truncated if too long)
      const itemName = item.products.name.length > 25 ? 
        item.products.name.substring(0, 25) + '...' : 
        item.products.name;
      doc.text(itemName, 37, rowY);
      
      doc.text(item.products.hsn_code || 'N/A', 97, rowY);
      doc.text(`₹${Number(item.price).toFixed(2)}`, 122, rowY);
      doc.text('0', 142, rowY); // Discount
      doc.text(item.quantity.toString(), 157, rowY);
      doc.text(`₹${taxBreakdown.taxableAmount.toFixed(2)}`, 172, rowY);
      doc.text(`₹${taxBreakdown.totalTax.toFixed(2)}`, 192, rowY);
      doc.text(`₹${itemTotal.toFixed(2)}`, 212, rowY);
      
      // Horizontal line after each row
      rowY += 15;
      if (index < orderItems.length - 1) {
        doc.line(20, rowY - 7, pageWidth - 20, rowY - 7);
      }
    });
    
    // Table footer section
    const footerY = tableStartY + tableHeight;
    
    // Total items line
    doc.line(20, footerY, pageWidth - 20, footerY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Items ( Qty ) : ${orderItems.reduce((sum, item) => sum + item.quantity, 0)} / ${orderItems.length}.000`, 22, footerY + 8);
    
    // Tax summary on right
    doc.text('Taxable Amount:', 140, footerY + 8);
    doc.text(`₹${(subtotal + totalTaxAmount).toFixed(2)}`, 190, footerY + 8);
    
    // CGST/SGST or IGST breakdown
    let taxDetailsY = footerY + 15;
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
    
    // Tax breakdown table
    drawBorder(20, taxDetailsY, pageWidth - 20, 35);
    
    // Headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('HSN SAC', 25, taxDetailsY + 8);
    doc.text('Taxable Value', 60, taxDetailsY + 8);
    doc.text('Central Tax', 100, taxDetailsY + 8);
    doc.text('State/UT Tax', 130, taxDetailsY + 8);
    doc.text('Total Tax Amount', 170, taxDetailsY + 8);
    
    // Tax lines
    doc.line(20, taxDetailsY + 10, pageWidth - 20, taxDetailsY + 10);
    
    let taxRowY = taxDetailsY + 18;
    taxByRate.forEach((taxes, rate) => {
      const taxableForRate = subtotal / taxByRate.size; // Simplified calculation
      
      doc.setFont('helvetica', 'normal');
      doc.text('1701', 25, taxRowY);
      doc.text(`₹${taxableForRate.toFixed(2)}`, 60, taxRowY);
      
      if (isKarnataka) {
        doc.text(`${rate/2}%`, 105, taxRowY);
        doc.text(`₹${taxes.cgst.toFixed(2)}`, 115, taxRowY);
        doc.text(`${rate/2}%`, 135, taxRowY);
        doc.text(`₹${taxes.sgst.toFixed(2)}`, 145, taxRowY);
      } else {
        doc.text(`${rate}%`, 105, taxRowY);
        doc.text(`₹${taxes.igst.toFixed(2)}`, 115, taxRowY);
        doc.text('-', 135, taxRowY);
        doc.text('-', 145, taxRowY);
      }
      
      doc.text(`₹${(taxes.cgst + taxes.sgst + taxes.igst).toFixed(2)}`, 175, taxRowY);
      taxRowY += 8;
    });
    
    // TOTAL line
    doc.line(80, taxRowY, pageWidth - 20, taxRowY);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 90, taxRowY + 6);
    doc.text(`₹${totalTaxAmount.toFixed(2)}`, 175, taxRowY + 6);
    
    // Grand total
    const grandTotalY = taxRowY + 20;
    doc.setFontSize(10);
    doc.text(`Total amount (in words): ${this.numberToWords(Number(order.total))} Rupees Only`, 20, grandTotalY);
    
    // Final total box
    drawBorder(pageWidth - 80, grandTotalY - 15, 60, 20);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', pageWidth - 75, grandTotalY - 5);
    doc.setFontSize(12);
    doc.text(`₹${Number(order.total).toFixed(2)}`, pageWidth - 45, grandTotalY - 5, { align: 'right' });
    
    // Bank details section
    if (bankDetails && bankDetails.bankName) {
      const bankY = grandTotalY + 20;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details:', 20, bankY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Bank: ${bankDetails.bankName}`, 20, bankY + 8);
      if (bankDetails.accountNumber) {
        doc.text(`Account #: ${bankDetails.accountNumber}`, 20, bankY + 15);
      }
      if (bankDetails.ifscCode) {
        doc.text(`IFSC Code: ${bankDetails.ifscCode}`, 20, bankY + 22);
      }
      doc.text('Branch: MAIN BRANCH', 20, bankY + 29);
    }
    
    // Payment terms
    const paymentY = grandTotalY + 60;
    let paymentType = order.payment_type || "cod";
    let paymentText = paymentType === "cod"
      ? "Cash on Delivery"
      : paymentType === "razorpay"
      ? "Paid via UPI"
      : paymentType.charAt(0).toUpperCase() + paymentType.slice(1);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${Number(order.total).toFixed(2)} Paid via ${paymentText} on ${invoiceDate}`, pageWidth - 20, paymentY, { align: 'right' });
    doc.text('For COMPANY NAME', pageWidth - 20, paymentY + 20, { align: 'right' });
    
    // Signature section
    doc.setFontSize(8);
    doc.text('Receiver\'s Signature', 20, pageHeight - 35);
    doc.text('Authorized Signatory', pageWidth - 20, pageHeight - 35, { align: 'right' });
    
    // Return PDF as blob
    return doc.output('blob');
  }

  // Helper function to convert number to words
  static numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    function convertGroup(n: number): string {
      let result = '';
      
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      
      if (n > 0) {
        result += ones[n] + ' ';
      }
      
      return result;
    }

    const integerPart = Math.floor(num);
    let result = '';
    let groupIndex = 0;

    if (integerPart === 0) return 'Zero';

    while (integerPart > 0) {
      const group = integerPart % (groupIndex === 0 ? 1000 : 100);
      if (group !== 0) {
        result = convertGroup(group) + thousands[groupIndex] + ' ' + result;
      }
      integerPart = Math.floor(integerPart / (groupIndex === 0 ? 1000 : 100));
      groupIndex++;
    }

    return result.trim();
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
