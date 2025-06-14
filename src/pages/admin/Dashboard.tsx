
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentOrders: [],
    salesData: [],
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Fetch customers count
      const { count: customersCount, error: customersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (customersError) throw customersError;

      // Fetch sales metrics
      const { data: salesMetrics, error: salesError } = await supabase
        .from('sales_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (salesError) throw salesError;

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const recentOrders = orders?.slice(0, 5) || [];
      
      // Transform sales data for chart
      const salesData = (salesMetrics || []).map(item => ({
        date: new Date(item.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(item.total_revenue || 0),
        orders: item.orders_count || 0
      })).reverse();

      setStats({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalCustomers: customersCount || 0,
        totalProducts: productsCount || 0,
        recentOrders,
        salesData,
        pendingOrders
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Orders",
      value: stats.totalOrders.toString(),
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      change: "+15.3%",
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Products",
      value: stats.totalProducts.toString(),
      change: "-2.4%",
      trend: "down",
      icon: Package,
      color: "text-orange-600"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={stats.salesData}
          type="line"
          title="Revenue Trend (Last 7 Days)"
          dataKey="revenue"
          xAxisKey="date"
          color="#2563eb"
        />
        
        <AnalyticsChart
          data={stats.salesData}
          type="bar"
          title="Orders Trend (Last 7 Days)"
          dataKey="orders"
          xAxisKey="date"
          color="#60a5fa"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
              <p className="text-gray-600 mt-2">Orders awaiting processing</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Order Value</span>
                <span className="font-semibold">
                  ₹{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orders Today</span>
                <span className="font-semibold">
                  {stats.recentOrders.filter((order: any) => 
                    new Date(order.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-semibold">3.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
