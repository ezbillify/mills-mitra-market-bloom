import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Mail, Phone, User, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CustomerDetailsDialog from "@/components/admin/CustomerDetailsDialog";

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

const AdminCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCustomers = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
        console.log('Manual refresh triggered for customers data...');
      } else {
        setLoading(true);
      }

      console.log('Fetching comprehensive customer data...');
      
      // Get all auth users first (this requires admin access, but let's try profiles approach)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length || 0, profiles);

      // Fetch all orders to get order statistics
      const { data: orderStats, error: orderStatsError } = await supabase
        .from('orders')
        .select('user_id, total, status');

      if (orderStatsError) {
        console.error('Error fetching order stats:', orderStatsError);
      }

      console.log('Order stats fetched:', orderStats?.length || 0, orderStats);

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

      // Create customers from profiles
      const customersFromProfiles: Customer[] = (profiles || []).map(profile => {
        const userOrders = userOrdersMap.get(profile.id) || { count: 0, total: 0 };
        
        const customerName = profile.first_name || profile.last_name
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          : profile.email 
          ? profile.email.split('@')[0]
          : `User ${profile.id.substring(0, 8)}`;
        
        return {
          id: profile.id,
          name: customerName,
          email: profile.email || 'No email',
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

      // Get users with orders but no profiles
      const profileUserIds = new Set(profiles?.map(p => p.id) || []);
      const orderUserIds = [...new Set(orderStats?.map(order => order.user_id) || [])];
      const missingProfileUserIds = orderUserIds.filter(userId => !profileUserIds.has(userId));

      console.log('Users with orders but no profiles:', missingProfileUserIds.length, missingProfileUserIds);

      // Create customers for users with orders but no profiles
      const customersFromOrders: Customer[] = missingProfileUserIds.map(userId => {
        const userOrders = userOrdersMap.get(userId) || { count: 0, total: 0 };
        
        return {
          id: userId,
          name: `Customer ${userId.substring(0, 8)}`,
          email: 'Profile pending',
          phone: '',
          totalOrders: userOrders.count,
          totalSpent: userOrders.total,
          status: 'active' as 'active' | 'inactive',
          joinDate: new Date().toISOString(),
          profile: undefined
        };
      });

      const allCustomers = [...customersFromProfiles, ...customersFromOrders];
      
      console.log('Final customer count:', allCustomers.length);
      console.log('Customers from profiles:', customersFromProfiles.length);
      console.log('Customers from orders only:', customersFromOrders.length);
      console.log('All customers data:', allCustomers);
      
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

  const handleRefresh = () => {
    fetchCustomers(true);
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

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000) {
      return <Badge variant="default">VIP</Badge>;
    } else if (totalSpent >= 500) {
      return <Badge variant="secondary">Premium</Badge>;
    }
    return <Badge variant="outline">Regular</Badge>;
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Newsletter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.totalSpent >= 1000).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{customers.reduce((sum, customer) => sum + customer.totalSpent, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No customers found. New customers will appear here after they sign up.</p>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone || 'Not provided'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>₹{customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>{getCustomerTier(customer.totalSpent)}</TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>{new Date(customer.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCustomerUpdated={fetchCustomers}
      />
    </div>
  );
};

export default AdminCustomers;
