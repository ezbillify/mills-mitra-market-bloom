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

  const initiatePayment = async (options: CashfreeOptions) => {
    setLoading(true);

    try {
      const trimmedPhone = options.customerInfo.phone?.trim();

      console.log('🔵 Initiating Cashfree payment with options:', {
        amount: options.amount,
        orderId: options.orderId,
        customerInfo: {
          name: options.customerInfo.name,
          email: options.customerInfo.email,
          phone: trimmedPhone ? '***' : 'missing',
        },
      });

      // ✅ Basic validations
      if (!options.amount || options.amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (!options.orderId) {
        throw new Error('Order ID is required');
      }

      if (!options.customerInfo.name || !options.customerInfo.email) {
        throw new Error('Customer name and email are required');
      }

      if (!trimmedPhone || trimmedPhone.length < 10) {
        throw new Error('Phone number is required for online payment');
      }

      // Optional: Regex-based mobile number check (you can enable this)
      // const phoneRegex = /^[6-9]\d{9}$/;
      // if (!phoneRegex.test(trimmedPhone)) {
      //   throw new Error('Please enter a valid 10-digit Indian phone number');
      // }

      // ✅ Load Cashfree script
      console.log('📜 Loading Cashfree script...');
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Cashfree SDK');
      }
      console.log('✅ Cashfree script loaded successfully');

      // ✅ Call edge function to create payment order
      console.log('📤 Calling cashfree-payment edge function...');
      const { data, error } = await supabase.functions.invoke('cashfree-payment', {
        body: {
          amount: options.amount,
          currency: 'INR',
          orderId: options.orderId,
          customerInfo: {
            ...options.customerInfo,
            phone: trimmedPhone, // ensure clean data
          },
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

      // ✅ Fix z-index conflicts (Cashfree modal display)
      document.querySelectorAll('*').forEach(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        if (parseInt(zIndex) > 9999) {
          (el as HTMLElement).style.zIndex = '1';
        }
      });

      const cashfree = window.Cashfree({
        mode: data.environment || 'production',
      });

      const checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_modal',
      };

      console.log('🎯 Opening Cashfree checkout...');

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          console.error('❌ Cashfree checkout error:', result.error);
          options.onFailure(result.error);
          return;
        }

        if (result.redirect) {
          console.log('🔄 Redirect triggered:', result.redirectUrl);
        }

        if (result.paymentDetails) {
          try {
            console.log('💳 Payment completed, verifying...', {
              orderId: result.paymentDetails.orderId,
              paymentId: result.paymentDetails.paymentId,
            });

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
        console.error('❌ Cashfree checkout failed:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to open payment checkout',
          variant: 'destructive',
        });
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
