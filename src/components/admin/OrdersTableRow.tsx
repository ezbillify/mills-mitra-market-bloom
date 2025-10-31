import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Truck, User, UserCheck, IndianRupee, CreditCard, Banknote } from "lucide-react";
import { Order } from "@/types/order";
import { getStatusBadgeConfig, getShippingMethodInfo, getCustomerDisplayInfo } from "@/utils/orderDisplayUtils";

interface OrdersTableRowProps {
  order: Order;
  onViewDetails: (orderId: string) => void;
}

const OrdersTableRow = ({ order, onViewDetails }: OrdersTableRowProps) => {
  const customerInfo = getCustomerDisplayInfo(order);
  const shippingInfo = getShippingMethodInfo(order);
  const statusConfig = getStatusBadgeConfig(order.status);

  // Payment status helper function with type checking
  const getPaymentStatusBadge = () => {
    // Handle legacy orders or missing payment_type
    if (!order.payment_type || order.payment_type === 'cod') {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
          <Banknote className="h-3 w-3 mr-1" />
          COD
        </Badge>
      );
    }

    if (order.payment_type === 'phonepe') {
      // Check payment_status field if available
      if (order.payment_status === 'completed') {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CreditCard className="h-3 w-3 mr-1" />
            PAID
          </Badge>
        );
      } else if (order.payment_status === 'failed') {
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            <CreditCard className="h-3 w-3 mr-1" />
            FAILED
          </Badge>
        );
      } else {
        // Default to pending for online payments without status
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <CreditCard className="h-3 w-3 mr-1" />
            PENDING
          </Badge>
        );
      }
    }

    // Fallback for unknown payment types
    return (
      <Badge variant="outline" className="text-gray-600">
        <CreditCard className="h-3 w-3 mr-1" />
        UNKNOWN
      </Badge>
    );
  };

  return (
    <TableRow className="border-gray-200 hover:bg-gray-50 transition-colors">
      <TableCell className="font-mono text-sm text-royal-green bg-gray-50 rounded-md m-1 px-3 py-2">
        #{order.id.slice(0, 8)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {customerInfo.hasProfile ? (
            <UserCheck className="h-4 w-4 text-green-600" />
          ) : (
            <User className="h-4 w-4 text-orange-600" />
          )}
          <div className="font-medium text-gray-900">{customerInfo.name}</div>
        </div>
      </TableCell>
      <TableCell className="text-gray-600">{customerInfo.email}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium text-gray-900">{shippingInfo.name}</div>
            {shippingInfo.price > 0 && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                {shippingInfo.price.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-bold text-royal-green text-lg flex items-center gap-1">
          <IndianRupee className="h-4 w-4" />
          {Number(order.total).toFixed(2)}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusConfig.variant} className={statusConfig.className}>
          {order.status.replace("_", " ").toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell>
        {getPaymentStatusBadge()}
      </TableCell>
      <TableCell className="text-gray-600">
        {new Date(order.created_at).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(order.id)}
          className="border-royal-green/30 text-royal-green hover:bg-royal-green hover:text-white transition-all duration-200 shadow-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default OrdersTableRow;
