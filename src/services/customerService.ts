
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { processCustomerData } from "@/utils/customerUtils";
import { DebugUtils } from "@/utils/debugUtils";

export const fetchCustomersData = async (): Promise<Customer[]> => {
  DebugUtils.log("CustomerService", "🚀 Starting comprehensive customer data fetch with enhanced profile matching...");
  
  try {
    // First, fetch ALL profiles from the database
    DebugUtils.log("CustomerService", "📋 Fetching ALL profiles from database...");
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      DebugUtils.error("CustomerService", "Failed to fetch profiles", profilesError);
      throw profilesError;
    }

    DebugUtils.log("CustomerService", `✅ Successfully fetched ${profiles?.length || 0} profiles`);
    
    // Log specific customer a48bc14d if found
    const targetProfile = profiles?.find(p => p.id.startsWith('a48bc14d'));
    if (targetProfile) {
      DebugUtils.log("CustomerService", "🎯 Found target customer a48bc14d profile:", {
        id: targetProfile.id,
        first_name: targetProfile.first_name,
        last_name: targetProfile.last_name,
        email: targetProfile.email,
        phone: targetProfile.phone,
        address: targetProfile.address
      });
    } else {
      DebugUtils.log("CustomerService", "⚠️ Target customer a48bc14d profile NOT found in profiles table");
    }

    // Fetch all orders
    DebugUtils.log("CustomerService", "📦 Fetching orders from database...");
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, status, created_at')
      .neq('status', 'cancelled');

    if (ordersError) {
      DebugUtils.error("CustomerService", "Failed to fetch orders", ordersError);
      // Continue without orders if there's an error
    }

    DebugUtils.log("CustomerService", `✅ Successfully fetched ${orders?.length || 0} orders`);

    // Create user map with PROPER profile matching
    const userMap = new Map();
    
    // First pass: Add all profiles with their ACTUAL data
    profiles?.forEach(profile => {
      const userId = profile.id;
      DebugUtils.log("CustomerService", `➕ Adding profile to map: ${userId.substring(0, 8)}`);
      
      // Log details for our target customer
      if (userId.startsWith('a48bc14d')) {
        DebugUtils.log("CustomerService", "🔍 Processing target customer a48bc14d:", {
          profile_id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          has_real_email: !!profile.email && !profile.email.includes('unknown.com')
        });
      }
      
      userMap.set(userId, {
        profile: {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email, // Use ACTUAL email from profile, not generated
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          postal_code: profile.postal_code,
          country: profile.country,
          created_at: profile.created_at
        },
        orders: [],
        hasProfile: true,
        source: 'profiles'
      });
    });

    // Second pass: Add orders to existing users OR create entries for users without profiles
    orders?.forEach(order => {
      const userId = order.user_id;
      
      if (userMap.has(userId)) {
        // User already exists with profile - just add the order
        userMap.get(userId).orders.push(order);
        DebugUtils.log("CustomerService", `📦 Added order to existing user: ${userId.substring(0, 8)}`);
        
        // Special logging for our target customer
        if (userId.startsWith('a48bc14d')) {
          DebugUtils.log("CustomerService", "✅ Added order to target customer a48bc14d with existing profile");
        }
      } else {
        // User doesn't have profile - create fallback entry
        DebugUtils.log("CustomerService", `🆕 Creating fallback user entry for: ${userId.substring(0, 8)} (no profile found)`);
        userMap.set(userId, {
          profile: {
            id: userId,
            first_name: null,
            last_name: null,
            email: `user-${userId.substring(0, 8)}@unknown.com`, // Only use fallback if NO profile exists
            phone: null,
            address: null,
            city: null,
            postal_code: null,
            country: null,
            created_at: order.created_at
          },
          orders: [order],
          hasProfile: false,
          source: 'orders_only'
        });
      }
    });

    DebugUtils.log("CustomerService", `📊 Total unique users in map: ${userMap.size}`);
    
    // Final verification for our target customer
    const targetUserData = userMap.get('a48bc14d-3872-427a-8d28-1ef0889834f3');
    if (targetUserData) {
      DebugUtils.log("CustomerService", "🎯 Final target customer a48bc14d data:", {
        hasProfile: targetUserData.hasProfile,
        profile_email: targetUserData.profile.email,
        profile_first_name: targetUserData.profile.first_name,
        profile_last_name: targetUserData.profile.last_name,
        orders_count: targetUserData.orders.length,
        source: targetUserData.source
      });
    }
    
    // Process all users into customers
    const customers = Array.from(userMap.values()).map((userData, index) => {
      const userId = userData.profile.id;
      DebugUtils.log("CustomerService", `🔄 Processing user ${index + 1}/${userMap.size}:`, {
        id: userId.substring(0, 8),
        hasProfile: userData.hasProfile,
        orderCount: userData.orders.length,
        source: userData.source,
        has_real_data: !!(userData.profile.first_name || userData.profile.last_name || (userData.profile.email && !userData.profile.email.includes('unknown.com')))
      });
      
      const customer = processCustomerData(userData);
      
      // Extra logging for our target customer
      if (userId.startsWith('a48bc14d')) {
        DebugUtils.log("CustomerService", "✅ Processed target customer a48bc14d final result:", {
          id: customer.id.substring(0, 8),
          name: customer.name,
          email: customer.email,
          phone: customer.phone || 'No phone',
          orders: customer.totalOrders,
          spent: customer.totalSpent,
          status: customer.status,
          profile_first_name: customer.profile?.first_name,
          profile_last_name: customer.profile?.last_name
        });
      }
      
      return customer;
    });

    // Sort customers by join date (newest first)
    customers.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

    DebugUtils.log("CustomerService", `🎯 Final results: ${customers.length} customers processed successfully`);
    
    // Final summary for target customer
    const targetCustomer = customers.find(c => c.id.startsWith('a48bc14d'));
    if (targetCustomer) {
      DebugUtils.log("CustomerService", "🏁 TARGET CUSTOMER a48bc14d FINAL SUMMARY:", {
        name: targetCustomer.name,
        email: targetCustomer.email,
        totalOrders: targetCustomer.totalOrders,
        profile_available: !!targetCustomer.profile,
        profile_complete: !!(targetCustomer.profile?.first_name || targetCustomer.profile?.last_name)
      });
    }

    return customers;

  } catch (error) {
    DebugUtils.error("CustomerService", "Critical error in customer data fetch", error);
    throw error;
  }
};
