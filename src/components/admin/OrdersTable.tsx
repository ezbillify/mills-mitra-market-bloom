
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

  const getCustomerName = (order: Order) => {
    console.log(`🔍 Processing order ${order.id.substring(0, 8)} for customer name`);
    console.log('📝 Profile data:', order.profiles);
    
    // If we have valid profile data, use it directly
    if (order.profiles && typeof order.profiles === 'object' && !Array.isArray(order.profiles)) {
      const profile = order.profiles;
      
      // Check if we have actual name data
      if (profile.first_name || profile.last_name) {
        const firstName = profile.first_name || '';
        const lastName = profile.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        console.log(`✅ Found profile name: "${fullName}"`);
        return fullName;
      }
      
      // Try to extract from email if it's a real email
      if (profile.email && !profile.email.startsWith('user-') && profile.email !== 'No email provided') {
        const emailPrefix = profile.email.split('@')[0];
        const cleanName = emailPrefix.replace(/[0-9._-]/g, ' ').trim();
        
        if (cleanName && cleanName.length > 2) {
          const capitalizedName = cleanName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          console.log(`📧 Generated name from email: "${capitalizedName}"`);
          return capitalizedName;
        }
      }
    }
    
    // Fallback: use customer ID
    const fallbackName = `Customer ${order.user_id?.substring(0, 8) || 'Unknown'}`;
    console.log(`🔄 Using fallback name: "${fallbackName}"`);
    return fallbackName;
  };

  const getCustomerEmail = (order: Order) => {
    if (order.profiles && typeof order.profiles === 'object' && !Array.isArray(order.profiles)) {
      return order.profiles.email || 'No email';
    }
    return 'No email';
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

  console.log(`📊 OrdersTable rendering ${orders.length} orders`);

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
            {orders.map((order) => {
              const customerName = getCustomerName(order);
              const customerEmail = getCustomerEmail(order);
              
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div className="font-medium">{customerName}</div>
                  </TableCell>
                  <TableCell>{customerEmail}</TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
