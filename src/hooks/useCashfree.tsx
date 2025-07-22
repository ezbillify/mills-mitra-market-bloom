import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  // Mobile detection
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Fix z-index conflicts and mobile issues
  const fixZIndexAndMobileConflicts = () => {
    // Fix z-index conflicts
    document.querySelectorAll('*').forEach(el => {
      const zIndex = window.getComputedStyle(el).zIndex;
      if (parseInt(zIndex) > 9999) {
        (el as HTMLElement).style.zIndex = '1';
      }
    });

    // Mobile-specific fixes
    if (isMobile()) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.classList.add('cashfree-modal-open');
    }
  };

  // Restore mobile settings
  const restoreMobileSettings = () => {
    if (isMobile()) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.classList.remove('cashfree-modal-open');
    }
  };

  const initiatePayment = async (options: CashfreeOptions) => {
    setLoading(true);
    
    try {
      console.log('🔵 Initiating Cashfree payment with options:', {
        amount: options.amount,
        orderId: options.orderId,
        customerInfo: {
          name: options.customerInfo.name,
          email: options.customerInfo.email,
          phone: options.customerInfo.phone ? '***' : 'missing'
        },
        isMobile: isMobile()
      });

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
        throw new Error('Customer phone number is required');
      }

      // Load Cashfree script
      console.log('📜 Loading Cashfree script...');
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Cashfree SDK');
      }
      console.log('✅ Cashfree script loaded successfully');

      // Create Cashfree order via edge function
      console.log('📤 Calling cashfree-payment edge function...');
      const { data, error } = await supabase.functions.invoke('cashfree-payment', {
        body: {
          amount: options.amount,
          currency: 'INR',
          orderId: options.orderId,
          customerInfo: options.customerInfo,
        },
      });

      console.log('📥 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(`Function call failed: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Payment order creation failed:', data);
        throw new Error(data?.error || 'Failed to create payment order');
      }

      console.log('✅ Payment order created successfully:', {
        cfOrderId: data.cfOrderId,
        paymentSessionId: data.paymentSessionId,
        amount: data.amount,
        currency: data.currency
      });

      // Fix z-index and mobile issues before opening checkout
      fixZIndexAndMobileConflicts();

      // Initialize Cashfree checkout
      const cashfree = window.Cashfree({
        mode: data.environment || 'production' // 'sandbox' for testing, 'production' for live
      });

      const checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: isMobile() ? '_self' : '_modal', // Mobile: redirect, Desktop: modal
      };

      console.log('🎯 Opening Cashfree checkout...', { isMobile: isMobile(), redirectTarget: checkoutOptions.redirectTarget });
      
      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        // Restore mobile settings
        restoreMobileSettings();

        if (result.error) {
          console.error('❌ Cashfree checkout error:', result.error);
          options.onFailure(result.error);
          return;
        }

        if (result.redirect) {
          // Handle redirect case (mobile)
          console.log('🔄 Redirect triggered:', result.redirectUrl);
          window.location.href = result.redirectUrl;
          return;
        }

        if (result.paymentDetails) {
          try {
            console.log('💳 Payment completed, verifying...', {
              orderId: result.paymentDetails.orderId,
              paymentId: result.paymentDetails.paymentId
            });

            // Verify payment via edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('cashfree-verify', {
              body: {
                cfOrderId: result.paymentDetails.orderId,
                paymentId: result.paymentDetails.paymentId,
                orderId: options.orderId,
              },
            });

            if (verifyError || !verifyData?.success) {
              console.error('❌ Payment verification failed:', { verifyData, verifyError });
              throw new Error('Payment verification failed');
            }

            console.log('✅ Payment verified successfully');
            toast({
              title: 'Payment Successful!',
              description: 'Your order has been confirmed.',
            });

            options.onSuccess(result.paymentDetails.paymentId);
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            toast({
              title: 'Payment Verification Failed',
              description: 'There was an issue verifying your payment. Please contact support.',
              variant: 'destructive',
            });
            options.onFailure(error);
          }
        }
      }).catch((error: any) => {
        // Restore mobile settings on error
        restoreMobileSettings();
        
        console.error('❌ Cashfree checkout failed:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to open payment checkout',
          variant: 'destructive',
        });
        options.onFailure(error);
      });

    } catch (error) {
      // Restore mobile settings on error
      restoreMobileSettings();
      
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
