
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { processCustomerData } from "@/utils/customerUtils";

export const fetchCustomersData = async (): Promise<Customer[]> => {
  console.log('🚀 === STARTING ENHANCED CUSTOMER FETCH ===');
  
  try {
    // First, get all profiles with better error handling
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
    console.log('📋 Sample profiles:', profiles?.slice(0, 3));
    
    // Get all orders to find users who might not have profiles
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, status, created_at')
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // Don't throw here, continue with just profiles
    }

    console.log('✅ === ORDERS FETCHED ===');
    console.log(`📊 Orders count: ${orders?.length || 0}`);

    // Create a comprehensive user map
    const userMap = new Map();
    
    // Add all profiles to the map first
    profiles?.forEach(profile => {
      console.log(`➕ Adding profile to map: ${profile.id.substring(0, 8)} - ${profile.first_name} ${profile.last_name}`);
      userMap.set(profile.id, {
        profile: {
          ...profile,
          // Ensure we have the basic required fields
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          postal_code: profile.postal_code || '',
          country: profile.country || ''
        },
        orders: [],
        hasProfile: true
      });
    });

    // Add order data and identify users without profiles
    orders?.forEach(order => {
      if (userMap.has(order.user_id)) {
        userMap.get(order.user_id).orders.push(order);
        console.log(`📦 Added order to existing user: ${order.user_id.substring(0, 8)}`);
      } else {
        // User has orders but no profile - create minimal entry
        console.log(`⚠️ Found user with orders but no profile: ${order.user_id.substring(0, 8)}`);
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
          hasProfile: false
        });
      }
    });

    console.log('⚡ === USER MAP CREATED ===');
    console.log(`📈 Total unique users: ${userMap.size}`);

    // Process all users into customers with detailed logging
    const processedCustomers: Customer[] = Array.from(userMap.values()).map((userData, index) => {
      console.log(`🔄 Processing customer ${index + 1}/${userMap.size}:`, {
        id: userData.profile.id.substring(0, 8),
        hasProfile: userData.hasProfile,
        orderCount: userData.orders.length
      });
      return processCustomerData(userData);
    });

    console.log('🏁 === FINAL CUSTOMERS LIST ===');
    console.log(`📊 Total customers processed: ${processedCustomers.length}`);
    
    // Log detailed customer info for debugging
    processedCustomers.forEach((customer, index) => {
      console.log(`👤 Customer ${index + 1}:`, {
        id: customer.id.substring(0, 8),
        name: customer.name,
        email: customer.email,
        totalOrders: customer.totalOrders,
        status: customer.status,
        joinDate: customer.joinDate
      });
    });
    
    return processedCustomers;
  } catch (error) {
    console.error('💥 === CRITICAL ERROR IN CUSTOMER FETCH ===', error);
    throw error;
  }
};
