
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, ShoppingCart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [salesData, setSalesData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [visitsData, setVisitsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch sales metrics
      const { data: sales, error: salesError } = await supabase
        .from('sales_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (salesError) throw salesError;

      // Transform sales data for charts
      const formattedSales = (sales || []).map(item => ({
        date: new Date(item.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(item.total_revenue || 0),
        orders: item.orders_count || 0,
        customers: item.unique_customers || 0
      })).reverse();

      setSalesData(formattedSales);

      // Fetch analytics events
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics')
        .select('event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (analyticsError) throw analyticsError;

      // Process analytics data
      const eventCounts = (analytics || []).reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});

      const analyticsFormatted = Object.entries(eventCounts).map(([name, count]) => ({
        name: name.replace('_', ' '),
        value: count
      }));

      setAnalyticsData(analyticsFormatted);

      // Fetch website visits
      const { data: visits, error: visitsError } = await supabase
        .from('website_visits')
        .select('page_url, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (visitsError) throw visitsError;

      // Process visits data
      const pageCounts = (visits || []).reduce((acc: any, visit) => {
        const page = visit.page_url === '/' ? 'Home' : visit.page_url.replace('/', '');
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {});

      const visitsFormatted = Object.entries(pageCounts).map(([name, count]) => ({
        name,
        visits: count
      }));

      setVisitsData(visitsFormatted);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${salesData.reduce((sum: number, item: any) => sum + item.revenue, 0).toLocaleString()}`,
      change: "+12.5%",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: salesData.reduce((sum: number, item: any) => sum + item.orders, 0).toString(),
      change: "+8.2%",
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Unique Customers",
      value: Math.max(...salesData.map((item: any) => item.customers), 0).toString(),
      change: "+15.3%",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Page Views",
      value: visitsData.reduce((sum: number, item: any) => sum + item.visits, 0).toString(),
      change: "+18.7%",
      icon: Eye,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your business performance and insights</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.color}`}>
                {stat.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={salesData}
          type="line"
          title="Revenue Trend"
          dataKey="revenue"
          xAxisKey="date"
          color="#2563eb"
        />
        
        <AnalyticsChart
          data={salesData}
          type="bar"
          title="Orders Over Time"
          dataKey="orders"
          xAxisKey="date"
          color="#60a5fa"
        />
        
        <AnalyticsChart
          data={analyticsData}
          type="pie"
          title="Event Distribution"
          dataKey="value"
        />
        
        <AnalyticsChart
          data={visitsData}
          type="bar"
          title="Page Visits"
          dataKey="visits"
          xAxisKey="name"
          color="#34d399"
        />
      </div>
    </div>
  );
};

export default AdminAnalytics;
