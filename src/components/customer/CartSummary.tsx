
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PricingUtils } from '@/utils/pricingUtils';
import CheckoutDialog from './CheckoutDialog';

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    discounted_price: number | null;
    gst_percentage: number | null;
    image: string | null;
    stock: number;
    category: string;
  };
}

interface CartSummaryProps {
  items: CartItem[];
  onOrderComplete?: () => void;
}

const CartSummary = ({ items, onOrderComplete }: CartSummaryProps) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const orderTotals = PricingUtils.calculateOrderTotals(
    items.map(item => ({
      product: item.products,
      quantity: item.quantity
    }))
  );

  const handleOrderComplete = () => {
    setCheckoutOpen(false);
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  return (
    <>
      <Card className="p-4 sm:p-6 sticky top-4">
        <h2 className="text-lg font-semibold mb-4 text-warm-brown">Order Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({items.length} items)</span>
            <span>{PricingUtils.formatPrice(orderTotals.totalBaseAmount)}</span>
          </div>

          {orderTotals.totalDiscountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{PricingUtils.formatPrice(orderTotals.totalDiscountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>Tax (GST)</span>
            <span>{PricingUtils.formatPrice(orderTotals.totalTaxAmount)}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-warm-brown">
              {PricingUtils.formatPrice(orderTotals.totalFinalPrice)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            *All prices include applicable taxes
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            onClick={() => setCheckoutOpen(true)}
            disabled={items.length === 0}
          >
            Proceed to Checkout
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/products'}
          >
            Continue Shopping
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h3 className="font-medium text-sm mb-2">Order Details:</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Items: {items.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <div>Taxable Amount: {PricingUtils.formatPrice(orderTotals.totalTaxableAmount)}</div>
            <div>Tax Amount: {PricingUtils.formatPrice(orderTotals.totalTaxAmount)}</div>
          </div>
        </div>
      </Card>

      <CheckoutDialog 
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cartItems={items}
        total={orderTotals.totalFinalPrice}
        onOrderComplete={handleOrderComplete}
      />
    </>
  );
};

export default CartSummary;
