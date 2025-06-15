
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log('🚀 Starting customer debug fetch...');

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch profiles', 
          details: profilesError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Fetched ${profiles?.length || 0} profiles`);

    // Fetch all orders with user_id info
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total, status, created_at')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch orders', 
          details: ordersError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Fetched ${orders?.length || 0} orders`);

    // Debug specific customer a48bc14d if it exists
    const targetCustomerId = 'a48bc14d-3872-427a-8d28-1ef0889834f3';
    const targetProfile = profiles?.find(p => p.id === targetCustomerId);
    const targetOrders = orders?.filter(o => o.user_id === targetCustomerId);

    console.log('🎯 Target customer analysis:', {
      id: targetCustomerId,
      profileFound: !!targetProfile,
      profileData: targetProfile,
      ordersCount: targetOrders?.length || 0,
      orderIds: targetOrders?.map(o => o.id.substring(0, 8))
    });

    // Create summary data
    const summary = {
      totalProfiles: profiles?.length || 0,
      totalOrders: orders?.length || 0,
      profilesWithData: profiles?.filter(p => p.first_name || p.last_name || (p.email && !p.email.includes('unknown.com'))).length || 0,
      targetCustomer: {
        id: targetCustomerId,
        found: !!targetProfile,
        profile: targetProfile,
        orderCount: targetOrders?.length || 0,
        orders: targetOrders
      },
      sampleProfiles: profiles?.slice(0, 3) || [],
      sampleOrders: orders?.slice(0, 3) || []
    };

    return new Response(
      JSON.stringify(summary, null, 2),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
