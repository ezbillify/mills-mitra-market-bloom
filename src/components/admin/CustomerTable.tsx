import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Phone, User, Wifi, Clock, RefreshCw } from "lucide-react";

// Import your Supabase client - adjust the import path based on your project structure
// import { supabase } from '@/lib/supabase';
// import { createClient } from '@supabase/supabase-js';

// For development, you can create the client here:
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

interface Customer {
  id: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinDate: string;
  lastLoginAt?: string;
  profile?: {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface CustomerTableProps {
  customers?: Customer[]; // Optional prop to pass customers directly
  onViewCustomer: (customer: Customer) => void;
  refreshTrigger?: number;
  supabaseClient?: any; // Pass Supabase client as prop
}

const CustomerTable = ({ 
  customers: propCustomers, 
  onViewCustomer, 
  refreshTrigger,
  supabaseClient 
}: CustomerTableProps) => {
  const [customers, setCustomers] = useState<Customer[]>(propCustomers || []);
  const [loading, setLoading] = useState(!propCustomers);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    if (!supabaseClient) {
      setError('Supabase client not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Method 1: Direct query to profiles table (recommended)
      // This assumes your profiles table has user relationship
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select(`
          *,
          users!inner (
            id,
            email,
            phone,
            created_at,
            last_sign_in_at
          )
        `);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        
        // Fallback: Try to fetch from auth.users view if available
        const { data: users, error: usersError } = await supabaseClient
          .from('users') // This might be a view of auth.users
          .select(`
            id,
            email,
            phone,
            created_at,
            last_sign_in_at
          `);

        if (usersError) {
          setError('Failed to fetch customer data');
          return;
        }

        // Process users without profiles
        const customersWithoutProfiles = await Promise.all(
          (users || []).map(async (user: any) => {
            const { data: orderStats } = await supabaseClient
              .from('orders')
              .select('total_amount')
              .eq('user_id', user.id);

            const totalOrders = orderStats?.length || 0;
            const totalSpent = orderStats?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

            const lastLoginAt = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const status = lastLoginAt && lastLoginAt > thirtyDaysAgo ? 'active' : 'inactive';

            return {
              id: user.id,
              email: user.email || '',
              phone: user.phone || '',
              totalOrders,
              totalSpent,
              status,
              joinDate: user.created_at,
              lastLoginAt: user.last_sign_in_at,
              profile: null
            } as Customer;
          })
        );

        setCustomers(customersWithoutProfiles);
        setLastUpdated(new Date());
        return;
      }

      // Process profiles with user data
      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const user = profile.users;
          
          // Get order count and total spent
          const { data: orderStats } = await supabaseClient
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id);

          const totalOrders = orderStats?.length || 0;
          const totalSpent = orderStats?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

          // Determine status based on recent activity
          const lastLoginAt = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const status = lastLoginAt && lastLoginAt > thirtyDaysAgo ? 'active' : 'inactive';

          return {
            id: user.id,
            email: user.email || '',
            phone: user.phone || profile.phone || '',
            totalOrders,
            totalSpent,
            status,
            joinDate: user.created_at,
            lastLoginAt: user.last_sign_in_at,
            profile: {
              id: profile.id,
              user_id: profile.user_id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              address: profile.address,
              city: profile.city,
              postal_code: profile.postal_code,
              country: profile.country,
              phone: profile.phone,
              created_at: profile.created_at,
              updated_at: profile.updated_at
            }
          } as Customer;
        })
      );

      setCustomers(customersWithStats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error in fetchCustomers:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh trigger
  useEffect(() => {
    if (!propCustomers && supabaseClient) {
      fetchCustomers();
    }
  }, [refreshTrigger, supabaseClient]);

  // Set up real-time subscription
  useEffect(() => {
    if (!supabaseClient) return;

    const subscription = supabaseClient
      .channel('customer-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          console.log('Profile change detected:', payload);
          if (!propCustomers) {
            fetchCustomers();
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          console.log('Order change detected:', payload);
          if (!propCustomers) {
            fetchCustomers();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, propCustomers]);

  // Update customers when prop changes
  useEffect(() => {
    if (propCustomers) {
      setCustomers(propCustomers);
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, [propCustomers]);

  const getStatusBadge = (status: 'active' | 'inactive') => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
          {status}
        </div>
      </Badge>
    );
  };

  const getCustomerName = (customer: Customer): string => {
    const profile = customer.profile;
    
    if (profile?.first_name || profile?.last_name) {
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fallback to email username if no profile names
    if (customer.email) {
      const emailUsername = customer.email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    
    return `Customer ${customer.id.substring(0, 8)}`;
  };

  const getCustomerInitials = (customer: Customer): string => {
    const name = getCustomerName(customer);
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading customers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <p className="font-medium">Error loading customers</p>
          <p className="text-sm">{error}</p>
        </div>
        {supabaseClient && (
          <Button onClick={fetchCustomers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">No customers found</p>
          <p className="text-sm">New customers will appear here automatically</p>
        </div>
        {supabaseClient && (
          <Button onClick={fetchCustomers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            {supabaseClient ? 'Real-time Updates Active' : 'Static Data View'}
          </span>
          {supabaseClient && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">
              {customers.length} customers • Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          {supabaseClient && (
            <Button 
              onClick={fetchCustomers} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      {/* Customer Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const customerName = getCustomerName(customer);
              const initials = getCustomerInitials(customer);
              
              return (
                <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{initials}</span>
                      </div>
                      <div>
                        <div className="font-medium">{customerName}</div>
                        <div className="text-sm text-gray-500">ID: {customer.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span className="truncate max-w-[200px]">{customer.email || 'No email'}</span>
                      </div>
                      {customer.phone && (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-500" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{customer.totalOrders}</span>
                      <span className="text-xs text-gray-500">
                        {customer.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{customer.totalSpent.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(customer.joinDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewCustomer(customer)}
                        className="hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-green-50"
                        title="Send Email"
                        onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {customer.phone && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-yellow-50"
                          title="Call Customer"
                          onClick={() => window.open(`tel:${customer.phone}`, '_blank')}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerTable;