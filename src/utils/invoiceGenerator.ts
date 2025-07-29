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
    
    // Page setup
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;
    
    // Color scheme
    const primaryBlue = [52, 73, 94];
    const lightBlue = [236, 240, 241];
    const lightGray = [248, 249, 250];
    
    // Helper functions
    const addText = (text: string, x: number, y: number, options?: any) => {
      const maxWidth = options?.maxWidth || contentWidth;
      if (typeof text === 'string' && text.length > 0) {
        if (options?.maxWidth && doc.getTextWidth(text) > maxWidth) {
          const lines = doc.splitTextToSize(text, maxWidth);
          if (Array.isArray(lines)) {
            lines.forEach((line: string, index: number) => {
              doc.text(line, x, y + (index * 4), { align: options?.align || 'left' });
            });
            return lines.length * 4;
          }
        }
        doc.text(text, x, y, { align: options?.align || 'left' });
      }
      return 0;
    };
    
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(x1, y1, x2, y2);
    };
    
    const drawRect = (x: number, y: number, width: number, height: number, fill?: number[]) => {
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      if (fill) {
        doc.setFillColor(fill[0], fill[1], fill[2]);
        doc.rect(x, y, width, height, 'FD');
      } else {
        doc.rect(x, y, width, height);
      }
    };
    
    // 1. HEADER SECTION
    drawRect(margin, currentY, contentWidth, 20, primaryBlue);
    
    // Company name and invoice title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    addText(companyInfo.name.toUpperCase(), margin + 3, currentY + 7);
    
    doc.setFontSize(16);
    addText('TAX INVOICE', pageWidth - margin - 3, currentY + 7, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    addText('ORIGINAL FOR RECIPIENT', pageWidth - margin - 3, currentY + 15, { align: 'right' });
    
    currentY += 25;
    
    // 2. COMPANY AND INVOICE INFO
    doc.setTextColor(0, 0, 0);
    
    // Company details box
    drawRect(margin, currentY, contentWidth * 0.6, 35, lightGray);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    addText('COMPANY DETAILS', margin + 3, currentY + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const companyDetails = [
      companyInfo.name,
      `GSTIN: ${companyInfo.gst}`,
      `FSSAI: ${companyInfo.fssai || 'N/A'}`,
      companyInfo.address,
      `Ph: ${companyInfo.phone} | ${companyInfo.email}`
    ];
    
    let companyY = currentY + 12;
    companyDetails.forEach(detail => {
      addText(detail, margin + 3, companyY, { maxWidth: contentWidth * 0.55 });
      companyY += 4;
    });
    
    // Invoice details box
    const invoiceBoxX = margin + (contentWidth * 0.62);
    drawRect(invoiceBoxX, currentY, contentWidth * 0.38, 35, lightGray);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    addText('INVOICE DETAILS', invoiceBoxX + 3, currentY + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    
    const invoiceDetails = [
      ['Invoice #', invoiceNumber],
      ['Date', invoiceDate],
      ['Due Date', dueDate],
      ['Place', this.getPlaceOfSupply(order.shipping_address)]
    ];
    
    let invoiceY = currentY + 12;
    invoiceDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      addText(`${label}:`, invoiceBoxX + 3, invoiceY);
      doc.setFont('helvetica', 'normal');
      addText(value, invoiceBoxX + 20, invoiceY);
      invoiceY += 4;
    });
    
    currentY += 40;
    
    // 3. CUSTOMER DETAILS
    drawRect(margin, currentY, contentWidth, 25, lightBlue);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    addText('BILL TO', margin + 3, currentY + 6);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const customerName = this.getCustomerName(order);
    addText(customerName, margin + 3, currentY + 12);
    
    const addressLines = this.formatAddress(order.shipping_address, 80);
    let addressY = currentY + 16;
    addressLines.forEach(line => {
      addText(line, margin + 3, addressY);
      addressY += 3.5;
    });
    
    if (order.profiles?.phone) {
      addText(`Phone: ${order.profiles.phone}`, margin + 3, addressY);
    }
    
    currentY += 30;
    
    // 4. ITEMS TABLE
    const tableY = currentY;
    const tableHeaders: Array<{ text: string; width: number; x: number }> = [
      { text: '#', width: 10, x: 0 },
      { text: 'Description', width: 80, x: 0 },
      { text: 'HSN', width: 20, x: 0 },
      { text: 'Rate', width: 18, x: 0 },
      { text: 'Qty', width: 12, x: 0 },
      { text: 'Taxable', width: 20, x: 0 },
      { text: 'Tax', width: 18, x: 0 },
      { text: 'Amount', width: 22, x: 0 }
    ];
    
    // Calculate column positions
    let xPos = margin;
    tableHeaders.forEach(header => {
      header.x = xPos;
      xPos += header.width;
    });
    
    // Table header
    drawRect(margin, tableY, contentWidth, 8, primaryBlue);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    tableHeaders.forEach(header => {
      addText(header.text, header.x + 2, tableY + 5);
    });
    
    // Table rows
    currentY = tableY + 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    let subtotal = 0;
    let totalTax = 0;
    
    orderItems.forEach((item, index) => {
      const rowHeight = 8;
      
      // Alternating row background
      if (index % 2 === 1) {
        drawRect(margin, currentY, contentWidth, rowHeight, [252, 252, 252]);
      }
      
      const gstRate = item.products.gst_percentage || 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstRate, order.shipping_address);
      
      subtotal += taxBreakdown.taxableAmount;
      totalTax += taxBreakdown.totalTax;
      
      const rowY = currentY + 5;
      
      // Serial number
      addText((index + 1).toString(), tableHeaders[0].x + 2, rowY);
      
      // Item name (truncated to fit)
      const itemName = item.products.name.length > 50 ? 
        item.products.name.substring(0, 47) + '...' : item.products.name;
      addText(itemName, tableHeaders[1].x + 2, rowY);
      
      // HSN code
      addText(item.products.hsn_code || '1701', tableHeaders[2].x + 2, rowY);
      
      // Rate
      addText(`₹${Number(item.price).toFixed(2)}`, tableHeaders[3].x + 2, rowY);
      
      // Quantity
      addText(item.quantity.toString(), tableHeaders[4].x + 2, rowY);
      
      // Taxable amount
      addText(`₹${taxBreakdown.taxableAmount.toFixed(2)}`, tableHeaders[5].x + 2, rowY);
      
      // Tax amount
      addText(`₹${taxBreakdown.totalTax.toFixed(2)}`, tableHeaders[6].x + 2, rowY);
      
      // Total amount
      addText(`₹${itemTotal.toFixed(2)}`, tableHeaders[7].x + 2, rowY);
      
      currentY += rowHeight;
      drawLine(margin, currentY, margin + contentWidth, currentY);
    });
    
    currentY += 5;
    
    // 5. TOTALS SECTION
    const totalsX = pageWidth - 80;
    const totalsY = currentY;
    
    drawRect(totalsX, totalsY, 75, 30, lightGray);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const totalsData = [
      ['Subtotal:', `₹${subtotal.toFixed(2)}`],
      ['Tax:', `₹${totalTax.toFixed(2)}`],
      ['Shipping:', `₹${(order.delivery_price || 0).toFixed(2)}`]
    ];
    
    let totalsCurrentY = totalsY + 6;
    totalsData.forEach(([label, amount]) => {
      addText(label, totalsX + 3, totalsCurrentY);
      addText(amount, totalsX + 70, totalsCurrentY, { align: 'right' });
      totalsCurrentY += 5;
    });
    
    // Grand total
    drawRect(totalsX, totalsCurrentY, 75, 8, primaryBlue);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    addText('TOTAL:', totalsX + 3, totalsCurrentY + 5);
    addText(`₹${Number(order.total).toFixed(2)}`, totalsX + 70, totalsCurrentY + 5, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    
    // Amount in words
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    addText('Amount in Words:', margin, currentY + 5);
    doc.setFont('helvetica', 'normal');
    addText(`${this.numberToWords(Number(order.total))} Rupees Only`, margin, currentY + 12);
    
    currentY += 45;
    
    // 6. PAYMENT INFO
    drawRect(margin, currentY, contentWidth, 15, lightBlue);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    addText('PAYMENT INFORMATION', margin + 3, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const paymentMethod = this.getPaymentMethodText(order.payment_type);
    const paymentStatus = order.payment_status === 'completed' ? 'PAID' : 'PENDING';
    
    addText(`Method: ${paymentMethod} | Status: ${paymentStatus} | Date: ${invoiceDate}`, 
             margin + 3, currentY + 11);
    
    currentY += 20;
    
    // 7. BANK DETAILS (if provided)
    if (bankDetails?.bankName) {
      drawRect(margin, currentY, contentWidth, 20, lightGray);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      addText('BANK DETAILS', margin + 3, currentY + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      const bankInfo = [
        `Bank: ${bankDetails.bankName}`,
        bankDetails.accountNumber ? `A/c: ${bankDetails.accountNumber}` : '',
        bankDetails.ifscCode ? `IFSC: ${bankDetails.ifscCode}` : ''
      ].filter(info => info);
      
      let bankY = currentY + 11;
      bankInfo.forEach(info => {
        addText(info, margin + 3, bankY);
        bankY += 4;
      });
      
      currentY += 25;
    }
    
    // 8. FOOTER
    const footerY = pageHeight - 20;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    addText('Customer Signature', margin, footerY);
    addText('Authorized Signatory', pageWidth - margin, footerY, { align: 'right' });
    
    // Company stamp area
    drawRect(pageWidth - 60, footerY - 15, 50, 12);
    doc.setFontSize(7);
    addText('Company Seal', pageWidth - 35, footerY - 8, { align: 'center' });
    
    // Terms (if space available)
    if (termsAndConditions && currentY < footerY - 25) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      addText('Terms & Conditions:', margin, currentY + 5);
      
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(termsAndConditions, contentWidth - 10);
      let termsY = currentY + 10;
      
      termsLines.slice(0, 3).forEach((line: string) => { // Limit to 3 lines
        addText(line, margin, termsY);
        termsY += 3;
      });
    }
    
    return doc.output('blob');
  }
  
  // Helper methods
  static getCustomerName(order: Order): string {
    if (order.profiles?.first_name || order.profiles?.last_name) {
      return `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim();
    }
    return order.profiles?.email || `Customer ${order.user_id.substring(0, 8)}`;
  }
  
  static getPlaceOfSupply(address: string): string {
    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes('karnataka') || lowerAddress.includes('bengaluru') || lowerAddress.includes('bangalore')) {
      return '29-Karnataka';
    }
    return 'Outside KA';
  }
  
  static formatAddress(address: string, maxLength: number = 60): string[] {
    const parts = address.split(',').map(part => part.trim()).filter(part => part);
    const lines: string[] = [];
    let currentLine = '';
    
    parts.forEach(part => {
      if ((currentLine + part).length > maxLength) {
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = part + ', ';
        } else {
          // If single part is too long, split it
          if (part.length > maxLength) {
            lines.push(part.substring(0, maxLength - 3) + '...');
          } else {
            lines.push(part);
          }
          currentLine = '';
        }
      } else {
        currentLine += part + ', ';
      }
    });
    
    if (currentLine) {
      lines.push(currentLine.slice(0, -2)); // Remove trailing comma and space
    }
    
    return lines;
  }
  
  static getPaymentMethodText(paymentType?: string): string {
    switch (paymentType) {
      case 'cod': return 'Cash on Delivery';
      case 'cashfree': return 'Online (Cashfree)';
      case 'razorpay': return 'Online (Razorpay)';
      default: return 'Not Specified';
    }
  }
  
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

    let integerPart = Math.floor(num);
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
