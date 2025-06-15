
import { Table, TableBody } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, User } from "lucide-react";
import { Order } from "@/types/order";
import { getCustomerDisplayInfo } from "@/utils/orderDisplayUtils";
import OrdersTableHeader from "./OrdersTableHeader";
import OrdersTableRow from "./OrdersTableRow";
import OrdersEmptyState from "./OrdersEmptyState";

interface OrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => void;
  onViewDetails: (orderId: string) => void;
}

const OrdersTable = ({ orders, onUpdateStatus, onViewDetails }: OrdersTableProps) => {
  console.log(`OrdersTable: Rendering ${orders.length} orders`);

  if (orders.length === 0) {
    return <OrdersEmptyState />;
  }

  const ordersWithProfiles = orders.filter(order => getCustomerDisplayInfo(order).hasProfile);
  const ordersWithoutProfiles = orders.filter(order => !getCustomerDisplayInfo(order).hasProfile);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-white to-gray-50">
        <CardTitle className="text-royal-green flex items-center gap-2">
          Recent Orders ({orders.length})
          <div className="flex items-center gap-2 text-sm font-normal">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-green-600">{ordersWithProfiles.length} with profiles</span>
            <User className="h-4 w-4 text-orange-600" />
            <span className="text-orange-600">{ordersWithoutProfiles.length} without profiles</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <OrdersTableHeader />
            <TableBody>
              {orders.map((order) => (
                <OrdersTableRow
                  key={order.id}
                  order={order}
                  onViewDetails={onViewDetails}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
