import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

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

    console.log('🔵 Creating PhonePe payment order:', {
      amount,
      currency,
      orderId: orderId.substring(0, 8),
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: '***'
      }
    })

    // Get PhonePe credentials from environment
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID')
    const saltKey = Deno.env.get('PHONEPE_SALT_KEY')
    const saltIndex = Deno.env.get('PHONEPE_SALT_INDEX') || '1'
    const environment = Deno.env.get('PHONEPE_ENVIRONMENT') || 'production'
    
    if (!merchantId || !saltKey) {
      throw new Error('PhonePe credentials not configured')
    }

    // Determine API URL based on environment
    const baseUrl = environment === 'sandbox' 
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/hermes'

    // Generate unique transaction ID
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const merchantTransactionId = `TXN${timestamp}${randomSuffix}`

    // Get callback URL
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/phonepe-callback?orderId=${orderId}`

    // Create payment payload for PhonePe
    const paymentPayload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: `USER${orderId.substring(0, 8)}`,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: callbackUrl, // PhonePe will redirect user here after payment
      redirectMode: "POST",
      callbackUrl: callbackUrl, // Server-to-server callback
      mobileNumber: customerInfo.phone,
      paymentInstrument: {
        type: "PAY_PAGE"
      },
    }

    console.log('📤 Sending request to PhonePe:', {
      ...paymentPayload,
      mobileNumber: '***'
    })

    // Encode payload to base64
    const base64Payload = btoa(JSON.stringify(paymentPayload))

    // Generate X-VERIFY checksum
    const stringToHash = `${base64Payload}/pg/v1/pay${saltKey}`
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToHash)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = `${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}###${saltIndex}`

    // Create payment with PhonePe
    const response = await fetch(`${baseUrl}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json'
      },
      body: JSON.stringify({ request: base64Payload })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PhonePe API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`PhonePe API error: ${response.status} - ${errorText}`)
    }

    const paymentData = await response.json()

    if (!paymentData || !paymentData.success) {
      console.error('❌ Invalid response from PhonePe:', paymentData)
      throw new Error('Invalid response from PhonePe API')
    }

    console.log('✅ PhonePe order created successfully:', {
      merchantTransactionId: paymentData.data.merchantTransactionId,
      redirectUrl: paymentData.data.instrumentResponse.redirectInfo.url
    })

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: merchantTransactionId,
        redirectUrl: paymentData.data.instrumentResponse.redirectInfo.url,
        amount: paymentData.data.amount,
        currency: paymentData.data.currency,
        environment: environment,
        orderId: orderId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Error in phonepe-payment function:', error)
    
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