import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePromoCodeUsageRequest {
  promoCodeId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody: UpdatePromoCodeUsageRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      throw new Error('Invalid request body');
    }

    const { promoCodeId } = requestBody;

    // Validate required fields
    if (!promoCodeId) {
      throw new Error('Missing required field: promoCodeId');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get the current used_count
    const { data: promoCode, error: fetchError } = await supabaseClient
      .from('promo_codes')
      .select('used_count')
      .eq('id', promoCodeId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch promo code: ${fetchError.message}`);
    }

    // Increment promo code usage count
    const { data, error } = await supabaseClient
      .from('promo_codes')
      .update({ used_count: promoCode.used_count + 1 })
      .eq('id', promoCodeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update promo code usage: ${error.message}`);
    }

    const responseData = {
      success: true,
      promoCode: data
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
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