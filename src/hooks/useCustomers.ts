
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
        console.log('Manual refresh triggered for customers data...');
      } else {
        setLoading(true);
      }

      console.log('=== STARTING CUSTOMER FETCH ===');
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('=== PROFILES FETCHED ===');
      console.log('Profiles count:', profiles?.length || 0);
      console.log('Sample profiles:', profiles?.slice(0, 3));

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total, status');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      console.log('=== ORDERS FETCHED ===');
      console.log('Orders count:', orders?.length || 0);
      console.log('Sample orders:', orders?.slice(0, 3));

      // Process order statistics
      const orderStatsMap = new Map();
      orders?.forEach(order => {
        if (order.status !== 'cancelled') {
          const existing = orderStatsMap.get(order.user_id) || { count: 0, total: 0 };
          orderStatsMap.set(order.user_id, {
            count: existing.count + 1,
            total: existing.total + Number(order.total || 0)
          });
        }
      });

      console.log('=== ORDER STATS PROCESSED ===');
      console.log('Order stats map size:', orderStatsMap.size);

      // Process profiles into customers
      const processedCustomers: Customer[] = (profiles || []).map(profile => {
        console.log('Processing profile:', {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email
        });

        const orderStats = orderStatsMap.get(profile.id) || { count: 0, total: 0 };
        
        // Generate customer name with detailed logging
        let customerName = 'Unknown Customer';
        
        if (profile.first_name || profile.last_name) {
          const firstName = profile.first_name?.trim() || '';
          const lastName = profile.last_name?.trim() || '';
          customerName = `${firstName} ${lastName}`.trim();
          console.log(`Name from profile names: "${customerName}"`);
        } else if (profile.email) {
          const emailPrefix = profile.email.split('@')[0];
          customerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          console.log(`Name from email: "${customerName}"`);
        } else {
          customerName = `Customer ${profile.id.substring(0, 8)}`;
          console.log(`Default name: "${customerName}"`);
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

        console.log('Generated customer:', {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          totalOrders: customer.totalOrders
        });

        return customer;
      });

      console.log('=== FINAL CUSTOMERS ===');
      console.log('Total customers:', processedCustomers.length);
      console.log('Customer names:', processedCustomers.map(c => c.name));
      
      setCustomers(processedCustomers);

      if (showRefreshToast) {
        toast({
          title: "Success",
          description: `Refreshed customer data - found ${processedCustomers.length} customers`,
        });
      }
    } catch (error) {
      console.error('=== ERROR IN FETCH CUSTOMERS ===', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    // Set up real-time subscription for profiles
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles updated, refreshing data...', payload);
          fetchCustomers();
        }
      )
      .subscribe();

    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Orders updated, refreshing data...', payload);
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const handleRefresh = () => {
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
