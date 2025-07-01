
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
    console.log('🔵 Razorpay payment function called');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Razorpay keys from Supabase secrets
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    console.log('🔑 Checking Razorpay keys:', {
      keyIdExists: !!razorpayKeyId,
      keySecretExists: !!razorpayKeySecret
    });

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('❌ Razorpay API keys not configured');
      throw new Error('Razorpay API keys not configured');
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📝 Request body received:', JSON.stringify(requestBody, null, 2));
    } catch (error) {
      console.error('❌ Failed to parse request body:', error);
      throw new Error('Invalid request body');
    }

    const { amount, currency = 'INR', orderId, customerInfo }: PaymentRequest = requestBody;

    // Validate required fields
    if (!amount || !orderId || !customerInfo) {
      console.error('❌ Missing required fields:', { amount, orderId, customerInfo });
      throw new Error('Missing required fields: amount, orderId, or customerInfo');
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      console.error('❌ Invalid amount:', amount);
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

    console.log('📤 Creating Razorpay order with data:', JSON.stringify(razorpayOrderData, null, 2));

    const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    console.log('🔐 Auth string created (length):', authString.length);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayOrderData),
    });

    console.log('📥 Razorpay API response status:', razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('❌ Razorpay API Error:', {
        status: razorpayResponse.status,
        statusText: razorpayResponse.statusText,
        error: errorText
      });
      
      // Try to parse error as JSON, fallback to text
      let errorMessage = 'Unknown Razorpay API error';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.description || errorData.message || errorText;
      } catch {
        errorMessage = errorText || `HTTP ${razorpayResponse.status}`;
      }
      
      throw new Error(`Razorpay API Error: ${errorMessage}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('✅ Razorpay order created successfully:', {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });

    const responseData = {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayKeyId, // Safe to send key ID to frontend
    };

    console.log('📤 Sending success response:', JSON.stringify(responseData, null, 2));

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Razorpay payment error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
    };

    console.log('📤 Sending error response:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
