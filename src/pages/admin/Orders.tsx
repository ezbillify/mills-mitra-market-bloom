
import OrdersStats from "@/components/admin/OrdersStats";
import OrdersTable from "@/components/admin/OrdersTable";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";
import OrdersHeader from "@/components/admin/OrdersHeader";
import OrdersLoading from "@/components/admin/OrdersLoading";
import { useOrders } from "@/hooks/useOrders";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminOrders = () => {
  const { orders, loading, fetchOrders, updateOrderStatus } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewDetails = (orderId: string) => {
    console.log("Opening order details for:", orderId);
    setSelectedOrderId(orderId);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return <OrdersLoading />;
  }

  return (
    <div className="space-y-6">
      <OrdersHeader onRefresh={fetchOrders} />
      
      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Orders Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found. Orders will appear here once customers start placing them.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <OrdersStats orders={orders} />
          <OrdersTable
            orders={orders}
            onUpdateStatus={updateOrderStatus}
            onViewDetails={handleViewDetails}
          />
        </>
      )}
      
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdateStatus={updateOrderStatus}
      />
    </div>
  );
};

export default AdminOrders;
