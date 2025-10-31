import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Handle both GET and POST requests
    let transactionId = '';
    let code = '';
    let orderId = '';

    // Extract orderId from URL query parameters (we pass this in redirectUrl)
    const url = new URL(req.url);
    orderId = url.searchParams.get('orderId') || '';

    if (req.method === 'POST') {
      const formData = await req.formData();
      transactionId = formData.get('transactionId') as string || '';
      code = formData.get('code') as string || '';
    } else {
      // For GET requests, extract from query parameters
      transactionId = url.searchParams.get('transactionId') || '';
      code = url.searchParams.get('code') || '';
    }

    console.log('🔄 PhonePe callback received:', { transactionId, code, orderId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get merchant ID from environment
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

    // Prepare headers - DIFFERENT FOR PRODUCTION vs SANDBOX
    const statusHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-MERCHANT-ID': merchantId,
      'accept': 'application/json'
    }

    // For production: Use OAuth Bearer token ONLY (no checksum)
    // For sandbox: Use X-VERIFY checksum ONLY (no OAuth)
    if (environment === 'production' && accessToken) {
      statusHeaders['Authorization'] = `Bearer ${accessToken}`
      console.log('🔍 Using OAuth Bearer token authentication (production)')
    } else if (environment === 'sandbox') {
      // Generate X-VERIFY checksum for sandbox
      const stringToHash = `/checkout/v2/order/${orderId}/status${saltKey}`
      const encoder = new TextEncoder()
      const data = encoder.encode(stringToHash)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const checksum = `${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}###${saltIndex}`
      statusHeaders['X-VERIFY'] = checksum
      console.log('🔍 Using X-VERIFY checksum authentication (sandbox)')
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

    // If orderId not provided in URL, find it using transaction ID
    if (!orderId) {
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('phonepe_transaction_id', transactionId)
        .single()

      if (orderError || !orders) {
        console.error('❌ Error finding order:', orderError)
        throw new Error('Order not found')
      }

      orderId = orders.id
    }

    if (paymentStatus === 'COMPLETED') {
      // Update order status and payment details in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          payment_id: transactionId,
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
      
      // Redirect to success page
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/payment-success`
        }
      })
    } else if (paymentStatus === 'FAILED') {
      // Update order status to failed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_id: transactionId,
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        throw new Error('Failed to update order in database')
      }

      console.log('❌ Payment failed and order updated successfully')
      
      // Redirect to failure page
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/payment-failed`
        }
      })
    } else {
      console.log('⚠️ Payment status is pending or unknown:', paymentStatus)
      
      // Redirect to pending page
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/payment-pending`
        }
      })
    }

  } catch (error) {
    console.error('💥 Error in phonepe-callback function:', error)
    
    // Redirect to error page
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}/payment-error`
      }
    })
  }
})