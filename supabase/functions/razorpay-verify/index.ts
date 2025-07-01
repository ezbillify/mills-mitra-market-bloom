
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }: VerifyRequest = await req.json();

    // Verify signature
    const crypto = await import("https://deno.land/std@0.177.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    const key = encoder.encode(razorpayKeySecret);
    
    const signature = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    ), data);
    
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Update order status in database
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log('Payment verified and order updated:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        orderId,
        paymentId: razorpay_payment_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
