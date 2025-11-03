import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('🧹 Starting cleanup of pending orders');

    // Calculate the cutoff time (5 minutes ago)
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Find pending orders that are older than 5 minutes and have razorpay_order_id
    const { data: pendingOrders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('id, created_at, payment_type, razorpay_order_id')
      .eq('status', 'pending')
      .not('razorpay_order_id', 'is', null)
      .lt('created_at', cutoffTime);

    if (fetchError) {
      console.error('❌ Error fetching pending orders:', fetchError);
      throw new Error('Failed to fetch pending orders');
    }

    console.log(`🔍 Found ${pendingOrders.length} pending orders older than 5 minutes`);

    if (pendingOrders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending orders to cleanup',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Update all pending orders to cancelled
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        status: 'cancelled',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .in('id', pendingOrders.map(order => order.id));

    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
      throw new Error('Failed to update pending orders');
      }

    console.log(`✅ Successfully cancelled ${pendingOrders.length} pending orders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cancelled ${pendingOrders.length} pending orders`,
        processed: pendingOrders.length,
        orders: pendingOrders.map(order => order.id)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
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