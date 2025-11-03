import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Razorpay keys from Supabase secrets
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay API keys not configured');
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      throw new Error('Invalid request body');
    }

    const { amount, currency = 'INR', orderId, customerInfo }: PaymentRequest = requestBody;

    // Validate required fields
    if (!amount || !orderId || !customerInfo) {
      throw new Error('Missing required fields: amount, orderId, or customerInfo');
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    // Create Razorpay order
    const razorpayOrderData = {
      amount: Math.round(amount * 100), // Convert to paise and ensure it's an integer
      currency,
      receipt: orderId,
      notes: {
        order_id: orderId,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
      }
    };

    const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayOrderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      
      // Try to parse error as JSON, fallback to text
      let errorMessage = 'Unknown Razorpay API error';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.description || errorData.message || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${razorpayResponse.status}`;
      }
      
      // Mark order as cancelled if payment creation fails
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ 
            status: 'cancelled',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
          
        if (updateError) {
          console.error('Failed to update order status to cancelled:', updateError);
        } else {
          console.log('Order marked as cancelled due to payment creation failure:', orderId);
        }
      } catch (updateError) {
        console.error('Failed to update order status to cancelled:', updateError);
      }
      
      throw new Error(`Razorpay API Error: ${errorMessage}`);
    }

    const razorpayOrder = await razorpayResponse.json();

    const responseData = {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayKeyId, // Safe to send key ID to frontend
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});