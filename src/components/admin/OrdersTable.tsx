
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Order } from "@/hooks/useOrders";
import { generateCustomerName } from "@/utils/customerUtils";

interface OrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => void;
  onViewDetails: (orderId: string) => void;
}

const OrdersTable = ({ orders, onUpdateStatus, onViewDetails }: OrdersTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "default",
      shipped: "secondary",
      delivered: "default",
      accepted: "default",
      out_for_delivery: "secondary",
      completed: "default",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  // Fix: Ensure id is present and provide correct fallbacks for missing profile
  const getCustomerName = (order: Order) => {
    const fallbackId = order.user_id || (order.profiles && (order.profiles as any).id) || "Unknown";
    // Construct a synthetic profile object with id + existing profile shape
    const profile = {
      id: fallbackId,
      first_name: order.profiles?.first_name ?? null,
      last_name: order.profiles?.last_name ?? null,
      email:
        order.profiles?.email ??
        (fallbackId && `user-${fallbackId.substring(0, 8)}@unknown.com`) ??
        null,
      phone: order.profiles?.phone ?? null,
    };
    return generateCustomerName(profile);
  };

  const getCustomerEmail = (order: Order) => {
    if (!order.profiles?.email) {
      return 'No email';
    }
    return order.profiles.email;
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>{getCustomerName(order)}</TableCell>
                <TableCell>{getCustomerEmail(order)}</TableCell>
                <TableCell>₹{Number(order.total).toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(order.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;

