
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Truck, Bug } from "lucide-react";
import { Order } from "@/types/order";
import { generateCustomerName } from "@/utils/customerUtils";
import { DebugUtils } from "@/utils/debugUtils";

interface OrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => void;
  onViewDetails: (orderId: string) => void;
}

const OrdersTable = ({ orders, onUpdateStatus, onViewDetails }: OrdersTableProps) => {
  DebugUtils.log("OrdersTable", `🔥 Received ${orders.length} orders`);
  DebugUtils.table("OrdersTable", "Orders received:", orders.map(order => ({
    id: order.id.substring(0, 8),
    user_id: order.user_id.substring(0, 8),
    has_profiles: !!order.profiles,
    customer_name: order.profiles ? `${order.profiles.first_name} ${order.profiles.last_name}` : 'NO PROFILE',
    customer_email: order.profiles?.email || 'NO EMAIL'
  })));

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

  const getShippingMethod = (order: Order) => {
    DebugUtils.log("OrdersTable", `🚚 Getting shipping method for order ${order.id.substring(0, 8)}`);
    DebugUtils.log("OrdersTable", `📦 Order shipping_settings:`, order.shipping_settings);
    DebugUtils.log("OrdersTable", `💰 Order delivery_price:`, order.delivery_price);
    
    if (order.shipping_settings && order.shipping_settings.name) {
      DebugUtils.log("OrdersTable", `✅ Found shipping method: ${order.shipping_settings.name}`);
      return {
        name: order.shipping_settings.name,
        price: order.delivery_price || order.shipping_settings.price
      };
    }
    
    if (order.delivery_price !== null && order.delivery_price !== undefined) {
      if (order.delivery_price === 0) {
        DebugUtils.log("OrdersTable", "📦 Detected free shipping based on price");
        return { name: "Free Shipping", price: 0 };
      } else {
        DebugUtils.log("OrdersTable", `💸 Detected paid shipping: ₹${order.delivery_price}`);
        return { name: "Paid Shipping", price: order.delivery_price };
      }
    }
    
    DebugUtils.log("OrdersTable", "⚠️ No shipping info found, using default");
    return { name: "Standard Shipping", price: 0 };
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

  DebugUtils.log("OrdersTable", `📋 Rendering table with ${orders.length} orders`);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-white to-gray-50">
        <CardTitle className="text-royal-green flex items-center gap-2">
          Recent Orders ({orders.length})
          {DebugUtils.isDebugEnabled() && (
            <Bug className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
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
                DebugUtils.log("OrdersTable", `🎨 Rendering row ${index + 1} for order ${order.id.substring(0, 8)}`);
                
                // Create a simplified customer object for the generateCustomerName function
                const customerData = {
                  id: order.user_id,
                  first_name: order.profiles?.first_name || null,
                  last_name: order.profiles?.last_name || null,
                  email: order.profiles?.email || null
                };
                
                DebugUtils.log("OrdersTable", `📋 Customer data for generateCustomerName:`, customerData);
                
                const customerName = generateCustomerName(customerData);
                const customerEmail = order.profiles?.email || 'No email';
                const shippingInfo = getShippingMethod(order);
                
                DebugUtils.log("OrdersTable", `✨ Final display values for row ${index + 1} - Name: "${customerName}", Email: "${customerEmail}", Shipping: "${shippingInfo.name}" (₹${shippingInfo.price})`);
                
                return (
                  <TableRow key={order.id} className="border-gray-200 hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono text-sm text-royal-green bg-gray-50 rounded-md m-1 px-3 py-2">
                      #{order.id.slice(0, 8)}
                      {DebugUtils.isDebugEnabled() && !order.profiles && (
                        <div className="text-xs text-red-500 mt-1">NO PROFILE</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{customerName}</div>
                      {DebugUtils.isDebugEnabled() && (
                        <div className="text-xs text-gray-500">
                          User: {order.user_id.substring(0, 8)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{customerEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{shippingInfo.name}</div>
                          {shippingInfo.price > 0 && (
                            <div className="text-xs text-gray-500">
                              ₹{Number(shippingInfo.price).toFixed(2)}
                            </div>
                          )}
                          {shippingInfo.price === 0 && shippingInfo.name.includes("Free") && (
                            <div className="text-xs text-green-600 font-medium">
                              Free
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
