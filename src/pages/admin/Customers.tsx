
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import CustomerDetailsDialog from "@/components/admin/CustomerDetailsDialog";
import CustomerStats from "@/components/admin/CustomerStats";
import CustomerTable from "@/components/admin/CustomerTable";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer } from "@/types/customer";

const AdminCustomers = () => {
  const { customers, loading, refreshing, fetchCustomers, handleRefresh } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewCustomer = (customer: Customer) => {
    console.log('📝 Opening customer details for:', customer.name);
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

  console.log('🎯 AdminCustomers rendering with customers:', customers.length);

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
