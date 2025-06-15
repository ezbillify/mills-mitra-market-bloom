import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Package, Truck, IndianRupee, User, Phone, Mail } from "lucide-react";
import OrderItemTable from "./OrderItemTable";
import { generateCustomerName } from "@/utils/customerUtils";
import { InvoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";

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
  const { orders, loading } = useOrders({ isAdminView: false }); // Explicitly customer view
  const navigate = useNavigate();
  const { toast } = useToast();
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set());

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoices(prev => new Set([...prev, orderId]));
    try {
      await InvoiceService.downloadInvoiceForOrder(orderId);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download invoice. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const canDownloadInvoice = (status: string) => {
    return status === 'shipped' || status === 'delivered' || status === 'completed';
  };

  const getCustomerInfo = (order: any) => {
    if (order.profiles) {
      const name = generateCustomerName(order.profiles);
      return {
        name: name !== `Customer ${order.user_id.substring(0, 8)}` ? name : "Complete your profile",
        email: order.profiles.email || "No email provided",
        phone: order.profiles.phone || "No phone provided"
      };
    }
    return {
      name: "Complete your profile",
      email: "No email provided", 
      phone: "No phone provided"
    };
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
        {orders.map((order) => {
          const customerInfo = getCustomerInfo(order);
          
          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {customerInfo.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {customerInfo.email}
                      </div>
                      {customerInfo.phone !== "No phone provided" && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customerInfo.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {Number(order.total).toFixed(2)}
                    </div>
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
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Method
                    </h4>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {order.shipping_settings?.name || 'Standard Shipping'}
                      </p>
                      {order.shipping_settings?.description && (
                        <p className="text-gray-600">{order.shipping_settings.description}</p>
                      )}
                      <p className="text-gray-600 flex items-center gap-1">
                        Shipping Cost: <IndianRupee className="h-3 w-3" />
                        {Number(order.delivery_price || order.shipping_settings?.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {order.tracking_number && (
                    <div>
                      <h4 className="font-medium mb-2">Tracking Number</h4>
                      <p className="text-sm text-gray-600">{order.tracking_number}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium mb-2">Invoice Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Invoice #: INV-{order.id.substring(0, 8)}</p>
                      <p>Company: Your Company Name</p>
                      <p>GST: Your GST Number</p>
                      <p className="text-xs text-orange-600">
                        * Complete invoice details available after download
                      </p>
                    </div>
                  </div>
                </div>
                <OrderItemTable orderId={order.id} />
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewOrder(order.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {canDownloadInvoice(order.status) ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadInvoice(order.id)}
                      disabled={downloadingInvoices.has(order.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingInvoices.has(order.id) ? "Downloading..." : "Download Invoice"}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Invoice Available After Shipping
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
