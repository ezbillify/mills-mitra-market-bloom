import jsPDF from 'jspdf';
import { Order } from '@/types/order';
import { TaxCalculator, TaxBreakdown } from './taxCalculator';
import { PricingUtils } from './pricingUtils';

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

interface DetailedTotals {
  itemsSubtotal: number;
  totalTax: number;
  shippingCost: number;
  codCharges: number;
  otherCharges: number;
  grandTotal: number;
  shippingMethodName: string;
}

export class InvoiceGenerator {
  static async generateInvoice(invoiceData: InvoiceData): Promise<Blob> {
    const { order, orderItems, companyInfo, invoiceNumber, termsAndConditions, bankDetails } = invoiceData;

    // create doc in mm units, A4
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    // Colors
    const primaryBlue = [52, 73, 94];
    const lightBlue = [236, 240, 241];
    const lightGray = [248, 249, 250];

    // safe currency formatter (avoids ₹ glyph issues with builtin fonts)
    const formatCurrency = (n: number) => `Rs.${Number(n).toFixed(2)}`;

    // get totals (keeps your original logic)
    const detailedTotals = this.calculateDetailedTotals(order, orderItems);

    // robust addText helper:
    // - returns vertical space consumed (mm)
    // - prevents overly-small wrap widths (which caused single-letter vertical splitting)
    const addText = (
      text: string | string[],
      x: number,
      y: number,
      opts?: { maxWidth?: number; align?: 'left' | 'center' | 'right'; fontSize?: number }
    ) => {
      const fontSize = opts?.fontSize ?? 8;
      doc.setFontSize(fontSize);

      // compute a safe max width for wrapping
      const requestedMax = opts?.maxWidth ?? contentWidth;
      const safeMinWrap = Math.max(20, fontSize * 2.8); // ensure we don't wrap into single characters
      const maxWidth = Math.max(requestedMax, safeMinWrap);

      let lines: string[];
      if (Array.isArray(text)) lines = text;
      else lines = doc.splitTextToSize(String(text), maxWidth) as string[];

      // line height in mm (approx)
      const lineHeight = Math.max(3.8, fontSize * 0.36 + 1.2);

      // choose xRef for alignment:
      // - for right align we pass the right boundary as x (jsPDF uses x with align: 'right')
      // - for center we draw at x + (maxWidth/2) with align 'center'
      lines.forEach((ln, i) => {
        const drawY = y + i * lineHeight;
        if (opts?.align === 'right') {
          doc.text(ln, x, drawY, { align: 'right' });
        } else if (opts?.align === 'center') {
          doc.text(ln, x + (maxWidth / 2), drawY, { align: 'center' });
        } else {
          doc.text(ln, x, drawY);
        }
      });

      return lines.length * lineHeight;
    };

    const drawRect = (x: number, y: number, w: number, h: number, fill?: number[]) => {
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      if (fill) {
        doc.setFillColor(fill[0], fill[1], fill[2]);
        doc.rect(x, y, w, h, 'FD');
      } else {
        doc.rect(x, y, w, h);
      }
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(x1, y1, x2, y2);
    };

    // ------------------- HEADER -------------------
    let cursorY = margin;
    const headerH = 26;
    drawRect(margin, cursorY, contentWidth, headerH, primaryBlue);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    addText(companyInfo.name.toUpperCase(), margin + 3, cursorY + 8, { maxWidth: contentWidth * 0.6, fontSize: 12 });
    addText('TAX INVOICE', margin + contentWidth - 3, cursorY + 8, { maxWidth: contentWidth * 0.35, align: 'right', fontSize: 14 });
    doc.setFont('helvetica', 'normal');
    addText('ORIGINAL FOR RECIPIENT', margin + contentWidth - 3, cursorY + 16, { maxWidth: contentWidth * 0.35, align: 'right', fontSize: 8 });
    cursorY += headerH + 4;
    doc.setTextColor(0, 0, 0);

    // ------------------- COMPANY & INVOICE BOXES -------------------
    const companyBoxW = contentWidth * 0.60;
    const gap = 6;
    const invoiceBoxW = contentWidth - companyBoxW - gap;

    // build company details lines to compute height
    const companyLines = [
      companyInfo.name,
      `GSTIN: ${companyInfo.gst}`,
      `FSSAI: ${companyInfo.fssai || 'N/A'}`,
      companyInfo.address,
      `Ph: ${companyInfo.phone} | ${companyInfo.email}`
    ];

    // compute estimated height for company box
    let companyContentH = 0;
    companyLines.forEach(line => {
      const linesCount = (doc.splitTextToSize(line, companyBoxW - 8) as string[]).length;
      companyContentH += Math.max(1, linesCount) * 4.6;
    });
    const companyBoxH = Math.max(28, companyContentH + 12);

    // draw boxes
    drawRect(margin, cursorY, companyBoxW, companyBoxH, lightGray);
    drawRect(margin + companyBoxW + gap, cursorY, invoiceBoxW, companyBoxH, lightGray);

    // fill company box
    let yInner = cursorY + 4;
    doc.setFont('helvetica', 'bold');
    yInner += addText('COMPANY DETAILS', margin + 3, yInner, { maxWidth: companyBoxW - 6, fontSize: 10 });
    doc.setFont('helvetica', 'normal');
    companyLines.forEach(l => { yInner += addText(l, margin + 3, yInner, { maxWidth: companyBoxW - 6, fontSize: 8 }); });

    // fill invoice details box
    let invY = cursorY + 4;
    doc.setFont('helvetica', 'bold'); invY += addText('INVOICE DETAILS', margin + companyBoxW + gap + 3, invY, { maxWidth: invoiceBoxW - 6, fontSize: 10 });
    doc.setFont('helvetica', 'normal');
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    const invoiceRows: Array<[string, string]> = [
      ['Invoice #', invoiceNumber],
      ['Date', invoiceDate],
      ['Due Date', dueDate],
      ['Place', this.getPlaceOfSupply(order.shipping_address || '')]
    ];
    invoiceRows.forEach(([label, val]) => {
      const leftX = margin + companyBoxW + gap + 3;
      const rightX = margin + companyBoxW + gap + invoiceBoxW - 3;
      doc.setFont('helvetica', 'bold'); addText(`${label}:`, leftX, invY, { maxWidth: invoiceBoxW * 0.45, fontSize: 8 });
      doc.setFont('helvetica', 'normal'); addText(val, rightX, invY, { maxWidth: invoiceBoxW * 0.45, align: 'right', fontSize: 8 });
      invY += 4.6;
    });

    cursorY += companyBoxH + 8;

    // ------------------- BILL TO -------------------
    const billH = 32;
    drawRect(margin, cursorY, contentWidth, billH, lightBlue);
    doc.setFont('helvetica', 'bold'); addText('BILL TO', margin + 3, cursorY + 6, { fontSize: 10 });
    doc.setFont('helvetica', 'normal');
    addText(this.getCustomerName(order), margin + 3, cursorY + 12, { maxWidth: contentWidth * 0.6, fontSize: 9 });

    const addressLines = this.formatAddress(order.shipping_address || '', 80);
    let addrY = cursorY + 17;
    addressLines.forEach(l => { addText(l, margin + 3, addrY, { maxWidth: contentWidth * 0.8, fontSize: 8 }); addrY += 4.6; });
    if (order.profiles?.phone) addText(`Phone: ${order.profiles.phone}`, margin + 3, addrY + 1, { fontSize: 8 });

    cursorY += billH + 8;

    // ------------------- ITEMS TABLE -------------------
    // column minimum widths (mm) - ensures header never becomes tiny and splits characters
    const minCols = {
      sn: 8,
      hsn: 18,
      rate: 20,
      qty: 12,
      taxable: 28,
      tax: 20,
      amount: 32
    };

    const sumMinOthers = Object.keys(minCols).reduce((s, k) => s + (minCols as any)[k], 0);
    const descW = Math.max(40, contentWidth - sumMinOthers); // description gets leftover, min 40mm

    // columns object in exact mm
    const cols = {
      sn: minCols.sn,
      desc: descW,
      hsn: minCols.hsn,
      rate: minCols.rate,
      qty: minCols.qty,
      taxable: minCols.taxable,
      tax: minCols.tax,
      amount: minCols.amount
    };

    // header
    const headerH2 = 8;
    drawRect(margin, cursorY, contentWidth, headerH2, primaryBlue);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    // draw headers centered/left as appropriate
    let hx = margin;
    addText('#', hx + 2, cursorY + 5, { maxWidth: cols.sn - 4, fontSize: 8 });
    hx += cols.sn;
    addText('Description', hx + 2, cursorY + 5, { maxWidth: cols.desc - 4, fontSize: 8 });
    hx += cols.desc;
    addText('HSN', hx + 2, cursorY + 5, { maxWidth: cols.hsn - 4, fontSize: 8, align: 'center' });
    hx += cols.hsn;
    addText('Rate', hx + 2, cursorY + 5, { maxWidth: cols.rate - 4, fontSize: 8, align: 'right' });
    hx += cols.rate;
    addText('Qty', hx + 2, cursorY + 5, { maxWidth: cols.qty - 4, fontSize: 8, align: 'center' });
    hx += cols.qty;
    addText('Taxable', hx + 2, cursorY + 5, { maxWidth: cols.taxable - 4, fontSize: 8, align: 'right' });
    hx += cols.taxable;
    addText('Tax', hx + 2, cursorY + 5, { maxWidth: cols.tax - 4, fontSize: 8, align: 'right' });
    hx += cols.tax;
    addText('Amount', hx + 2, cursorY + 5, { maxWidth: cols.amount - 4, fontSize: 8, align: 'right' });

    // rows
    cursorY += headerH2;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    orderItems.forEach((item, i) => {
      // tax calculation using your TaxCalculator
      const gstRate = item.products.gst_percentage ?? 18;
      const itemTotal = item.quantity * Number(item.price);
      const taxBreakdown: TaxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstRate, order.shipping_address || '');

      // description wrapping and row height
      const descLines = doc.splitTextToSize(item.products.name || '', cols.desc - 4) as string[];
      const rowLineH = 4.6;
      const rowH = Math.max(8, descLines.length * rowLineH);

      // alternating background
      if (i % 2 === 1) drawRect(margin, cursorY, contentWidth, rowH, [252, 252, 252]);

      let cx = margin;
      const textY = cursorY + 4;

      // SN
      addText(String(i + 1), cx + 2, textY, { maxWidth: cols.sn - 4, fontSize: 8 });
      cx += cols.sn;

      // Description (multi-line)
      addText(descLines, cx + 2, cursorY + 2, { maxWidth: cols.desc - 4, fontSize: 8 });
      cx += cols.desc;

      // HSN
      addText(item.products.hsn_code || '1701', cx + 2, textY, { maxWidth: cols.hsn - 4, fontSize: 8, align: 'center' });
      cx += cols.hsn;

      // Rate (right)
      addText(formatCurrency(Number(item.price)), cx + cols.rate - 2, textY, { maxWidth: cols.rate - 4, fontSize: 8, align: 'right' });
      cx += cols.rate;

      // Qty
      addText(String(item.quantity), cx + 2, textY, { maxWidth: cols.qty - 4, fontSize: 8, align: 'center' });
      cx += cols.qty;

      // Taxable
      addText(formatCurrency(taxBreakdown.taxableAmount), cx + cols.taxable - 2, textY, { maxWidth: cols.taxable - 4, fontSize: 8, align: 'right' });
      cx += cols.taxable;

      // Tax
      addText(formatCurrency(taxBreakdown.totalTax), cx + cols.tax - 2, textY, { maxWidth: cols.tax - 4, fontSize: 8, align: 'right' });
      cx += cols.tax;

      // Amount
      addText(formatCurrency(itemTotal), cx + cols.amount - 2, textY, { maxWidth: cols.amount - 4, fontSize: 8, align: 'right' });

      // horizontal line
      cursorY += rowH;
      drawLine(margin, cursorY, margin + contentWidth, cursorY);
    });

