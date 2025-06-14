
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

      console.log('🚀 === STARTING REAL-TIME CUSTOMER FETCH ===');
      
      // Get all profiles with optimized query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('✅ === PROFILES FETCHED (REAL-TIME) ===');
      console.log(`📊 Profiles count: ${profiles?.length || 0}`);
      console.log('🔍 Sample profiles:', profiles?.slice(0, 2));

      // Fetch all orders with optimized query
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total, status')
        .neq('status', 'cancelled');

      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
      }

      console.log('✅ === ORDERS FETCHED (REAL-TIME) ===');
      console.log(`📊 Orders count: ${orders?.length || 0}`);
      console.log('🔍 Sample orders:', orders?.slice(0, 2));

      // Process order statistics with better performance
      const orderStatsMap = new Map();
      orders?.forEach(order => {
        const existing = orderStatsMap.get(order.user_id) || { count: 0, total: 0 };
        orderStatsMap.set(order.user_id, {
          count: existing.count + 1,
          total: existing.total + Number(order.total || 0)
        });
      });

      console.log('⚡ === ORDER STATS PROCESSED (REAL-TIME) ===');
      console.log(`📈 Order stats map size: ${orderStatsMap.size}`);

      // Process profiles into customers with real-time updates
      const processedCustomers: Customer[] = (profiles || []).map(profile => {
        console.log(`🔄 Processing profile (REAL-TIME):`, {
          id: profile.id.substring(0, 8),
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email
        });

        const orderStats = orderStatsMap.get(profile.id) || { count: 0, total: 0 };
        
        // Generate customer name with enhanced logic
        let customerName = 'Unknown Customer';
        
        if (profile.first_name || profile.last_name) {
          const firstName = profile.first_name?.trim() || '';
          const lastName = profile.last_name?.trim() || '';
          customerName = `${firstName} ${lastName}`.trim();
          console.log(`✅ Name from profile: "${customerName}"`);
        } else if (profile.email) {
          const emailPrefix = profile.email.split('@')[0];
          customerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          console.log(`📧 Name from email: "${customerName}"`);
        } else {
          customerName = `Customer ${profile.id.substring(0, 8)}`;
          console.log(`🔤 Default name: "${customerName}"`);
        }

        const customer: Customer = {
          id: profile.id,
          name: customerName,
          email: profile.email || 'No email provided',
          phone: profile.phone || '',
          totalOrders: orderStats.count,
          totalSpent: orderStats.total,
          status: (orderStats.count > 0 ? 'active' : 'inactive') as 'active' | 'inactive',
          joinDate: profile.created_at,
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            address: profile.address,
            city: profile.city,
            postal_code: profile.postal_code,
            country: profile.country
          }
        };

        console.log('🎯 Generated customer (REAL-TIME):', {
          id: customer.id.substring(0, 8),
          name: customer.name,
          email: customer.email,
          totalOrders: customer.totalOrders,
          status: customer.status
        });

        return customer;
      });

      console.log('🏁 === FINAL CUSTOMERS (REAL-TIME UPDATE) ===');
      console.log(`📊 Total customers: ${processedCustomers.length}`);
      console.log('👥 Customer names:', processedCustomers.map(c => c.name));
      
      setCustomers(processedCustomers);

      if (showRefreshToast) {
        toast({
          title: "✅ Real-time Update",
          description: `Refreshed customer data - found ${processedCustomers.length} customers`,
        });
      }
    } catch (error) {
      console.error('💥 === ERROR IN REAL-TIME FETCH CUSTOMERS ===', error);
      toast({
        title: "❌ Error",
        description: "Failed to load customers in real-time",
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

    // Enhanced real-time subscription for profiles
    const profilesChannel = supabase
      .channel('profiles-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔴 REAL-TIME: Profiles updated!', payload.eventType, payload.new || payload.old);
          // Immediate refresh for real-time updates
          fetchCustomers();
        }
      )
      .subscribe((status) => {
        console.log('📡 Profiles real-time subscription status:', status);
      });

    // Enhanced real-time subscription for orders
    const ordersChannel = supabase
      .channel('orders-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🟡 REAL-TIME: Orders updated!', payload.eventType, payload.new || payload.old);
          // Immediate refresh for real-time updates
          fetchCustomers();
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders real-time subscription status:', status);
      });

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ordersChannel);
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
