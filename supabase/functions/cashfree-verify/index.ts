import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cfOrderId, paymentId, orderId } = await req.json()

    // Validate required fields
    if (!cfOrderId || !orderId) {
      throw new Error('Missing required fields for payment verification')
    }

    console.log('🔍 Verifying Cashfree payment:', {
      cfOrderId,
      paymentId: paymentId ? paymentId.substring(0, 8) : 'not provided',
      orderId: orderId.substring(0, 8)
    })

    // Get Cashfree credentials from environment
    const clientId = Deno.env.get('CASHFREE_CLIENT_ID')
    const clientSecret = Deno.env.get('CASHFREE_CLIENT_SECRET')
    const environment = Deno.env.get('CASHFREE_ENVIRONMENT') || 'production'
    
    if (!clientId || !clientSecret) {
      throw new Error('Cashfree credentials not configured')
    }

    // Determine API URL based on environment
    const baseUrl = environment === 'sandbox' 
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg'

    // Get order status from Cashfree (this includes payment info)
    console.log('🔍 Fetching order status from Cashfree...')
    const orderResponse = await fetch(`${baseUrl}/orders/${cfOrderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01'
      }
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('❌ Cashfree order status error:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        body: errorText
      })
      throw new Error(`Order verification failed: ${orderResponse.status}`)
    }

    const orderData = await orderResponse.json()

    if (!orderData) {
      throw new Error('Invalid order verification response')
    }

    console.log('📋 Order verification response:', {
      orderStatus: orderData.order_status,
      orderAmount: orderData.order_amount,
      paymentMethod: orderData.payment_method || 'unknown'
    })

    // Check if order payment is successful
    if (orderData.order_status !== 'PAID') {
      throw new Error(`Payment not successful. Order status: ${orderData.order_status}`)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Use cfOrderId as payment ID since we don't have the actual payment ID from frontend
    const actualPaymentId = paymentId || cfOrderId

    // Update order status and payment details in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'accepted',
        payment_id: actualPaymentId,
        cashfree_order_id: cfOrderId,
        payment_status: 'completed',
        payment_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw new Error('Failed to update order in database')
    }

    console.log('✅ Payment verified and order updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: orderData.order_status,
        paymentMethod: orderData.payment_method || 'unknown',
        amount: orderData.order_amount,
        orderId: orderId,
        cfOrderId: cfOrderId,
        paymentId: actualPaymentId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Error in cashfree-verify function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
