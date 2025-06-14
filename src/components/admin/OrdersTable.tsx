
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Order } from "@/types/order";
import { generateCustomerName } from "@/utils/customerUtils";

interface OrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => void;
  onViewDetails: (orderId: string) => void;
}

const OrdersTable = ({ orders, onUpdateStatus, onViewDetails }: OrdersTableProps) => {
  console.log(`🔥 OrdersTable received ${orders.length} orders:`, orders);

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
    return <Badge variant={variants[status] || "default"} className="bg-golden-millet text-warm-brown">{status.replace("_", " ")}</Badge>;
  };

  const getCustomerName = (order: Order) => {
    console.log(`🎯 getCustomerName called for order ${order.id.substring(0, 8)}`);
    console.log(`📊 Raw order.profiles data:`, order.profiles);
    
    if (!order.profiles) {
      console.log(`❌ No profiles data for order ${order.id.substring(0, 8)}`);
      const fallbackName = `Customer ${order.user_id?.substring(0, 8) || 'Unknown'}`;
      console.log(`🔄 Using fallback name: "${fallbackName}"`);
      return fallbackName;
    }
    
    console.log(`✅ Profiles data exists:`, {
      first_name: order.profiles.first_name,
      last_name: order.profiles.last_name,
      email: order.profiles.email
    });
    
    const customerName = generateCustomerName({
      id: order.user_id,
      first_name: order.profiles.first_name,
      last_name: order.profiles.last_name,
      email: order.profiles.email
    });
    
    console.log(`🎉 Generated customer name: "${customerName}"`);
    return customerName;
  };

  const getCustomerEmail = (order: Order) => {
    const email = order.profiles?.email || 'No email';
    console.log(`📧 Email for order ${order.id.substring(0, 8)}: "${email}"`);
    return email;
  };

  if (orders.length === 0) {
    return (
      <Card className="bg-white border-warm-beige shadow-sm">
        <CardHeader>
          <CardTitle className="text-warm-brown">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-earth-brown">No orders found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log(`📋 OrdersTable rendering table with ${orders.length} orders`);
  
  // Detailed logging for each order's data structure
  orders.forEach((order, index) => {
    console.log(`🔢 Order ${index + 1}:`, {
      id: order.id.substring(0, 8),
      user_id: order.user_id.substring(0, 8),
      profiles_exists: !!order.profiles,
      profiles_data: order.profiles,
      total: order.total,
      status: order.status
    });
  });

  return (
    <Card className="bg-white border-warm-beige shadow-sm">
      <CardHeader>
        <CardTitle className="text-warm-brown">Recent Orders ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-warm-beige">
              <TableHead className="text-earth-brown">Order ID</TableHead>
              <TableHead className="text-earth-brown">Customer</TableHead>
              <TableHead className="text-earth-brown">Email</TableHead>
              <TableHead className="text-earth-brown">Total</TableHead>
              <TableHead className="text-earth-brown">Status</TableHead>
              <TableHead className="text-earth-brown">Date</TableHead>
              <TableHead className="text-earth-brown">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => {
              console.log(`🎨 Rendering row ${index + 1} for order ${order.id.substring(0, 8)}`);
              
              const customerName = getCustomerName(order);
              const customerEmail = getCustomerEmail(order);
              
              console.log(`✨ Final display values for row ${index + 1} - Name: "${customerName}", Email: "${customerEmail}"`);
              
              return (
                <TableRow key={order.id} className="border-warm-beige hover:bg-warm-cream/50">
                  <TableCell className="font-medium text-warm-brown">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div className="font-medium text-warm-brown">{customerName}</div>
                  </TableCell>
                  <TableCell className="text-earth-brown">{customerEmail}</TableCell>
                  <TableCell className="text-golden-millet font-semibold">₹{Number(order.total).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-earth-brown">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(order.id)}
                      className="border-olive-leaf text-olive-leaf hover:bg-olive-leaf hover:text-warm-cream"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
