import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MERCHANT-ID',
      },
      status: 204
    });
  }

  try {
    // Verify this is a POST request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 405
        }
      );
    }

    // Get the raw body and headers for verification
    const body = await req.text();
    const headers = req.headers;
    
    console.log('📥 PhonePe webhook received:', {
      headers: Object.fromEntries(headers),
      body: body.substring(0, 200) + '...' // Log first 200 chars
    });

    // Get PhonePe credentials from environment
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID');
    const environment = Deno.env.get('PHONEPE_ENVIRONMENT') || 'production';
    
    if (!merchantId) {
      throw new Error('PhonePe credentials not configured');
    }

    // Verify merchant ID
    const xMerchantId = headers.get('X-MERCHANT-ID');
    if (xMerchantId !== merchantId) {
      throw new Error('Invalid merchant ID');
    }

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ Failed to parse webhook payload:', parseError);
      throw new Error('Invalid JSON payload');
    }

    // Log the event type
    console.log('🔍 Webhook event type:', payload.event);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (payload.event) {
      case 'checkout.order.completed':
        console.log('✅ Payment completed:', payload.payload);
        
        // Update order status in database
        if (payload.payload && payload.payload.merchantOrderId) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'accepted',
              payment_id: payload.payload.transactionId,
              phonepe_transaction_id: payload.payload.transactionId,
              payment_status: 'completed',
              payment_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.payload.merchantOrderId);

          if (updateError) {
            console.error('❌ Database update error:', updateError);
            throw new Error('Failed to update order in database');
          }

          console.log('✅ Order updated successfully');
        }
        break;

      case 'checkout.order.failed':
        console.log('❌ Payment failed:', payload.payload);
        
        // Update order status to failed
        if (payload.payload && payload.payload.merchantOrderId) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              payment_id: payload.payload.transactionId,
              payment_status: 'failed',
              phonepe_transaction_id: payload.payload.transactionId,
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.payload.merchantOrderId);

          if (updateError) {
            console.error('❌ Database update error:', updateError);
            throw new Error('Failed to update order in database');
          }

          console.log('✅ Failed order updated successfully');
        }
        break;

      case 'pg.refund.completed':
        console.log('🔄 Refund completed:', payload.payload);
        // Handle refund completion if needed
        break;

      case 'pg.refund.failed':
        console.log('❌ Refund failed:', payload.payload);
        // Handle refund failure if needed
        break;

      default:
        console.log('⚠️ Unknown event type:', payload.event);
        break;
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        event: payload.event 
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('💥 Error in phonepe-webhook function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500
      }
    );
  }
})