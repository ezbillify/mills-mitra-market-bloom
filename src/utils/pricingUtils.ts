
import { TaxCalculator } from './taxCalculator';

export interface PriceCalculationResult {
  basePrice: number;
  discountAmount: number;
  discountedPrice: number;
  taxableAmount: number;
  taxAmount: number;
  finalPrice: number;
  gstPercentage: number;
}

export interface Product {
  price: number;
  discounted_price?: number | null;
  gst_percentage?: number | null;
  selling_price_with_tax?: number | null;
  price_includes_tax?: boolean;
}

export class PricingUtils {
  /**
   * Calculate comprehensive pricing for a product
   */
  static calculateProductPrice(
    product: Product, 
    quantity: number = 1, 
    shippingAddress: string = ""
  ): PriceCalculationResult {
    const gstPercentage = product.gst_percentage || 18;
    const basePrice = Number(product.price) || 0;
    const discountedPrice = product.discounted_price ? Number(product.discounted_price) : null;
    
    // Determine the effective price (after discount)
    const effectivePrice = discountedPrice || basePrice;
    const discountAmount = discountedPrice ? (basePrice - discountedPrice) : 0;
    
    // Calculate total for given quantity
    const totalEffectivePrice = effectivePrice * quantity;
    const totalDiscountAmount = discountAmount * quantity;
    
    // Calculate tax breakdown using the tax calculator
    const taxBreakdown = TaxCalculator.calculateTaxBreakdown(
      totalEffectivePrice,
      gstPercentage,
      shippingAddress
    );
    
    return {
      basePrice,
      discountAmount,
      discountedPrice: discountedPrice || basePrice,
      taxableAmount: taxBreakdown.taxableAmount,
      taxAmount: taxBreakdown.totalTax,
      finalPrice: taxBreakdown.taxableAmount + taxBreakdown.totalTax,
      gstPercentage
    };
  }

  /**
   * Calculate order totals from multiple items
   */
  static calculateOrderTotals(
    items: Array<{
      product: Product;
      quantity: number;
    }>,
    shippingAddress: string = "",
    deliveryPrice: number = 0
  ) {
    let totalBaseAmount = 0;
    let totalDiscountAmount = 0;
    let totalTaxableAmount = 0;
    let totalTaxAmount = 0;
    let totalFinalPrice = 0;

    items.forEach(item => {
      const pricing = this.calculateProductPrice(item.product, item.quantity, shippingAddress);
      totalBaseAmount += pricing.basePrice * item.quantity;
      totalDiscountAmount += pricing.discountAmount * item.quantity;
      totalTaxableAmount += pricing.taxableAmount;
      totalTaxAmount += pricing.taxAmount;
      totalFinalPrice += pricing.finalPrice;
    });

    const grandTotal = totalFinalPrice + deliveryPrice;

    return {
      totalBaseAmount,
      totalDiscountAmount,
      totalTaxableAmount,
      totalTaxAmount,
      totalFinalPrice,
      deliveryPrice,
      grandTotal
    };
  }

  /**
   * Format price for display with Indian Rupee symbol
   */
  static formatPrice(amount: number, precision: number = 2): string {
    return `₹${Number(amount).toFixed(precision)}`;
  }

  /**
   * Get display price per unit (includes tax)
   */
  static getDisplayPrice(product: Product): number {
    const pricing = this.calculateProductPrice(product, 1);
    return pricing.finalPrice;
  }

  /**
   * Check if product has discount
   */
  static hasDiscount(product: Product): boolean {
    return !!(product.discounted_price && product.discounted_price < product.price);
  }
}
