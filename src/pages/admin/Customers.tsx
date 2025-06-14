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

      console.log('Fetching customer data from auth.users and profiles...');
      
      // First, get all auth users to ensure we don't miss anyone
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        // Fall back to profile-only approach if auth admin access fails
      }

      // Fetch ALL profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          postal_code,
          country,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length || 0, 'profiles found');

      // Fetch order statistics
      const { data: orderStats, error: orderStatsError } = await supabase
        .from('orders')
        .select('user_id, total, status');

      if (orderStatsError) {
        console.error('Error fetching order stats:', orderStatsError);
      }

      console.log('Order stats fetched:', orderStats?.length || 0, 'orders found');

      // Create a comprehensive user list
      const allUserIds = new Set<string>();
      
      // Add auth users if available
      if (authUsers?.users) {
        authUsers.users.forEach(user => allUserIds.add(user.id));
      }
      
      // Add profile users
      if (profiles) {
        profiles.forEach(profile => allUserIds.add(profile.id));
      }

      console.log('Total unique users found:', allUserIds.size);

      // Process the data to create customer objects
      const customersData: Customer[] = Array.from(allUserIds).map(userId => {
        // Find corresponding profile
        const profile = profiles?.find(p => p.id === userId);
        
        // Find corresponding auth user
        const authUser = authUsers?.users?.find(u => u.id === userId);
        
        // Calculate order stats
        const userOrders = orderStats?.filter(order => order.user_id === userId && order.status !== 'cancelled') || [];
        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total), 0);
        
        // Determine email with fallbacks
        let email = 'No email provided';
        if (profile?.email) {
          email = profile.email;
        } else if (authUser?.email) {
          email = authUser.email;
        }
        
        // Determine name with comprehensive fallbacks
        let customerName = 'Unknown User';
        if (profile?.first_name || profile?.last_name) {
          customerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        } else if (authUser?.user_metadata?.first_name || authUser?.user_metadata?.last_name) {
          customerName = `${authUser.user_metadata.first_name || ''} ${authUser.user_metadata.last_name || ''}`.trim();
        } else if (email && email !== 'No email provided') {
          customerName = email.split('@')[0];
        } else {
          customerName = `User ${userId.substring(0, 8)}`;
        }
        
        // Determine join date
        const joinDate = profile?.created_at || authUser?.created_at || new Date().toISOString();
        
        return {
          id: userId,
          name: customerName,
          email: email,
          phone: profile?.phone || '',
          totalOrders,
          totalSpent,
          status: totalOrders > 0 ? 'active' : 'inactive',
          joinDate: joinDate,
          profile: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            address: profile.address,
            city: profile.city,
            postal_code: profile.postal_code,
            country: profile.country
          } : null
        };
      }).filter(customer => customer.email !== 'No email provided' || customer.totalOrders > 0);

      console.log('Processed customers data:', customersData.length, 'customers');
      console.log('Sample customer:', customersData[0]);
      setCustomers(customersData);

      if (showRefreshToast) {
        toast({
          title: "Success",
          description: `Refreshed customer data - found ${customersData.length} customers`,
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
