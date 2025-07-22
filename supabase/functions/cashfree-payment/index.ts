// supabase/functions/cashfree-payment/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, orderId, customerInfo } = await req.json()

    // Validate required fields
    if (!amount || !currency || !orderId || !customerInfo) {
      throw new Error('Missing required fields')
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      throw new Error('Missing customer information')
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount')
    }

    console.log('🔵 Creating Cashfree payment order:', {
      amount,
      currency,
      orderId: orderId.substring(0, 8),
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: '***'
      }
    })

    // Get Cashfree credentials from environment
    const clientId = Deno.env.get('CASHFREE_CLIENT_ID')
    const clientSecret = Deno.env.get('CASHFREE_CLIENT_SECRET')
    const environment = Deno.env.get('CASHFREE_ENVIRONMENT') || 'production' // 'sandbox' or 'production'
    
    if (!clientId || !clientSecret) {
      throw new Error('Cashfree credentials not configured')
    }

    // Determine API URL based on environment
    const baseUrl = environment === 'sandbox' 
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg'

    // Create order payload for Cashfree
    const orderPayload = {
      order_id: `CF_${orderId}_${Date.now()}`, // Unique Cashfree order ID
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: `CUST_${orderId}`,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/payment/success`,
        notify_url: `${req.headers.get('origin')}/api/cashfree/webhook`,
        payment_methods: 'cc,dc,nb,upi,paylater,emi,wallet'
      },
      order_note: `Payment for Order #${orderId.substring(0, 8)}`
    }

    console.log('📤 Sending request to Cashfree:', {
      ...orderPayload,
      customer_details: {
        ...orderPayload.customer_details,
        customer_phone: '***'
      }
    })

    // Create order with Cashfree
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Cashfree API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Cashfree API error: ${response.status} - ${errorText}`)
    }

    const orderData = await response.json()

    if (!orderData || !orderData.payment_session_id) {
      console.error('❌ Invalid response from Cashfree:', orderData)
      throw new Error('Invalid response from Cashfree API')
    }

    console.log('✅ Cashfree order created successfully:', {
      cfOrderId: orderData.cf_order_id,
      paymentSessionId: orderData.payment_session_id,
      amount: orderData.order_amount
    })

    return new Response(
      JSON.stringify({
        success: true,
        cfOrderId: orderData.cf_order_id,
        paymentSessionId: orderData.payment_session_id,
        amount: orderData.order_amount,
        currency: orderData.order_currency,
        environment: environment,
        orderId: orderId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Error in cashfree-payment function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
