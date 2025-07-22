
export interface TaxBreakdown {
  taxableAmount: number;
  totalTax: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export class TaxCalculator {
  /**
   * Calculate comprehensive tax breakdown based on GST percentage and shipping address
   */
  static calculateTaxBreakdown(
    amount: number,
    gstPercentage: number = 18,
    shippingAddress: string = ""
  ): TaxBreakdown {
    const taxRate = gstPercentage / 100;
    
    // For now, assume the amount is tax-inclusive
    // Calculate taxable amount and tax amount from inclusive amount
    const taxableAmount = amount / (1 + taxRate);
    const totalTax = amount - taxableAmount;
    
    // Determine if the address is in Karnataka
    const isKarnataka = shippingAddress.toLowerCase().includes('karnataka') || 
                       shippingAddress.toLowerCase().includes('bengaluru') ||
                       shippingAddress.toLowerCase().includes('bangalore');
    
    if (isKarnataka) {
      // Intra-state: CGST + SGST
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      
      return {
        taxableAmount,
        totalTax,
        cgst,
        sgst
      };
    } else {
      // Inter-state: IGST
      return {
        taxableAmount,
        totalTax,
        igst: totalTax
      };
    }
  }

  /**
   * Calculate tax on an exclusive amount (tax to be added)
   */
  static calculateTaxOnExclusiveAmount(
    exclusiveAmount: number,
    gstPercentage: number = 18,
    shippingAddress: string = ""
  ): TaxBreakdown {
    const taxRate = gstPercentage / 100;
    const totalTax = exclusiveAmount * taxRate;
    
    // Determine if the address is in Karnataka
    const isKarnataka = shippingAddress.toLowerCase().includes('karnataka') || 
                       shippingAddress.toLowerCase().includes('bengaluru') ||
                       shippingAddress.toLowerCase().includes('bangalore');
    
    if (isKarnataka) {
      // Intra-state: CGST + SGST
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      
      return {
        taxableAmount: exclusiveAmount,
        totalTax,
        cgst,
        sgst
      };
    } else {
      // Inter-state: IGST
      return {
        taxableAmount: exclusiveAmount,
        totalTax,
        igst: totalTax
      };
    }
  }

  /**
   * Format tax amount for display
   */
  static formatTaxAmount(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }
}
