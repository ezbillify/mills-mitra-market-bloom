import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface PhonePeOptions {
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

export const usePhonePe = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initiatePayment = async (options: PhonePeOptions) => {
    setLoading(true);

    try {
      const trimmedPhone = options.customerInfo.phone?.trim();
      const cleanPhone = trimmedPhone ? trimmedPhone.replace(/[^0-9]/g, '') : '';

      console.log('🔵 Initiating PhonePe payment with options:', {
        amount: options.amount,
        orderId: options.orderId,
        customerInfo: {
          name: options.customerInfo.name,
          email: options.customerInfo.email,
          phone: cleanPhone ? '***' : 'missing',
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

      if (!cleanPhone || cleanPhone.length !== 10) {
        throw new Error('Phone number must be exactly 10 digits for online payment');
      }

      // ✅ Call edge function to create payment order
      console.log('📤 Calling phonepe-payment edge function...');
      const { data, error } = await supabase.functions.invoke('phonepe-payment', {
        body: {
          amount: options.amount,
          currency: 'INR',
          orderId: options.orderId,
          customerInfo: {
            ...options.customerInfo,
            phone: cleanPhone, // ensure clean data
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

      // Store the PhonePe transaction ID in the database for verification
      const phonePeTransactionId = data.transactionId;
      console.log('💾 Storing PhonePe Transaction ID:', phonePeTransactionId);

      // Update the order with the PhonePe transaction ID
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          phonepe_transaction_id: phonePeTransactionId,
          payment_status: 'pending'
        })
        .eq('id', options.orderId);

      if (updateError) {
        console.error('❌ Failed to update order with transaction ID:', updateError);
        throw new Error('Failed to save payment details');
      }

      console.log('✅ Transaction ID saved to database');

      // Redirect to PhonePe payment page
      console.log('🎯 Redirecting to PhonePe checkout...');
      window.location.href = data.redirectUrl;

      // For PhonePe, we'll need to handle the callback separately
      // The onSuccess callback will be called from the verification function
      // when PhonePe redirects back to our callback URL

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