import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface CashfreeOptions {
  amount: number;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess: (paymentId: string) => void;
  onFailure: (error: any) => void;
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

export const useCashfree = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadCashfreeScript = () => {
    return new Promise((resolve) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Simple mobile detection
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  // Clean up any existing issues
  const cleanupBeforePayment = () => {
    // Remove any existing cashfree elements
    const existingElements = document.querySelectorAll('[id*="cashfree"], [class*="cashfree"]');
    existingElements.forEach(el => el.remove());

    // Fix z-index conflicts
    document.querySelectorAll('*').forEach(el => {
      const zIndex = window.getComputedStyle(el).zIndex;
      if (parseInt(zIndex) > 9999) {
        (el as HTMLElement).style.zIndex = '1';
      }
    });
  };

  const initiatePayment = async (options: CashfreeOptions) => {
    setLoading(true);

    try {
      console.log('🔵 Starting Cashfree payment...');

      // Validate required fields
      if (!options.amount || options.amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (!options.orderId) {
        throw new Error('Order ID is required');
      }

      if (!options.customerInfo.name || !options.customerInfo.email) {
        throw new Error('Customer name and email are required');
      }

      if (!options.customerInfo.phone) {
        throw new Error('Phone number is required for Cashfree payments');
      }

      // Load Cashfree script
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Cashfree SDK');
      }

      // Create payment order
      const { data, error } = await supabase.functions.invoke('cashfree-payment', {
        body: {
          amount: options.amount,
          currency: 'INR',
          orderId: options.orderId,
          customerInfo: options.customerInfo,
        },
      });

      if (error) {
        throw new Error(`Payment creation failed: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      console.log('✅ Payment order created successfully');

      // Clean up before opening payment
      cleanupBeforePayment();

      // For mobile: Use redirect mode (most reliable)
      if (isMobile()) {
        console.log('📱 Mobile detected - using redirect mode');

        // Create a form to redirect to Cashfree
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.environment === 'sandbox'
          ? 'https://sandbox.cashfree.com/pg/checkout/hosted'
          : 'https://api.cashfree.com/pg/checkout/hosted';

        // Add payment session ID
        const sessionInput = document.createElement('input');
        sessionInput.type = 'hidden';
        sessionInput.name = 'payment_session_id';
        sessionInput.value = data.paymentSessionId;
        form.appendChild(sessionInput);

        // Add return URL
        const returnInput = document.createElement('input');
        returnInput.type = 'hidden';
        returnInput.name = 'return_url';
        returnInput.value = window.location.origin + '/payment-success';
        form.appendChild(returnInput);

        document.body.appendChild(form);
        form.submit();

        // For redirect mode, we'll handle success on the return page
        return;
      }

      // For desktop: Use modal mode
      console.log('🖥️ Desktop detected - using modal mode');

      const cashfree = window.Cashfree({
        mode: data.environment || 'production'
      });

      const checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_modal',
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          console.error('❌ Payment error:', result.error);
          options.onFailure(result.error);
          return;
        }

        if (result.paymentDetails) {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('cashfree-verify', {
              body: {
                cfOrderId: result.paymentDetails.orderId,
                paymentId: result.paymentDetails.paymentId,
                orderId: options.orderId,
              },
            });

            if (verifyError || !verifyData?.success) {
              throw new Error('Payment verification failed');
            }

            toast({
              title: 'Payment Successful!',
              description: 'Your order has been confirmed.',
            });

            options.onSuccess(result.paymentDetails.paymentId);
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            toast({
              title: 'Payment Verification Failed',
              description: 'Please contact support.',
              variant: 'destructive',
            });
            options.onFailure(error);
          }
        }
      }).catch((error: any) => {
        console.error('❌ Checkout failed:', error);
        options.onFailure(error);
      });

    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initiate payment',
        variant: 'destructive',
      });
      options.onFailure(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    initiatePayment,
    loading,
  };
};
