import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PricingUtils } from '@/utils/pricingUtils';
import { supabase } from '@/integrations/supabase/client';
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

interface CODSettings {
  amount: number;
  enabled: boolean;
}

const CartSummary = ({ items, onOrderComplete }: CartSummaryProps) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [codSettings, setCodSettings] = useState<CODSettings>({ amount: 0, enabled: false });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchCODSettings();
  }, []);

  const fetchCODSettings = async () => {
    try {
      const { data, error }: any = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'cod_charges')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching COD settings:', error);
        return;
      }

      if (data && data.value) {
        // Properly cast Json to CODSettings with type checking
        const settings = data.value as unknown;
        if (typeof settings === 'object' && settings !== null && 'amount' in settings && 'enabled' in settings) {
          setCodSettings(settings as CODSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching COD settings:', error);
    }
  };

  if (hasError) {
    return (
      <Card className="p-4">
        <p className="text-red-500">Error loading cart summary. Please refresh the page.</p>
      </Card>
    );
  }

  try {
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
        <Card className="p-3 sm:p-4 md:p-6 sticky top-4">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-primary">Order Summary</h2>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Subtotal ({items.length} items)</span>
              <span>{PricingUtils.formatPrice(orderTotals.totalBaseAmount)}</span>
            </div>

            {orderTotals.totalDiscountAmount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-green-600">
                <span>Discount</span>
                <span>-{PricingUtils.formatPrice(orderTotals.totalDiscountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs sm:text-sm">
              <span>Tax (GST)</span>
              <span>{PricingUtils.formatPrice(orderTotals.totalTaxAmount)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-base sm:text-lg md:text-xl">
              <span>Total</span>
              <span className="text-primary">
                {PricingUtils.formatPrice(orderTotals.totalFinalPrice)}
              </span>
            </div>

            {codSettings.enabled && codSettings.amount > 0 && (
              <div className="text-[10px] sm:text-xs text-orange-600 bg-orange-50 p-2 sm:p-2.5 rounded">
                <span className="font-medium">Note: </span>
                COD charges of ₹{codSettings.amount.toFixed(2)} will be added at checkout
              </div>
            )}

            <div className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2">
              *All prices include applicable taxes. Shipping & COD charges calculated at checkout.
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-9 sm:h-10 md:h-11 text-sm sm:text-base"
              onClick={() => setCheckoutOpen(true)}
              disabled={items.length === 0}
            >
              Proceed to Checkout
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-9 sm:h-10 md:h-11 text-sm sm:text-base"
              onClick={() => window.location.href = '/products'}
            >
              Continue Shopping
            </Button>
          </div>

          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-muted rounded-lg">
            <h3 className="font-medium text-xs sm:text-sm mb-1.5 sm:mb-2">Order Details:</h3>
            <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
              <div>Items: {items.reduce((sum, item) => sum + item.quantity, 0)}</div>
              <div>Taxable Amount: {PricingUtils.formatPrice(orderTotals.totalTaxableAmount)}</div>
              <div>Tax Amount: {PricingUtils.formatPrice(orderTotals.totalTaxAmount)}</div>
              {codSettings.enabled && (
                <div className="text-orange-600">COD Available: +₹{codSettings.amount.toFixed(2)}</div>
              )}
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
  } catch (error) {
    console.error('Error rendering cart summary:', error);
    setHasError(true);
    return null;
  }
};

export default CartSummary;