import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

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

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, orderId });

    // Verify signature using RazorPay's method
    // Concatenate order_id and payment_id with | separator
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    // Create HMAC hash
    const encoder = new TextEncoder();
    const key = encoder.encode(razorpayKeySecret);
    const data = encoder.encode(sign);
    
    const hmac = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      data
    );
    
    // Convert to hex string
    const generatedSignature = Array.from(new Uint8Array(hmac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Signature comparison:', {
      generated: generatedSignature,
      received: razorpay_signature,
      match: generatedSignature === razorpay_signature
    });

    if (generatedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Update order status in database for successful payment
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        status: 'processing',
        payment_status: 'completed',
        payment_id: razorpay_payment_id,
        payment_verified_at: new Date().toISOString(),
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
    
    // If verification fails, mark the order as cancelled immediately
    try {
      // Extract orderId from request body
      let orderId = null;
      try {
        const body = await req.json();
        orderId = body.orderId;
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
      }
      
      if (orderId) {
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
          console.log('Order marked as cancelled due to payment failure:', orderId);
        }
      }
    } catch (updateError) {
      console.error('Failed to update order status to cancelled:', updateError);
    }
    
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