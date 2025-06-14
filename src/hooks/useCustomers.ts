
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

      console.log('Fetching comprehensive customer data...');
      
      // Get all profiles with better data handling
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Raw profiles data:', profiles);

      // Fetch all orders to get order statistics
      const { data: orderStats, error: orderStatsError } = await supabase
        .from('orders')
        .select('user_id, total, status');

      if (orderStatsError) {
        console.error('Error fetching order stats:', orderStatsError);
      }

      console.log('Raw order stats:', orderStats);

      // Create a map of user orders for quick lookup
      const userOrdersMap = new Map<string, { count: number; total: number }>();
      orderStats?.forEach(order => {
        if (order.status !== 'cancelled') {
          const existing = userOrdersMap.get(order.user_id) || { count: 0, total: 0 };
          userOrdersMap.set(order.user_id, {
            count: existing.count + 1,
            total: existing.total + Number(order.total)
          });
        }
      });

      // Create customers from profiles with improved name logic
      const customersFromProfiles: Customer[] = (profiles || []).map(profile => {
        console.log('Processing profile:', profile);
        
        const userOrders = userOrdersMap.get(profile.id) || { count: 0, total: 0 };
        
        // Improved customer name generation with better fallbacks
        let customerName = 'Unknown Customer';
        
        if (profile.first_name && profile.last_name) {
          customerName = `${profile.first_name} ${profile.last_name}`.trim();
        } else if (profile.first_name) {
          customerName = profile.first_name.trim();
        } else if (profile.last_name) {
          customerName = profile.last_name.trim();
        } else if (profile.email) {
          // Extract name from email prefix
          const emailPrefix = profile.email.split('@')[0];
          customerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        } else {
          customerName = `User ${profile.id.substring(0, 8)}`;
        }
        
        console.log('Generated customer name:', customerName, 'from profile:', {
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email
        });
        
        return {
          id: profile.id,
          name: customerName,
          email: profile.email || 'No email provided',
          phone: profile.phone || '',
          totalOrders: userOrders.count,
          totalSpent: userOrders.total,
          status: (userOrders.count > 0 ? 'active' : 'inactive') as 'active' | 'inactive',
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
      });

      // Get users with orders but no profiles (edge case)
      const profileUserIds = new Set(profiles?.map(p => p.id) || []);
      const orderUserIds = [...new Set(orderStats?.map(order => order.user_id) || [])];
      const missingProfileUserIds = orderUserIds.filter(userId => !profileUserIds.has(userId));

      console.log('Users with orders but no profiles:', missingProfileUserIds.length);

      // Create customers for users with orders but no profiles
      const customersFromOrders: Customer[] = missingProfileUserIds.map(userId => {
        const userOrders = userOrdersMap.get(userId) || { count: 0, total: 0 };
        
        return {
          id: userId,
          name: `Customer ${userId.substring(0, 8)}`,
          email: 'Profile not found',
          phone: '',
          totalOrders: userOrders.count,
          totalSpent: userOrders.total,
          status: 'active' as 'active' | 'inactive',
          joinDate: new Date().toISOString(),
          profile: undefined
        };
      });

      const allCustomers = [...customersFromProfiles, ...customersFromOrders];
      
      console.log('Final processed customers:', allCustomers);
      console.log('Customer names:', allCustomers.map(c => ({ id: c.id, name: c.name, email: c.email })));
      
      setCustomers(allCustomers);

      if (showRefreshToast) {
        toast({
          title: "Success",
          description: `Refreshed customer data - found ${allCustomers.length} customers`,
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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
