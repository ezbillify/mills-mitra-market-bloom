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
    const clientId = Deno.env.get('PHONEPE_CLIENT_ID')
    const environment = Deno.env.get('PHONEPE_ENVIRONMENT') || 'production'

    if (!merchantId || !saltKey) {
      throw new Error('PhonePe credentials not configured')
    }

    console.log('🔑 Using credentials:', {
      merchantId,
      merchantIdLength: merchantId.length,
      clientId,
      saltKeyLength: saltKey?.length,
      saltIndex,
      environment
    })

    // Determine API URL based on environment
    const apiBaseUrl = environment === 'sandbox'
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/pg/checkout/v2';

    console.log('ℹ️ Payment creation uses X-VERIFY checksum authentication only')

    // Get callback URL
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/phonepe-callback?orderId=${orderId}`

    // Create payment payload for PhonePe (correct API structure)
    const paymentPayload = {
      merchantId: merchantId,
      merchantTransactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      merchantUserId: `USER${orderId.substring(0, 8)}`,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: callbackUrl,
      redirectMode: "POST",
      mobileNumber: customerInfo.phone,
      paymentInstrument: {
        type: "PAY_PAGE"
      },
      merchantOrderId: orderId,
      currency: currency,
    }

    console.log('📤 Sending request to PhonePe:', {
      merchantOrderId: paymentPayload.merchantOrderId,
      amount: paymentPayload.amount,
      merchantTransactionId: paymentPayload.merchantTransactionId
    })

    // Encode payload to base64
    const base64Payload = btoa(JSON.stringify(paymentPayload))

    // Determine endpoint path for checksum based on environment
    const endpointPath = environment === 'sandbox' ? '/pg/v1/pay' : '/pay'

    console.log('🔐 Checksum calculation:', {
      base64PayloadLength: base64Payload.length,
      base64PayloadStart: base64Payload.substring(0, 50),
      endpoint: endpointPath,
      saltKeyStart: saltKey.substring(0, 8) + '...',
      saltIndex
    })

    // Generate X-VERIFY checksum
    const stringToHash = `${base64Payload}${endpointPath}${saltKey}`
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToHash)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = `${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}###${saltIndex}`

    console.log('🔐 Checksum generated:', {
      checksumLength: checksum.length,
      checksumStart: checksum.substring(0, 20) + '...'
    })

    // Prepare headers - DIFFERENT FOR PRODUCTION vs SANDBOX
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': merchantId,
      'accept': 'application/json'
    }

    // Production v2 API uses ONLY checksum authentication (not OAuth for payment creation)
    console.log('📤 Using Checksum authentication')

    // Determine full request URL based on environment
    const requestUrl = environment === 'sandbox'
      ? `${apiBaseUrl}/pg/v1/pay`
      : `${apiBaseUrl}/pay`

    console.log('📤 Request URL:', requestUrl)
    console.log('📤 Request headers:', headers)
    console.log('📤 Request body:', { request: base64Payload })

    // Create payment with PhonePe
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
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

    // Log the full response for debugging
    console.log('📥 Full PhonePe response:', JSON.stringify(paymentData, null, 2));

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
        transactionId: paymentData.data.merchantTransactionId,
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