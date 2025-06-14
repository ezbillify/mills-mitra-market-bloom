
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Package } from "lucide-react";
import OrderItemTable from "./OrderItemTable";
import { generateCustomerName } from "@/utils/customerUtils";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  accepted: "Accepted",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
};

const badgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processing: "default",
  shipped: "secondary",
  delivered: "default",
  cancelled: "destructive",
  accepted: "default",
  out_for_delivery: "secondary",
  completed: "default",
};

const Orders = () => {
  const { orders, loading } = useOrders();
  const navigate = useNavigate();

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Button onClick={() => navigate("/products")}>Start Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order {order.id.substring(0, 8)}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  {order.profiles && (
                    <p className="text-xs text-muted-foreground mt-1">
                      For: {generateCustomerName(order.profiles)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">₹{Number(order.total).toFixed(2)}</div>
                  <Badge variant={badgeVariants[order.status] || "default"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <p className="text-sm text-gray-600">{order.shipping_address}</p>
                </div>
                {order.tracking_number && (
                  <div>
                    <h4 className="font-medium mb-2">Tracking Number</h4>
                    <p className="text-sm text-gray-600">{order.tracking_number}</p>
                  </div>
                )}
              </div>
              <OrderItemTable orderId={order.id} />
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleViewOrder(order.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders;

