
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, Package, DollarSign, TrendingUp, TrendingDown, Clock, Eye } from "lucide-react";
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
    const ordersChannel = supabase.channel('dashboard-orders').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, () => {
      fetchDashboardData();
    }).subscribe();

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
        date: new Date(item.date || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
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
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      title: "Orders",
      value: stats.totalOrders.toString(),
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      change: "+15.3%",
      trend: "up",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      title: "Products",
      value: stats.totalProducts.toString(),
      change: "-2.4%",
      trend: "down",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-golden-millet border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-golden-millet to-olive-leaf rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-4xl font-bold mb-2 text-green-950">Welcome back! 👋</h2>
        <p className="text-lg text-emerald-500">
          Here's what's happening with your millet marketplace today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-bl-full opacity-10`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-earth-brown">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warm-brown mb-1">{stat.value}</div>
              <div className="flex items-center text-sm">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-emerald-600" : "text-red-600"}>
                  {stat.change}
                </span>
                <span className="ml-1 text-earth-brown/70">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-warm-cream to-warm-beige/50">
            <CardTitle className="text-warm-brown flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <AnalyticsChart 
                data={stats.salesData} 
                type="line" 
                title="" 
                dataKey="revenue" 
                xAxisKey="date" 
                color="#2563eb" 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-warm-cream to-warm-beige/50">
            <CardTitle className="text-warm-brown flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <AnalyticsChart 
                data={stats.salesData} 
                type="bar" 
                title="" 
                dataKey="orders" 
                xAxisKey="date" 
                color="#60a5fa" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-warm-cream to-warm-beige/50">
            <CardTitle className="flex items-center gap-2 text-warm-brown">
              <Clock className="h-5 w-5" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-4xl font-bold text-orange-600 mb-2">{stats.pendingOrders}</div>
              <p className="text-earth-brown">Orders awaiting processing</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-warm-cream to-warm-beige/50">
            <CardTitle className="flex items-center gap-2 text-warm-brown">
              <Eye className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center p-4 bg-warm-beige/20 rounded-lg">
                <span className="font-medium text-earth-brown">Avg Order Value</span>
                <span className="font-bold text-golden-millet text-lg">
                  ₹{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-warm-beige/20 rounded-lg">
                <span className="font-medium text-earth-brown">Orders Today</span>
                <span className="font-bold text-olive-leaf text-lg">
                  {stats.recentOrders.filter((order: any) => 
                    new Date(order.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-warm-beige/20 rounded-lg">
                <span className="font-medium text-earth-brown">Conversion Rate</span>
                <span className="font-bold text-golden-millet text-lg">3.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
