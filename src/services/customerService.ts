
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { processCustomerData } from "@/utils/customerUtils";

export const fetchCustomersData = async (): Promise<Customer[]> => {
  console.log('🚀 === STARTING COMPREHENSIVE CUSTOMER FETCH ===');
  
  // First, get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
    throw profilesError;
  }

  console.log('✅ === PROFILES FETCHED ===');
  console.log(`📊 Profiles count: ${profiles?.length || 0}`);
  
  // Get all orders to find users who might not have profiles
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('user_id, total, status, created_at')
    .neq('status', 'cancelled');

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError);
  }

  console.log('✅ === ORDERS FETCHED ===');
  console.log(`📊 Orders count: ${orders?.length || 0}`);

  // Create a comprehensive user map
  const userMap = new Map();
  
  // Add all profiles to the map
  profiles?.forEach(profile => {
    userMap.set(profile.id, {
      profile,
      orders: [],
      hasProfile: true
    });
  });

  // Add order data and identify users without profiles
  orders?.forEach(order => {
    if (userMap.has(order.user_id)) {
      userMap.get(order.user_id).orders.push(order);
    } else {
      // User has orders but no profile - create minimal entry
      userMap.set(order.user_id, {
        profile: {
          id: order.user_id,
          email: null,
          first_name: null,
          last_name: null,
          phone: null,
          address: null,
          city: null,
          postal_code: null,
          country: null,
          created_at: order.created_at
        },
        orders: [order],
        hasProfile: false
      });
    }
  });

  console.log('⚡ === USER MAP CREATED ===');
  console.log(`📈 Total unique users: ${userMap.size}`);

  // Process all users into customers
  const processedCustomers: Customer[] = Array.from(userMap.values()).map(processCustomerData);

  console.log('🏁 === FINAL CUSTOMERS LIST ===');
  console.log(`📊 Total customers: ${processedCustomers.length}`);
  console.log('👥 Customer details:', processedCustomers.map(c => ({
    name: c.name,
    email: c.email,
    orders: c.totalOrders
  })));
  
  return processedCustomers;
};
