// supabase/functions/cashfree-verify/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cfOrderId, paymentId, orderId } = await req.json()

    // Validate required fields
    if (!cfOrderId || !paymentId || !orderId) {
      throw new Error('Missing required fields for payment verification')
    }

    console.log('🔍 Verifying Cashfree payment:', {
      cfOrderId,
      paymentId,
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

    // Verify payment with Cashfree
    const paymentResponse = await fetch(`${baseUrl}/orders/${cfOrderId}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01'
      }
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error('❌ Cashfree payment verification error:', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        body: errorText
      })
      throw new Error(`Payment verification failed: ${paymentResponse.status}`)
    }

    const paymentData = await paymentResponse.json()

    if (!paymentData) {
      throw new Error('Invalid payment verification response')
    }

    console.log('📋 Payment verification response:', {
      paymentStatus: paymentData.payment_status,
      paymentMethod: paymentData.payment_method,
      amount: paymentData.payment_amount
    })

    // Check if payment is successful
    if (paymentData.payment_status !== 'SUCCESS') {
      throw new Error(`Payment not successful. Status: ${paymentData.payment_status}`)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update order status and payment details in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'accepted', // or 'processing' based on your workflow
        payment_id: paymentId,
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
        paymentStatus: paymentData.payment_status,
        paymentMethod: paymentData.payment_method,
        amount: paymentData.payment_amount,
        orderId: orderId,
        cfOrderId: cfOrderId,
        paymentId: paymentId
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