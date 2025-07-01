
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RazorpayOptions {
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
    Razorpay: any;
  }
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async (options: RazorpayOptions) => {
    setLoading(true);
    
    try {
      console.log('🔵 Initiating payment with options:', {
        amount: options.amount,
        orderId: options.orderId,
        customerInfo: {
          name: options.customerInfo.name,
          email: options.customerInfo.email,
          phone: options.customerInfo.phone ? '***' : 'missing'
        }
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

      // Load Razorpay script
      console.log('📜 Loading Razorpay script...');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }
      console.log('✅ Razorpay script loaded successfully');

      // Create Razorpay order via edge function
      console.log('📤 Calling razorpay-payment edge function...');
      const { data, error } = await supabase.functions.invoke('razorpay-payment', {
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
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency
      });

      // Initialize Razorpay checkout
      const razorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Mills Mitra',
        description: `Order #${options.orderId.substring(0, 8)}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: options.customerInfo.name,
          email: options.customerInfo.email,
          contact: options.customerInfo.phone,
        },
        theme: {
          color: '#8B4513',
        },
        handler: async (response: any) => {
          try {
            console.log('💳 Payment completed, verifying...', {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });

            // Verify payment via edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
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

            options.onSuccess(response.razorpay_payment_id);
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            toast({
              title: 'Payment Verification Failed',
              description: 'There was an issue verifying your payment. Please contact support.',
              variant: 'destructive',
            });
            options.onFailure(error);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('🚫 Payment modal dismissed by user');
            options.onFailure(new Error('Payment cancelled by user'));
          },
        },
      };

      console.log('🎯 Opening Razorpay checkout...');
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();

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
