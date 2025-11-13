import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidatePromoCodeRequest {
  code: string;
  orderTotal: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody: ValidatePromoCodeRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body: JSON parsing failed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { code, orderTotal } = requestBody;

    // Validate required fields with detailed error messages
    if (!code) {
      console.error('Missing code field in request');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: code'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (typeof orderTotal !== 'number') {
      console.error('Invalid orderTotal type:', typeof orderTotal, orderTotal);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid orderTotal: expected number, got ${typeof orderTotal}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (isNaN(orderTotal)) {
      console.error('orderTotal is NaN');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid orderTotal: value is NaN'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch promo code (without .single() to handle cases where no rows are found)
    const { data, error } = await supabaseClient
      .from('promo_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .or(`valid_from.is.null,valid_from.lte.${new Date().toISOString()}`);

    if (error) {
      console.error('Database error when fetching promo code:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error occurred while validating promo code'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!data || data.length === 0) {
      console.error('No promo code found with code:', code);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired promo code'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Filter for valid until date on server side
    const now = new Date().toISOString();
    const validPromos = data.filter((promo: any) => 
      !promo.valid_until || new Date(promo.valid_until) > new Date(now)
    );

    if (validPromos.length === 0) {
      console.error('No valid promo codes found after date filtering');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired promo code'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Use the first valid promo code
    const promoData = validPromos[0];

    // Check if promo code has reached max uses
    if (promoData.max_uses && promoData.used_count >= promoData.max_uses) {
      console.error('Promo code usage limit reached:', promoData.code, promoData.used_count, promoData.max_uses);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'This promo code has reached its maximum usage limit'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check if promo code has reached max uses per user
    if (promoData.max_uses_per_user) {
      // Get user ID from request headers or body
      const userId = req.headers.get('x-user-id') || (requestBody as any).userId;
      
      if (userId) {
        // Check how many times this user has used this promo code
        const { data: userUsageData, error: userUsageError } = await supabaseClient
          .from('promo_code_user_usage')
          .select('usage_count')
          .eq('promo_code_id', promoData.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (userUsageError) {
          console.error('Database error when fetching user usage:', userUsageError);
        } else if (userUsageData && userUsageData.usage_count >= promoData.max_uses_per_user) {
          console.error('User has reached maximum usage limit for this promo code:', userId, promoData.code, userUsageData.usage_count, promoData.max_uses_per_user);
          return new Response(
            JSON.stringify({
              success: false,
              error: `You have reached the maximum usage limit for this promo code (${promoData.max_uses_per_user} times)`
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
      }
    }

    // Check if order meets minimum amount requirement
    if (promoData.minimum_order_value && orderTotal < promoData.minimum_order_value) {
      console.error('Order total below minimum requirement:', orderTotal, promoData.minimum_order_value);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Order must be at least ₹${promoData.minimum_order_value.toFixed(2)} to use this promo code`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Calculate discount amount
    const discountAmount = promoData.discount_type === 'percentage'
      ? orderTotal * (promoData.discount_value / 100)
      : promoData.discount_value;

    const responseData = {
      success: true,
      promoCode: {
        id: promoData.id,
        code: promoData.code,
        description: promoData.description,
        discount_type: promoData.discount_type,
        discount_value: promoData.discount_value,
        minimum_order_value: promoData.minimum_order_value,
        max_uses: promoData.max_uses,
        used_count: promoData.used_count
      },
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat((orderTotal - discountAmount).toFixed(2))
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unexpected error in promo-code-validate function:', error);
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});