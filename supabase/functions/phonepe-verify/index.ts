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
    const { transactionId, orderId } = await req.json()

    // Validate required fields
    if (!transactionId || !orderId) {
      throw new Error('Missing required fields for payment verification')
    }

    console.log('🔍 Verifying PhonePe payment:', {
      transactionId: transactionId.substring(0, 8),
      orderId: orderId.substring(0, 8)
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

    // Determine API URL based on environment
    const authBaseUrl = environment === 'sandbox' 
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/identity-manager'
      
    const apiBaseUrl = environment === 'sandbox' 
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/pg'

    // Step 1: Get OAuth Access Token (ONLY for production - sandbox doesn't support it)
    let accessToken: string | null = null

    if (environment === 'production') {
      console.log('🔐 Getting OAuth access token for production status check...')

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
          body: errorText
        })
        throw new Error(`OAuth token error: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token

      if (!accessToken) {
        throw new Error('Failed to get access token')
      }

      console.log('✅ OAuth access token obtained for production')
    } else {
      console.log('ℹ️ Sandbox mode - using X-VERIFY checksum authentication only (OAuth not supported)')
    }

    // Prepare headers for status check
    const statusHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-MERCHANT-ID': merchantId,
      'accept': 'application/json'
    }

    // Add Authorization header only for production
    if (accessToken) {
      statusHeaders['Authorization'] = `Bearer ${accessToken}`
      console.log('🔍 Using OAuth authentication for status check')
    } else {
      // For sandbox, we still need to use checksum authentication
      const stringToHash = `/checkout/v2/order/${orderId}/status${saltKey}`
      const encoder = new TextEncoder()
      const data = encoder.encode(stringToHash)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const checksum = `${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}###${saltIndex}`
      statusHeaders['X-VERIFY'] = checksum
      console.log('🔍 Using Checksum-only authentication for status check')
    }

    // Check payment status with PhonePe
    const statusResponse = await fetch(`${apiBaseUrl}/checkout/v2/order/${orderId}/status`, {
      method: 'GET',
      headers: statusHeaders
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error('❌ PhonePe status API error:', {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        body: errorText
      })
      throw new Error(`PhonePe status API error: ${statusResponse.status} - ${errorText}`)
    }

    const statusData = await statusResponse.json()

    if (!statusData) {
      console.error('❌ Invalid response from PhonePe status API:', statusData)
      throw new Error('Invalid response from PhonePe status API')
    }

    const paymentStatus = statusData.state

    console.log('🔍 PhonePe payment status:', paymentStatus);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let actualPaymentId = transactionId;

    if (paymentStatus === 'COMPLETED') {
      // Update order status and payment details in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          payment_id: actualPaymentId,
          phonepe_transaction_id: transactionId,
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
    } else if (paymentStatus === 'FAILED') {
      // Update order status to failed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'failed',
          payment_status: 'failed',
          phonepe_transaction_id: transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        throw new Error('Failed to update order in database')
      }

      console.log('❌ Payment failed and order updated successfully')
      throw new Error('Payment failed')
    } else {
      console.log('⚠️ Payment status is pending or unknown:', paymentStatus)
      throw new Error(`Payment status: ${paymentStatus}`)
    }

    return new Response(
      JSON.stringify({
        success: paymentStatus === 'COMPLETED',
        paymentStatus: paymentStatus,
        paymentMethod: 'phonepe',
        amount: statusData.amount,
        orderId: orderId,
        transactionId: transactionId,
        paymentId: actualPaymentId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Error in phonepe-verify function:', error)
    
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