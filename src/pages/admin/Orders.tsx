
import OrdersStats from "@/components/admin/OrdersStats";
import OrdersTable from "@/components/admin/OrdersTable";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";
import OrdersHeader from "@/components/admin/OrdersHeader";
import OrdersLoading from "@/components/admin/OrdersLoading";
import { useOrders } from "@/hooks/useOrders";
import { useState } from "react";

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
      <OrdersStats orders={orders} />
      <OrdersTable
        orders={orders}
        onUpdateStatus={updateOrderStatus}
        onViewDetails={handleViewDetails}
      />
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