    cursorY += 8;

    // ------------------- TOTALS (safe width & position) -------------------
    // choose totals width as up to 38% of content width but clamp to a max
    const totalsMax = Math.min(110, contentWidth * 0.38); // in mm
    const totalsW = totalsMax;
    let totalsX = margin + contentWidth - totalsW;
    let totalsY = cursorY;

    // compute totals box height
    const totalsBoxH = this.calculateTotalsBoxHeight(detailedTotals);

    // ensure totals won't collide with footer; if they do, start a new page and place totals there
    const footerReserve = 34;
    if (totalsY + totalsBoxH + footerReserve > pageHeight) {
      doc.addPage();
      totalsY = margin;
      cursorY = margin;
    }

    drawRect(totalsX, totalsY, totalsW, totalsBoxH, lightGray);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);

    const lines: Array<[string, string]> = [['Items Subtotal:', formatCurrency(detailedTotals.itemsSubtotal)]];
    if (detailedTotals.totalTax > 0) lines.push(['Total GST:', formatCurrency(detailedTotals.totalTax)]);
    if (detailedTotals.shippingCost > 0) lines.push([`${detailedTotals.shippingMethodName}:`, formatCurrency(detailedTotals.shippingCost)]);
    if (detailedTotals.codCharges > 0) lines.push(['COD Charges:', formatCurrency(detailedTotals.codCharges)]);
    if (detailedTotals.otherCharges > 0) lines.push(['Other Charges:', formatCurrency(detailedTotals.otherCharges)]);

    let ty = totalsY + 6;
    lines.forEach(([label, amt]) => {
      addText(label, totalsX + 4, ty, { maxWidth: totalsW - 12, fontSize: 8 });
      // right aligned at right-edge of totals box
      addText(amt, totalsX + totalsW - 4, ty, { maxWidth: totalsW - 12, fontSize: 8, align: 'right' });
      ty += 5;
    });

    // grand total bar
    const grandH = 10;
    drawRect(totalsX, ty + 4, totalsW, grandH, primaryBlue);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    addText('TOTAL:', totalsX + 4, ty + 10, { fontSize: 9 });
    addText(formatCurrency(detailedTotals.grandTotal), totalsX + totalsW - 4, ty + 10, { fontSize: 9, align: 'right' });
    doc.setTextColor(0, 0, 0);

    // ------------------- Amount in words (left of totals box) -------------------
    const wordsY = totalsY + totalsBoxH + 8;
    const wordsMaxW = Math.max(60, contentWidth - totalsW - 12);
    doc.setFont('helvetica', 'bold'); addText('Amount in Words:', margin, wordsY, { fontSize: 9 });
    doc.setFont('helvetica', 'normal');
    addText(`${this.numberToWords(detailedTotals.grandTotal)} Rupees Only`, margin, wordsY + 5, { maxWidth: wordsMaxW, fontSize: 8 });

    // move cursor below totals block
    cursorY = Math.max(cursorY, totalsY + totalsBoxH) + 12;

    // ------------------- PAYMENT INFO -------------------
    const paymentH = 26;
    drawRect(margin, cursorY, contentWidth, paymentH, lightBlue);
    doc.setFont('helvetica', 'bold'); addText('PAYMENT INFORMATION', margin + 3, cursorY + 6, { fontSize: 9 });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    addText(`Method: ${this.getPaymentMethodText(order.payment_type)}`, margin + 3, cursorY + 12, { fontSize: 8 });
    addText(`Status: ${order.payment_status === 'completed' ? 'PAID' : 'PENDING'}`, margin + 3, cursorY + 16, { fontSize: 8 });
    addText(`Date: ${invoiceDate}`, margin + 3, cursorY + 20, { fontSize: 8 });
    cursorY += paymentH + 10;

    // ------------------- BANK DETAILS -------------------
    if (bankDetails?.bankName) {
      const bankH = 20;
      drawRect(margin, cursorY, contentWidth, bankH, lightGray);
      doc.setFont('helvetica', 'bold'); addText('BANK DETAILS', margin + 3, cursorY + 6, { fontSize: 9 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      const bankLines = [
        `Bank: ${bankDetails.bankName}`,
        bankDetails.accountNumber ? `A/c: ${bankDetails.accountNumber}` : '',
        bankDetails.ifscCode ? `IFSC: ${bankDetails.ifscCode}` : ''
      ].filter(Boolean);
      let by = cursorY + 11;
      bankLines.forEach(l => { addText(l, margin + 3, by, { fontSize: 8 }); by += 4.2; });
      cursorY += bankH + 10;
    }

    // ------------------- FOOTER -------------------
    const footerY = pageHeight - 24;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    addText('Customer Signature', margin, footerY, { fontSize: 8 });
    addText('Authorized Signatory', margin + contentWidth, footerY, { fontSize: 8, align: 'right' });
    drawRect(pageWidth - 60, footerY - 12, 50, 12);
    doc.setFontSize(7); addText('Company Seal', pageWidth - 35, footerY - 4, { fontSize: 7, align: 'center' });

    // ------------------- TERMS (if space) -------------------
    if (termsAndConditions && cursorY < footerY - 20) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); addText('Terms & Conditions:', margin, cursorY + 2, { fontSize: 7 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      const termLines = doc.splitTextToSize(termsAndConditions, contentWidth - 10) as string[];
      let ty2 = cursorY + 6;
      termLines.slice(0, 4).forEach(l => { addText(l, margin, ty2, { fontSize: 7 }); ty2 += 3.8; });
    }

    // return blob
    return doc.output('blob');
  }

  // ------------------- helpers (unchanged logic, safe) -------------------
  static calculateDetailedTotals(order: Order, orderItems: InvoiceItem[]): DetailedTotals {
    if (!orderItems || orderItems.length === 0) {
      return {
        itemsSubtotal: 0,
        totalTax: 0,
        shippingCost: Number(order.delivery_price || 0),
        codCharges: 0,
        otherCharges: 0,
        grandTotal: Number(order.total || 0),
        shippingMethodName: this.getShippingMethodName(Number(order.delivery_price || 0))
      };
    }

    try {
      const shippingAddress = order.shipping_address || '';
      const shippingCost = Number(order.delivery_price || 0);

      const orderTotals = PricingUtils.calculateOrderTotals(
        orderItems.map(item => ({
          product: {
            price: item.price,
            discounted_price: null,
            gst_percentage: item.products?.gst_percentage || 18
          },
          quantity: item.quantity
        })),
        shippingAddress,
        shippingCost
      );

      const calculatedSubtotal = orderTotals.totalTaxableAmount + orderTotals.totalTaxAmount + shippingCost;
      const actualTotal = Number(order.total || 0);
      const diff = actualTotal - calculatedSubtotal;
      let codCharges = 0, otherCharges = 0;
      if (order.payment_type === 'cod' && diff > 0) codCharges = diff;
      else if (diff > 0) otherCharges = diff;

      return {
        itemsSubtotal: orderTotals.totalTaxableAmount,
        totalTax: orderTotals.totalTaxAmount,
        shippingCost,
        codCharges,
        otherCharges,
        grandTotal: actualTotal,
        shippingMethodName: this.getShippingMethodName(shippingCost)
      };
    } catch (e) {
      console.warn('PricingUtils failed — fallback totals used', e);
      let itemsSubtotal = 0, totalTax = 0;
      (orderItems || []).forEach(item => {
        const itemTotal = item.quantity * Number(item.price);
        const gst = item.products?.gst_percentage || 18;
        const taxAmount = (itemTotal * gst) / (100 + gst);
        const taxableAmount = itemTotal - taxAmount;
        itemsSubtotal += taxableAmount;
        totalTax += taxAmount;
      });
      const shippingCost = Number(order.delivery_price || 0);
      const actualTotal = Number(order.total || 0);
      const calcTotal = itemsSubtotal + totalTax + shippingCost;
      const diff = actualTotal - calcTotal;
      let codCharges = 0, otherCharges = 0;
      if (order.payment_type === 'cod' && diff > 0) codCharges = diff;
      else if (diff > 0) otherCharges = diff;

      return {
        itemsSubtotal,
        totalTax,
        shippingCost,
        codCharges,
        otherCharges,
        grandTotal: actualTotal,
        shippingMethodName: this.getShippingMethodName(shippingCost)
      };
    }
  }

  static getShippingMethodName(deliveryPrice: number): string {
    if (deliveryPrice === 0) return 'Free Shipping';
    if (deliveryPrice <= 50) return 'Standard Shipping';
    if (deliveryPrice <= 100) return 'Express Shipping';
    return 'Premium Shipping';
  }

  static calculateTotalsBoxHeight(totals: DetailedTotals): number {
    let lines = 1; // itemsSubtotal
    if (totals.totalTax > 0) lines++;
    if (totals.shippingCost > 0) lines++;
    if (totals.codCharges > 0) lines++;
    if (totals.otherCharges > 0) lines++;
    return (lines * 5) + 20; // line height + bar + padding
  }

  static getCustomerName(order: Order): string {
    if (order.profiles?.first_name || order.profiles?.last_name) return `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim();
    const addressData = (order as any).address_data;
    if (addressData?.first_name || addressData?.last_name) return `${addressData.first_name || ''} ${addressData.last_name || ''}`.trim();
    if (order.profiles?.email) return order.profiles.email.split('@')[0];
    return `Customer ${String(order.user_id || '').substring(0, 8) || 'NA'}`;
  }

  static getPlaceOfSupply(address: string): string {
    const lower = (address || '').toLowerCase();
    if (lower.includes('karnataka') || lower.includes('bengaluru') || lower.includes('bangalore')) return '29-Karnataka';
    return 'Outside KA';
  }

  static formatAddress(address: string, maxLength: number = 50): string[] {
    const clean = (address || '').replace(/,+/g, ',').replace(/\s+/g, ' ').trim();
    const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    parts.forEach(part => {
      if ((current + (current ? ', ' : '') + part).length > maxLength) {
        if (current) { lines.push(current); current = part; }
        else {
          // break long single part at spaces
          const words = part.split(' ');
          let wl = '';
          words.forEach(w => {
            if ((wl + (wl ? ' ' : '') + w).length <= maxLength) wl += (wl ? ' ' : '') + w;
            else { if (wl) lines.push(wl); wl = w; }
          });
          if (wl) current = wl;
        }
      } else current += (current ? ', ' : '') + part;
    });
    if (current) lines.push(current);
    return lines.slice(0, 4);
  }

  static getPaymentMethodText(paymentType?: string): string {
    switch (paymentType) {
      case 'cod': return 'Cash on Delivery (COD)';
      case 'phonepe': return 'Online Payment (PhonePe)';
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
      let r = '';
      if (n >= 100) { r += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
      if (n >= 20) { r += tens[Math.floor(n / 10)] + ' '; n %= 10; }
      else if (n >= 10) { r += teens[n - 10] + ' '; return r; }
      if (n > 0) r += ones[n] + ' ';
      return r;
    }

    let intPart = Math.floor(num);
    let result = '';
    let gi = 0;
    while (intPart > 0) {
      const group = intPart % (gi === 0 ? 1000 : 100);
      if (group !== 0) result = convertGroup(group) + thousands[gi] + ' ' + result;
      intPart = Math.floor(intPart / (gi === 0 ? 1000 : 100));
      gi++;
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
