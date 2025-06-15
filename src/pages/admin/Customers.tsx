
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, Bug, BugOff } from "lucide-react";
import CustomerDetailsDialog from "@/components/admin/CustomerDetailsDialog";
import CustomerStats from "@/components/admin/CustomerStats";
import CustomerTable from "@/components/admin/CustomerTable";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer } from "@/types/customer";
import { DebugUtils } from "@/utils/debugUtils";

const AdminCustomers = () => {
  const { customers, loading, refreshing, fetchCustomers, handleRefresh } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(DebugUtils.isDebugEnabled());

  const handleViewCustomer = (customer: Customer) => {
    DebugUtils.log("AdminCustomers", "📝 Opening customer details for:", customer.name);
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const toggleDebugMode = () => {
    if (debugMode) {
      DebugUtils.disableDebug();
      setDebugMode(false);
    } else {
      DebugUtils.enableDebug();
      setDebugMode(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  DebugUtils.log("AdminCustomers", "🎯 Rendering with customers:", customers.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <div className="flex gap-2">
          <Button 
            variant={debugMode ? "default" : "outline"}
            onClick={toggleDebugMode}
            className={debugMode ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {debugMode ? <BugOff className="h-4 w-4 mr-2" /> : <Bug className="h-4 w-4 mr-2" />}
            {debugMode ? 'Disable Debug' : 'Enable Debug'}
          </Button>
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

      {debugMode && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Mode Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-700 space-y-2">
              <p>🐛 Debug logging is enabled. Check the browser console for detailed information.</p>
              <p>📊 Customers loaded: {customers.length}</p>
              <p>💡 Open browser console (F12) to see detailed logs</p>
              <div className="mt-3 p-2 bg-red-100 rounded text-xs">
                <strong>Console Commands:</strong><br />
                • <code>window.enableDebug()</code> - Enable debug mode<br />
                • <code>window.disableDebug()</code> - Disable debug mode
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CustomerStats customers={customers} />

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
            <CustomerTable 
              customers={customers} 
              onViewCustomer={handleViewCustomer} 
            />
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
