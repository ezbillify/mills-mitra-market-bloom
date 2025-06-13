
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed";
  total: number;
}

interface OrdersStatsProps {
  orders: Order[];
}

const OrdersStats = ({ orders }: OrdersStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {orders.filter(o => o.status === 'pending').length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {orders.filter(o => o.status === 'processing').length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersStats;
