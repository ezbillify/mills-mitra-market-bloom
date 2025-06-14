
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinDate: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  };
}

export const useCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
        console.log('🔄 Manual refresh triggered for customers data...');
      } else {
        setLoading(true);
      }

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
      const processedCustomers: Customer[] = Array.from(userMap.values()).map(userData => {
        const { profile, orders, hasProfile } = userData;
        
        console.log(`🔄 Processing user: ${profile.id.substring(0, 8)}, hasProfile: ${hasProfile}`);

        // Calculate order statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
        
        // Generate customer name
        let customerName = 'Unknown Customer';
        
        if (profile.first_name || profile.last_name) {
          const firstName = profile.first_name?.trim() || '';
          const lastName = profile.last_name?.trim() || '';
          customerName = `${firstName} ${lastName}`.trim();
        } else if (profile.email) {
          const emailPrefix = profile.email.split('@')[0];
          customerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        } else {
          customerName = `Customer ${profile.id.substring(0, 8)}`;
        }

        const customer: Customer = {
          id: profile.id,
          name: customerName,
          email: profile.email || 'No email provided',
          phone: profile.phone || '',
          totalOrders,
          totalSpent,
          status: (totalOrders > 0 ? 'active' : 'inactive') as 'active' | 'inactive',
          joinDate: profile.created_at,
          profile: hasProfile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            address: profile.address,
            city: profile.city,
            postal_code: profile.postal_code,
            country: profile.country
          } : undefined
        };

        console.log('🎯 Generated customer:', {
          id: customer.id.substring(0, 8),
          name: customer.name,
          email: customer.email,
          totalOrders: customer.totalOrders,
          hasProfile
        });

        return customer;
      });

      console.log('🏁 === FINAL CUSTOMERS LIST ===');
      console.log(`📊 Total customers: ${processedCustomers.length}`);
      console.log('👥 Customer details:', processedCustomers.map(c => ({
        name: c.name,
        email: c.email,
        orders: c.totalOrders
      })));
      
      setCustomers(processedCustomers);

      if (showRefreshToast) {
        toast({
          title: "✅ Data Refreshed",
          description: `Found ${processedCustomers.length} customers (including users with orders)`,
        });
      }
    } catch (error) {
      console.error('💥 === ERROR IN CUSTOMER FETCH ===', error);
      toast({
        title: "❌ Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCustomers();

    // Set up real-time subscriptions with retry logic
    let profilesChannel: any;
    let ordersChannel: any;
    let retryTimeout: NodeJS.Timeout;

    const setupSubscriptions = () => {
      console.log('📡 Setting up real-time subscriptions...');
      
      // Profiles subscription
      profilesChannel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('🔴 REAL-TIME: Profile change detected!', payload.eventType);
            fetchCustomers();
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Profiles subscription status:', status);
          if (err) console.error('Profiles subscription error:', err);
          
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('🔄 Retrying profiles subscription in 5 seconds...');
            retryTimeout = setTimeout(setupSubscriptions, 5000);
          }
        });

      // Orders subscription
      ordersChannel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('🟡 REAL-TIME: Order change detected!', payload.eventType);
            fetchCustomers();
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Orders subscription status:', status);
          if (err) console.error('Orders subscription error:', err);
          
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('🔄 Retrying orders subscription in 5 seconds...');
            retryTimeout = setTimeout(setupSubscriptions, 5000);
          }
        });
    };

    setupSubscriptions();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up subscriptions...');
      if (retryTimeout) clearTimeout(retryTimeout);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, []);

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered by user...');
    fetchCustomers(true);
  };

  return {
    customers,
    loading,
    refreshing,
    fetchCustomers,
    handleRefresh
  };
};
