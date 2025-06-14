
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

    console.log(`✅ Fetched ${profiles?.length || 0} profiles:`, profiles?.map(p => ({
      id: p.id.substring(0, 8),
      email: p.email,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      created_at: p.created_at
    })));

    // Fetch all orders with detailed logging
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, status, created_at')
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // Continue without orders if there's an error
    }

    console.log(`✅ Fetched ${orders?.length || 0} orders:`, orders?.map(o => ({
      user_id: o.user_id.substring(0, 8),
      total: o.total,
      status: o.status,
      created_at: o.created_at
    })));

    // Also fetch auth users to catch any users not in profiles table
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching auth users:', usersError);
    } else {
      console.log(`✅ Fetched ${users?.length || 0} auth users:`, users?.map(u => ({
        id: u.id.substring(0, 8),
        email: u.email,
        created_at: u.created_at
      })));
    }

    // Create comprehensive user map
    const userMap = new Map();
    
    // Add profiles first
    profiles?.forEach(profile => {
      userMap.set(profile.id, {
        profile,
        orders: [],
        hasProfile: true,
        source: 'profiles'
      });
    });

    // Add auth users who might not have profiles
    if (users) {
      users.forEach(user => {
        if (!userMap.has(user.id)) {
          console.log(`🔍 Found auth user without profile: ${user.id.substring(0, 8)} - ${user.email}`);
          userMap.set(user.id, {
            profile: {
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              phone: user.phone || '',
              address: '',
              city: '',
              postal_code: '',
              country: '',
              created_at: user.created_at
            },
            orders: [],
            hasProfile: false,
            source: 'auth_users'
          });
        }
      });
    }

    // Add orders to existing users or create new entries
    orders?.forEach(order => {
      if (userMap.has(order.user_id)) {
        userMap.get(order.user_id).orders.push(order);
      } else {
        console.log(`🔍 Found order for unknown user: ${order.user_id.substring(0, 8)}`);
        // User with orders but no profile or auth record
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
      console.log(`🎯 Processed customer: ${customer.id.substring(0, 8)} - ${customer.name} (source: ${userData.source})`);
      return customer;
    });

    console.log(`🎯 Final customer count: ${customers.length}`);
    return customers;

  } catch (error) {
    console.error('💥 Error in customer fetch:', error);
    throw error;
  }
};
