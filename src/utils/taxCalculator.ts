
export interface TaxBreakdown {
  isKarnataka: boolean;
  sgst?: number;
  cgst?: number;
  igst?: number;
  totalTax: number;
  taxableAmount: number;
}

export class TaxCalculator {
  static calculateTaxBreakdown(amount: number, gstPercentage: number, shippingAddress: string): TaxBreakdown {
    // Check if address is in Karnataka by looking for 'karnataka', 'bengaluru', 'bangalore', 'mysore', etc.
    const karnatakaKeywords = [
      'karnataka', 'bengaluru', 'bangalore', 'mysore', 'mangalore', 'hubli', 'dharwad',
      'belgaum', 'gulbarga', 'davangere', 'bellary', 'bijapur', 'shimoga', 'tumkur',
      'raichur', 'bidar', 'hospet', 'gadag', 'mandya', 'hassan', 'udupi', 'chikmagalur'
    ];
    
    const addressLower = shippingAddress.toLowerCase();
    const isKarnataka = karnatakaKeywords.some(keyword => addressLower.includes(keyword));
    
    const totalTax = (amount * gstPercentage) / 100;
    
    if (isKarnataka) {
      // For Karnataka: SGST + CGST (each is half of total GST)
      const sgst = totalTax / 2;
      const cgst = totalTax / 2;
      
      return {
        isKarnataka: true,
        sgst,
        cgst,
        totalTax,
        taxableAmount: amount
      };
    } else {
      // For outside Karnataka: IGST (full GST amount)
      return {
        isKarnataka: false,
        igst: totalTax,
        totalTax,
        taxableAmount: amount
      };
    }
  }
}
