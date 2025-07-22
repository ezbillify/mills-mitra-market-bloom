
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

    console.log('🚀 Starting enhanced customer debug fetch...');

    // Fetch all profiles with detailed logging
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

    // Test regular client access (as the frontend would use)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: publicProfiles, error: publicProfilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .limit(5);

    console.log('🔍 Public client access test:', {
      canAccessProfiles: !publicProfilesError,
      profileCount: publicProfiles?.length || 0,
      error: publicProfilesError?.message
    });

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

    // Analyze profile completeness
    const completeProfiles = profiles?.filter(p => 
      p.first_name && p.last_name && p.email && !p.email.includes('unknown.com')
    ) || [];

    const incompleteProfiles = profiles?.filter(p => 
      !p.first_name || !p.last_name || !p.email || p.email.includes('unknown.com')
    ) || [];

    // Create comprehensive summary data
    const summary = {
      totalProfiles: profiles?.length || 0,
      totalOrders: orders?.length || 0,
      profilesWithData: completeProfiles.length,
      incompleteProfiles: incompleteProfiles.length,
      rlsTestResult: {
        canAccessWithPublicKey: !publicProfilesError,
        publicAccessCount: publicProfiles?.length || 0,
        error: publicProfilesError?.message || null
      },
      targetCustomer: {
        id: targetCustomerId,
        found: !!targetProfile,
        profile: targetProfile,
        orderCount: targetOrders?.length || 0,
        orders: targetOrders
      },
      sampleCompleteProfiles: completeProfiles.slice(0, 3),
      sampleIncompleteProfiles: incompleteProfiles.slice(0, 3),
      sampleOrders: orders?.slice(0, 3) || [],
      profileCompleteness: {
        withNames: profiles?.filter(p => p.first_name && p.last_name).length || 0,
        withEmail: profiles?.filter(p => p.email && !p.email.includes('unknown.com')).length || 0,
        withPhone: profiles?.filter(p => p.phone).length || 0,
        withAddress: profiles?.filter(p => p.address).length || 0
      }
    };

    console.log('📊 Debug summary complete:', {
      totalProfiles: summary.totalProfiles,
      completeProfiles: summary.profilesWithData,
      rlsWorking: summary.rlsTestResult.canAccessWithPublicKey
    });

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
