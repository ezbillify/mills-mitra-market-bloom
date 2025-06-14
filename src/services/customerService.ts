
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { processCustomerData } from "@/utils/customerUtils";

export const fetchCustomersData = async (): Promise<Customer[]> => {
  console.log('🚀 Fetching customer data...');
  
  try {
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`✅ Fetched ${profiles?.length || 0} profiles`);

    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, status, created_at')
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // Continue without orders if there's an error
    }

    console.log(`✅ Fetched ${orders?.length || 0} orders`);

    // Create user map
    const userMap = new Map();
    
    // Add profiles first
    profiles?.forEach(profile => {
      userMap.set(profile.id, {
        profile,
        orders: [],
        hasProfile: true
      });
    });

    // Add orders to existing users or create new entries
    orders?.forEach(order => {
      if (userMap.has(order.user_id)) {
        userMap.get(order.user_id).orders.push(order);
      } else {
        // User with orders but no profile
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

    // Process all users into customers
    const customers = Array.from(userMap.values()).map(userData => 
      processCustomerData(userData)
    );

    console.log(`🎯 Processed ${customers.length} customers`);
    return customers;

  } catch (error) {
    console.error('💥 Error in customer fetch:', error);
    throw error;
  }
};
