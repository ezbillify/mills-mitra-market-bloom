
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { processCustomerData } from "@/utils/customerUtils";

export const fetchCustomersData = async (): Promise<Customer[]> => {
  console.log('🚀 Fetching customer data...');
  
  try {
    // Fetch all profiles with enhanced logging
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`✅ Fetched ${profiles?.length || 0} profiles`);
    profiles?.forEach(profile => {
      console.log(`📋 Profile: ${profile.id.substring(0, 8)} - ${profile.first_name} ${profile.last_name} (${profile.email})`);
    });

    // Fetch all orders with detailed logging
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, status, created_at')
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // Continue without orders if there's an error
    }

    console.log(`✅ Fetched ${orders?.length || 0} orders`);

    // Create user map from profiles only
    const userMap = new Map();
    
    // Add profiles
    profiles?.forEach(profile => {
      console.log(`📝 Adding profile to map: ${profile.id.substring(0, 8)} - ${profile.first_name} ${profile.last_name}`);
      
      userMap.set(profile.id, {
        profile,
        orders: [],
        hasProfile: true,
        source: 'profiles'
      });
    });

    // Add orders to existing users
    orders?.forEach(order => {
      if (userMap.has(order.user_id)) {
        userMap.get(order.user_id).orders.push(order);
      } else {
        console.log(`🔍 Found order for unknown user: ${order.user_id.substring(0, 8)}`);
        // Create minimal customer data for users with orders but no profile
        userMap.set(order.user_id, {
          profile: {
            id: order.user_id,
            email: `user-${order.user_id.substring(0, 8)}@unknown.com`,
            first_name: '',
            last_name: '',
            phone: '',
            address: '',
            city: '',
            postal_code: '',
            country: '',
            created_at: order.created_at
          },
          orders: [order],
          hasProfile: false,
          source: 'orders_only'
        });
      }
    });

    console.log(`📊 Total users in map: ${userMap.size}`);
    
    // Process all users into customers
    const customers = Array.from(userMap.values()).map(userData => {
      const customer = processCustomerData(userData);
      console.log(`🎯 Processed customer: ${customer.id.substring(0, 8)} - "${customer.name}" (${customer.email})`);
      return customer;
    });

    console.log(`🎯 Final customer count: ${customers.length}`);
    console.log(`📊 Sample customers:`, customers.slice(0, 3).map(c => ({
      id: c.id.substring(0, 8),
      name: c.name,
      email: c.email,
      phone: c.phone,
      hasProfile: !!c.profile
    })));

    return customers;

  } catch (error) {
    console.error('💥 Error in customer fetch:', error);
    throw error;
  }
};
