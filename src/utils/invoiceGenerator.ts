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
    
    // A4 page dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    
    // Helper function to draw borders
    const drawBorder = (x: number, y: number, width: number, height: number, fillColor?: string) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      if (fillColor) {
        doc.setFillColor(fillColor);
        doc.rect(x, y, width, height, 'FD');
      } else {
        doc.rect(x, y, width, height);
      }
    };
    
    // Helper function to add text with proper spacing
    const addText = (text: string, x: number, y: number, options?: any) => {
      doc.text(text, x, y, options);
    };
    
    let currentY = margin;
    
    // 1. MAIN DOCUMENT BORDER
    drawBorder(margin, margin, contentWidth, pageHeight - (margin * 2));
    
    // 2. HEADER SECTION
    currentY += 10;
    
    // TAX INVOICE title (centered)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const headerText = 'TAX INVOICE';
    const headerWidth = doc.getTextWidth(headerText);
    addText(headerText, (pageWidth - headerWidth) / 2, currentY);
    
    // ORIGINAL FOR RECIPIENT (right aligned)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    addText('ORIGINAL FOR RECIPIENT', pageWidth - margin - 5, currentY - 5, { align: 'right' });
    
    currentY += 15;
    
    // 3. COMPANY AND INVOICE INFO SECTION
    const leftColumnX = margin + 5;
    const rightColumnX = pageWidth - 70;
    
    // Company Info (Left Column)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    addText(companyInfo.name.toUpperCase(), leftColumnX, currentY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    currentY += 6;
    
    const companyLines = [
      `GSTIN: ${companyInfo.gst}`,
      `FSSAI: ${companyInfo.fssai || 'N/A'}`,
      companyInfo.address,
      `Phone: ${companyInfo.phone}`,
      `Email: ${companyInfo.email}`
    ];
    
    const companyStartY = currentY;
    companyLines.forEach(line => {
      addText(line, leftColumnX, currentY);
      currentY += 4;
    });
    
    // Invoice Info (Right Column)
    currentY = companyStartY;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-GB');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    
    addText('Invoice #:', rightColumnX, currentY);
    addText('Invoice Date:', rightColumnX, currentY + 5);
    addText('Place of Supply:', rightColumnX, currentY + 10);
    addText('Due Date:', rightColumnX, currentY + 15);
    
    doc.setFont('helvetica', 'normal');
    addText(invoiceNumber, rightColumnX + 25, currentY);
    addText(invoiceDate, rightColumnX + 25, currentY + 5);
    
    // Determine state
    const isKarnataka = order.shipping_address.toLowerCase().includes('karnataka') || 
                       order.shipping_address.toLowerCase().includes('bengaluru') ||
                       order.shipping_address.toLowerCase().includes('bangalore');
    addText(isKarnataka ? '29-KARNATAKA' : 'OUTSIDE KARNATAKA', rightColumnX + 25, currentY + 10);
    addText(dueDate, rightColumnX + 25, currentY + 15);
    
    currentY += 35;
    
    // 4. CUSTOMER INFORMATION SECTION
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    addText('Bill To:', leftColumnX, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Customer'
      : `Customer ${order.user_id.substring(0, 8)}`;
    
    addText(customerName, leftColumnX, currentY);
    currentY += 5;
    
    // Customer address (properly formatted)
    const addressLines = order.shipping_address.split(',').map(line => line.trim()).filter(line => line);
    addressLines.forEach(line => {
      if (line.length > 60) {
        // Split long lines
        const words = line.split(' ');
        let currentLine = '';
        words.forEach(word => {
          if ((currentLine + word).length > 60) {
            if (currentLine) {
              addText(currentLine.trim(), leftColumnX, currentY);
              currentY += 4;
            }
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        if (currentLine) {
          addText(currentLine.trim(), leftColumnX, currentY);
          currentY += 4;
        }
      } else {
        addText(line, leftColumnX, currentY);
        currentY += 4;
      }
    });
    
    currentY += 10;
    
    // 5. ITEMS TABLE
    const tableStartY = currentY;
    const tableHeaders = [
      { text: 'Sl', x: leftColumnX, width: 8 },
      { text: 'Items', x: leftColumnX + 8, width: 50 },
      { text: 'HSN/SAC', x: leftColumnX + 58, width: 20 },
      { text: 'Rate', x: leftColumnX + 78, width: 18 },
      { text: 'Qty', x: leftColumnX + 96, width: 12 },
      { text: 'Taxable', x: leftColumnX + 108, width: 20 },
      { text: 'Tax', x: leftColumnX + 128, width: 18 },
      { text: 'Amount', x: leftColumnX + 146, width: 24 }
    ];
    
    // Draw table header
    drawBorder(leftColumnX, tableStartY, contentWidth - 10, 8, '#f0f0f0');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    tableHeaders.forEach(header => {
      addText(header.text, header.x + 1, tableStartY + 5);
    });
    
    // Draw vertical lines for table
    let xPosition = leftColumnX;
    tableHeaders.forEach((header, index) => {
      if (index > 0) {
        doc.line(xPosition, tableStartY, xPosition, tableStartY + 8 + (orderItems.length * 8) + 5);
      }
      xPosition += header.width;
    });
    
    // Draw right border
    doc.line(leftColumnX + contentWidth - 10, tableStartY, leftColumnX + contentWidth - 10, tableStartY + 8 + (orderItems.length * 8) + 5);
    
    // Table content
    currentY = tableStartY + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    let subtotal = 0;
    let totalTaxAmount = 0;
    
    orderItems.forEach((item, index) => {
      currentY += 6;
      
      const gstPercentage = item.products.gst_percentage || 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstPercentage, order.shipping_address);
      
      subtotal += taxBreakdown.taxableAmount;
      totalTaxAmount += taxBreakdown.totalTax;
      
      // Row data
      addText((index + 1).toString(), leftColumnX + 2, currentY);
      
      // Item name (truncated properly)
      const itemName = item.products.name.length > 35 ? 
        item.products.name.substring(0, 35) + '...' : 
        item.products.name;
      addText(itemName, leftColumnX + 9, currentY);
      
      addText(item.products.hsn_code || 'N/A', leftColumnX + 59, currentY);
      addText(`₹${Number(item.price).toFixed(2)}`, leftColumnX + 79, currentY);
      addText(item.quantity.toString(), leftColumnX + 98, currentY);
      addText(`₹${taxBreakdown.taxableAmount.toFixed(2)}`, leftColumnX + 109, currentY);
      addText(`₹${taxBreakdown.totalTax.toFixed(2)}`, leftColumnX + 129, currentY);
      addText(`₹${itemTotal.toFixed(2)}`, leftColumnX + 147, currentY);
      
      // Horizontal line between rows
      if (index < orderItems.length - 1) {
        doc.line(leftColumnX, currentY + 2, leftColumnX + contentWidth - 10, currentY + 2);
      }
    });
    
    // Close table
    const tableEndY = currentY + 5;
    doc.line(leftColumnX, tableEndY, leftColumnX + contentWidth - 10, tableEndY);
    
    currentY = tableEndY + 8;
    
    // 6. TOTALS SECTION
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    addText(`Total Items (Qty): ${totalQty} / ${orderItems.length}`, leftColumnX, currentY);
    
    // Tax breakdown
    currentY += 8;
    drawBorder(leftColumnX, currentY, contentWidth - 10, 25);
    
    // Tax headers
    doc.setFontSize(7);
    addText('HSN/SAC', leftColumnX + 2, currentY + 5);
    addText('Taxable Value', leftColumnX + 25, currentY + 5);
    addText('Central Tax', leftColumnX + 50, currentY + 5);
    addText('State/UT Tax', leftColumnX + 75, currentY + 5);
    addText('Total Tax', leftColumnX + 100, currentY + 5);
    
    doc.line(leftColumnX, currentY + 7, leftColumnX + contentWidth - 10, currentY + 7);
    
    // Tax details
    currentY += 12;
    doc.setFont('helvetica', 'normal');
    
    const taxByRate = new Map<number, { cgst: number, sgst: number, igst: number, taxableAmount: number }>();
    
    orderItems.forEach(item => {
      const gstRate = item.products.gst_percentage || 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstRate, order.shipping_address);
      
      if (!taxByRate.has(gstRate)) {
        taxByRate.set(gstRate, { cgst: 0, sgst: 0, igst: 0, taxableAmount: 0 });
      }
      
      const existing = taxByRate.get(gstRate)!;
      existing.cgst += taxBreakdown.cgst || 0;
      existing.sgst += taxBreakdown.sgst || 0;
      existing.igst += taxBreakdown.igst || 0;
      existing.taxableAmount += taxBreakdown.taxableAmount;
    });
    
    taxByRate.forEach((taxes, rate) => {
      addText(orderItems[0]?.products.hsn_code || '1701', leftColumnX + 2, currentY);
      addText(`₹${taxes.taxableAmount.toFixed(2)}`, leftColumnX + 25, currentY);
      
      if (isKarnataka) {
        addText(`${rate/2}% ₹${taxes.cgst.toFixed(2)}`, leftColumnX + 50, currentY);
        addText(`${rate/2}% ₹${taxes.sgst.toFixed(2)}`, leftColumnX + 75, currentY);
      } else {
        addText(`${rate}% ₹${taxes.igst.toFixed(2)}`, leftColumnX + 50, currentY);
        addText('-', leftColumnX + 75, currentY);
      }
      
      addText(`₹${(taxes.cgst + taxes.sgst + taxes.igst).toFixed(2)}`, leftColumnX + 100, currentY);
      currentY += 5;
    });
    
    // Total line
    doc.line(leftColumnX + 50, currentY, leftColumnX + contentWidth - 10, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    addText('TOTAL', leftColumnX + 45, currentY);
    addText(`₹${totalTaxAmount.toFixed(2)}`, leftColumnX + 100, currentY);
    
    currentY += 15;
    
    // 7. AMOUNT IN WORDS
    doc.setFontSize(9);
    addText(`Total amount (in words): ${this.numberToWords(Number(order.total))} Rupees Only`, leftColumnX, currentY);
    
    // Grand total box
    drawBorder(pageWidth - 70, currentY - 8, 60, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    addText('Total', pageWidth - 65, currentY - 2);
    addText(`₹${Number(order.total).toFixed(2)}`, pageWidth - 15, currentY - 2, { align: 'right' });
    
    currentY += 20;
    
    // 8. BANK DETAILS
    if (bankDetails && bankDetails.bankName) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      addText('Bank Details:', leftColumnX, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      currentY += 5;
      addText(`Bank: ${bankDetails.bankName}`, leftColumnX, currentY);
      if (bankDetails.accountNumber) {
        currentY += 4;
        addText(`Account #: ${bankDetails.accountNumber}`, leftColumnX, currentY);
      }
      if (bankDetails.ifscCode) {
        currentY += 4;
        addText(`IFSC Code: ${bankDetails.ifscCode}`, leftColumnX, currentY);
      }
      currentY += 4;
      addText('Branch: MAIN BRANCH', leftColumnX, currentY);
      currentY += 10;
    }
    
    // 9. PAYMENT INFORMATION
    let paymentType = order.payment_type || "cod";
    let paymentText = paymentType === "cod" ? "Cash on Delivery" : 
                     paymentType === "razorpay" ? "Paid via UPI" : 
                     paymentType.charAt(0).toUpperCase() + paymentType.slice(1);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    addText(`₹${Number(order.total).toFixed(2)} Paid via ${paymentText} on ${invoiceDate}`, pageWidth - margin - 5, currentY, { align: 'right' });
    
    currentY += 20;
    
    // 10. SIGNATURE SECTION
    doc.setFontSize(8);
    addText('Receiver\'s Signature', leftColumnX, pageHeight - 25);
    addText('Authorized Signatory', pageWidth - margin - 5, pageHeight - 25, { align: 'right' });
    
    // Terms and conditions (if space allows)
    if (termsAndConditions && currentY < pageHeight - 40) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      addText('Terms & Conditions:', leftColumnX, currentY);
      currentY += 4;
      
      // Split terms into lines
      const termsLines = doc.splitTextToSize(termsAndConditions, contentWidth - 20);
      termsLines.forEach((line: string) => {
        if (currentY < pageHeight - 30) {
          addText(line, leftColumnX, currentY);
          currentY += 3;
        }
      });
    }
    
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