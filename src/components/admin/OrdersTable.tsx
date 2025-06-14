
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Truck } from "lucide-react";
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
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "outline", className: "border-orange-200 text-orange-700 bg-orange-50" },
      processing: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200" },
      shipped: { variant: "secondary", className: "bg-purple-100 text-purple-700 border-purple-200" },
      delivered: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      accepted: { variant: "default", className: "bg-green-100 text-green-700 border-green-200" },
      out_for_delivery: { variant: "secondary", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
      completed: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      cancelled: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-200" }
    };
    
    const config = variants[status] || { variant: "default" as const, className: "bg-gray-100 text-gray-700" };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
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
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-white to-gray-50">
          <CardTitle className="text-royal-green">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-700 text-lg">No orders found</p>
            <p className="text-gray-500 text-sm mt-2">Orders will appear here once customers start placing them.</p>
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
      shipping_exists: !!order.shipping_settings,
      shipping_name: order.shipping_settings?.name,
      total: order.total,
      status: order.status
    });
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-white to-gray-50">
        <CardTitle className="text-royal-green">Recent Orders ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Order ID</TableHead>
                <TableHead className="text-gray-700 font-semibold">Customer</TableHead>
                <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                <TableHead className="text-gray-700 font-semibold">Shipping Method</TableHead>
                <TableHead className="text-gray-700 font-semibold">Total</TableHead>
                <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => {
                console.log(`🎨 Rendering row ${index + 1} for order ${order.id.substring(0, 8)}`);
                
                const customerName = generateCustomerName({
                  id: order.user_id,
                  first_name: order.profiles?.first_name,
                  last_name: order.profiles?.last_name,
                  email: order.profiles?.email
                });
                const customerEmail = order.profiles?.email || 'No email';
                const shippingMethod = order.shipping_settings?.name || 'Standard Shipping';
                
                console.log(`✨ Final display values for row ${index + 1} - Name: "${customerName}", Email: "${customerEmail}", Shipping: "${shippingMethod}"`);
                
                return (
                  <TableRow key={order.id} className="border-gray-200 hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono text-sm text-royal-green bg-gray-50 rounded-md m-1 px-3 py-2">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{customerName}</div>
                    </TableCell>
                    <TableCell className="text-gray-600">{customerEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{shippingMethod}</div>
                          {order.delivery_price !== null && order.delivery_price !== undefined && (
                            <div className="text-xs text-gray-500">
                              ₹{Number(order.delivery_price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-royal-green text-lg">₹{Number(order.total).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
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
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
