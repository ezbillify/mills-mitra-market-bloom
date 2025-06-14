
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/hooks/useOrders";

interface OrdersStatsProps {
  orders: Order[];
}

const OrdersStats = ({ orders }: OrdersStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-white border-warm-beige shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-earth-brown">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warm-brown">{orders.length}</div>
        </CardContent>
      </Card>
      <Card className="bg-white border-warm-beige shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-earth-brown">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-golden-millet">
            {orders.filter(o => o.status === 'pending').length}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-warm-beige shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-earth-brown">Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-olive-leaf">
            {orders.filter(o => o.status === 'processing').length}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-warm-beige shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-earth-brown">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-golden-millet">
            ₹{orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersStats;
