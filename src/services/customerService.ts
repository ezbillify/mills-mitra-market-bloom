
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { processCustomerData } from "@/utils/customerUtils";
import { DebugUtils } from "@/utils/debugUtils";

export const fetchCustomersData = async (): Promise<Customer[]> => {
  DebugUtils.log("CustomerService", "🚀 Starting comprehensive customer data fetch...");
  
  try {
    // Fetch all profiles with detailed logging
    DebugUtils.log("CustomerService", "📋 Fetching profiles from database...");
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      DebugUtils.error("CustomerService", "Failed to fetch profiles", profilesError);
      throw profilesError;
    }

    DebugUtils.log("CustomerService", `✅ Successfully fetched ${profiles?.length || 0} profiles`);
    DebugUtils.table("CustomerService", "Profiles data:", profiles?.map(profile => ({
      id: profile.id.substring(0, 8),
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      hasData: !!(profile.first_name || profile.last_name || profile.email)
    })) || []);

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
    DebugUtils.table("CustomerService", "Orders data sample:", orders?.slice(0, 5).map(order => ({
      user_id: order.user_id.substring(0, 8),
      total: order.total,
      status: order.status
    })) || []);

    // Create comprehensive user map
    const userMap = new Map();
    
    // First, add all profiles to the map
    profiles?.forEach(profile => {
      DebugUtils.log("CustomerService", `➕ Adding profile to map: ${profile.id.substring(0, 8)}`);
      userMap.set(profile.id, {
        profile: {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
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

    // Then, add orders to existing users or create new entries for users without profiles
    orders?.forEach(order => {
      if (userMap.has(order.user_id)) {
        userMap.get(order.user_id).orders.push(order);
        DebugUtils.log("CustomerService", `📦 Added order to existing user: ${order.user_id.substring(0, 8)}`);
      } else {
        DebugUtils.log("CustomerService", `🆕 Creating new user entry from order: ${order.user_id.substring(0, 8)}`);
        userMap.set(order.user_id, {
          profile: {
            id: order.user_id,
            first_name: null,
            last_name: null,
            email: `user-${order.user_id.substring(0, 8)}@unknown.com`,
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
    
    // Process all users into customers with detailed logging
    const customers = Array.from(userMap.values()).map((userData, index) => {
      DebugUtils.log("CustomerService", `🔄 Processing user ${index + 1}/${userMap.size}:`, {
        id: userData.profile.id.substring(0, 8),
        hasProfile: userData.hasProfile,
        orderCount: userData.orders.length,
        source: userData.source
      });
      
      const customer = processCustomerData(userData);
      
      DebugUtils.log("CustomerService", `✅ Processed customer ${index + 1}:`, {
        id: customer.id.substring(0, 8),
        name: customer.name,
        email: customer.email,
        phone: customer.phone || 'No phone',
        orders: customer.totalOrders,
        spent: customer.totalSpent,
        status: customer.status
      });
      
      return customer;
    });

    // Sort customers by join date (newest first)
    customers.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

    DebugUtils.log("CustomerService", `🎯 Final results: ${customers.length} customers processed successfully`);
    DebugUtils.table("CustomerService", "Final customers summary:", customers.slice(0, 5).map(c => ({
      id: c.id.substring(0, 8),
      name: c.name,
      email: c.email,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent
    })));

    return customers;

  } catch (error) {
    DebugUtils.error("CustomerService", "Critical error in customer data fetch", error);
    throw error;
  }
};
