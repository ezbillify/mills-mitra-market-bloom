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
    const authBaseUrl = environment === 'sandbox' 
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/identity-manager';
    
    const apiBaseUrl = environment === 'sandbox' 
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/pg';

    // Step 1: Get OAuth Access Token (ONLY for production - sandbox doesn't support it)
    let accessToken: string | null = null

    if (environment === 'production') {
      console.log('🔐 Getting OAuth access token for production...')

      const tokenParams = new URLSearchParams({
        client_id: clientId || merchantId,
        client_secret: saltKey,
        client_version: saltIndex,
        grant_type: 'client_credentials'
      })

      const tokenResponse = await fetch(`${authBaseUrl}/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams.toString()
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ OAuth token error:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          body: errorText
        })
        throw new Error(`OAuth token error: ${tokenResponse.status} - ${errorText}`)
      }

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token

      // Debug the token
      console.log('🔐 OAuth token received:', {
        tokenLength: accessToken?.length,
        tokenStart: accessToken ? accessToken.substring(0, 20) + '...' : 'null',
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type
      });

      if (!accessToken) {
        console.error('❌ No access token received:', tokenData)
        throw new Error('Failed to get access token')
      }

      console.log('✅ OAuth access token obtained for production')
    } else {
      console.log('ℹ️ Sandbox mode - using X-VERIFY checksum authentication only (OAuth not supported)')
    }

    // Generate unique transaction ID
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const merchantTransactionId = `TXN${timestamp}${randomSuffix}`

    // Get callback URL
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/phonepe-callback?orderId=${orderId}`

    // Create payment payload for PhonePe (new API structure)
    const paymentPayload = {
      merchantOrderId: orderId,
      amount: Math.round(amount * 100), // Convert to paise
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: callbackUrl
        }
      }
    }

    console.log('📤 Sending request to PhonePe:', {
      merchantOrderId: paymentPayload.merchantOrderId,
      amount: paymentPayload.amount
    })

    // Encode payload to base64
    const base64Payload = btoa(JSON.stringify(paymentPayload))

    console.log('🔐 Checksum calculation:', {
      base64PayloadLength: base64Payload.length,
      base64PayloadStart: base64Payload.substring(0, 50),
      endpoint: '/checkout/v2/pay',
      saltKeyStart: saltKey.substring(0, 8) + '...',
      saltIndex
    })

    // Prepare headers - DIFFERENT FOR PRODUCTION vs SANDBOX
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-MERCHANT-ID': merchantId,
      'accept': 'application/json'
    }

    // For production: Use OAuth Bearer token ONLY (no checksum)
    // For sandbox: Use X-VERIFY checksum ONLY (no OAuth)
    if (environment === 'production' && accessToken) {
      headers['Authorization'] = `O-Bearer ${accessToken}`
      console.log('📤 Using OAuth Bearer token authentication (production)', {
        tokenLength: accessToken.length,
        tokenStart: accessToken.substring(0, 20) + '...'
      });
    } else if (environment === 'sandbox') {
      // Generate X-VERIFY checksum for sandbox
      const stringToHash = `${base64Payload}/checkout/v2/pay${saltKey}`
      const encoder = new TextEncoder()
      const data = encoder.encode(stringToHash)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const checksum = `${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}###${saltIndex}`
      headers['X-VERIFY'] = checksum
      console.log('📤 Using X-VERIFY checksum authentication (sandbox)')
    }

    console.log('📤 Request URL:', `${apiBaseUrl}/checkout/v2/pay`)
    console.log('📤 Request headers:', Object.keys(headers))

    // Create payment with PhonePe
    const response = await fetch(`${apiBaseUrl}/checkout/v2/pay`, {
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

    if (!paymentData) {
      console.error('❌ Invalid response from PhonePe:', paymentData)
      throw new Error('Invalid response from PhonePe API')
    }

    // Check if it's an error response
    if (paymentData.code && paymentData.code !== 'SUCCESS') {
      console.error('❌ PhonePe API error:', paymentData)
      throw new Error(`PhonePe API error: ${paymentData.message || paymentData.code}`)
    }

    // Check if we have the required fields
    if (!paymentData.redirectUrl) {
      console.error('❌ Missing redirectUrl in PhonePe response:', paymentData)
      throw new Error('Missing redirect URL in PhonePe response')
    }

    console.log('✅ PhonePe order created successfully:', {
      orderId: paymentData.orderId,
      state: paymentData.state,
      redirectUrl: paymentData.redirectUrl
    })

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: paymentData.orderId, // Using orderId as transactionId
        redirectUrl: paymentData.redirectUrl,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
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