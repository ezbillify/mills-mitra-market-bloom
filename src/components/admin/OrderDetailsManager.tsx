
import { useState } from "react";
import OrderDetailsDialog from "./OrderDetailsDialog";

interface OrderDetailsManagerProps {
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

const OrderDetailsManager = ({ onUpdateStatus }: OrderDetailsManagerProps) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewDetails = (orderId: string) => {
    console.log("Opening order details for:", orderId);
    setSelectedOrderId(orderId);
    setDetailsDialogOpen(true);
  };

  return {
    handleViewDetails,
    dialogComponent: (
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdateStatus={onUpdateStatus}
      />
    ),
  };
};

export default OrderDetailsManager;
