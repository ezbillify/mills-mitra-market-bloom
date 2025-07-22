import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AnalyticsChart from "@/components/admin/AnalyticsChart";
import { SalesExporter } from "@/utils/salesExporter";
import { GSTR1Exporter } from "@/utils/gstr1Exporter";

const Analytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch sales metrics
      const { data: sales } = await supabase
        .from("sales_metrics")
        .select("*")
        .order("date", { ascending: true });

      if (sales) {
        setSalesData(sales.map(item => ({
          name: new Date(item.date).toLocaleDateString(),
          orders: item.orders_count,
          revenue: Number(item.total_revenue),
          customers: item.unique_customers,
          avgOrder: Number(item.avg_order_value)
        })));
      }

      // Fetch order status distribution
      const { data: orders } = await supabase
        .from("orders")
        .select("status");

      if (orders) {
        const statusCounts = orders.reduce((acc: any, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});

        setRevenueData(Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count
        })));
      }

      // Fetch customer registration data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (profiles) {
        const customersByMonth = profiles.reduce((acc: any, profile) => {
          const month = new Date(profile.created_at).toLocaleDateString('default', { month: 'short', year: 'numeric' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        setCustomerData(Object.entries(customersByMonth).map(([month, count]) => ({
          name: month,
          customers: count
        })));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = await SalesExporter.fetchSalesData(startDate, endDate);
      const filename = `sales-data-${startDate || 'all'}-to-${endDate || 'now'}.csv`;
      SalesExporter.exportToCSV(data, filename);
      
      toast({
        title: "Export Successful",
        description: `Sales data exported to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const data = await SalesExporter.fetchSalesData(startDate, endDate);
      const filename = `sales-data-${startDate || 'all'}-to-${endDate || 'now'}.xlsx`;
      SalesExporter.exportToExcel(data, filename);
      
      toast({
        title: "Export Successful",
        description: `Sales data exported to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGSTR1CSV = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates for GSTR-1 export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const filename = `gstr1-${startDate}-to-${endDate}.csv`;
      const summary = await GSTR1Exporter.exportGSTR1CSV(startDate, endDate, filename);
      
      toast({
        title: "GSTR-1 Export Successful",
        description: `GSTR-1 data exported: ${summary.invoiceCount} invoices, ₹${summary.totalInvoiceValue.toFixed(2)} total value`,
      });
    } catch (error: any) {
      toast({
        title: "GSTR-1 Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGSTR1Excel = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates for GSTR-1 export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const filename = `gstr1-${startDate}-to-${endDate}.xlsx`;
      const summary = await GSTR1Exporter.exportGSTR1Excel(startDate, endDate, filename);
      
      toast({
        title: "GSTR-1 Export Successful",
        description: `GSTR-1 data exported: ${summary.invoiceCount} invoices, ₹${summary.totalInvoiceValue.toFixed(2)} total value`,
      });
    } catch (error: any) {
      toast({
        title: "GSTR-1 Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

      {/* Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Sales Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (Optional)</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export as CSV"}
              </Button>
              
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export as Excel"}
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              Export includes: Order ID, Date, Customer details, Items, HSN codes, Tax breakdown, Total amount, Status, and Shipping address
            </p>
          </CardContent>
        </Card>

        {/* GSTR-1 Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              GSTR-1 Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstr1-start-date">Start Date (Required)</Label>
                <Input
                  id="gstr1-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstr1-end-date">End Date (Required)</Label>
                <Input
                  id="gstr1-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleExportGSTR1CSV}
                disabled={isExporting || !startDate || !endDate}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <FileText className="h-4 w-4" />
                {isExporting ? "Exporting..." : "GSTR-1 CSV"}
              </Button>
              
              <Button
                onClick={handleExportGSTR1Excel}
                disabled={isExporting || !startDate || !endDate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isExporting ? "Exporting..." : "GSTR-1 Excel"}
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              GSTR-1 format includes: HSN codes, GST breakdowns (CGST/SGST/IGST), taxable values, and place of supply
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={salesData}
          type="line"
          title="Revenue Over Time"
          dataKey="revenue"
          xAxisKey="name"
          color="#2563eb"
        />
        
        <AnalyticsChart
          data={salesData}
          type="bar"
          title="Orders Over Time"
          dataKey="orders"
          xAxisKey="name"
          color="#10b981"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={revenueData}
          type="pie"
          title="Order Status Distribution"
          dataKey="value"
        />
        
        <AnalyticsChart
          data={customerData}
          type="bar"
          title="Customer Registrations"
          dataKey="customers"
          xAxisKey="name"
          color="#f59e0b"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{salesData.reduce((acc: number, item: any) => acc + (item.revenue || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData.reduce((acc: number, item: any) => acc + (item.orders || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerData.reduce((acc: number, item: any) => acc + (item.customers || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{salesData.length > 0 
                ? (salesData.reduce((acc: number, item: any) => acc + (item.avgOrder || 0), 0) / salesData.length).toFixed(2)
                : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
