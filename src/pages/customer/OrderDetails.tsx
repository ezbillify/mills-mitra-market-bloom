
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OrderItemTable from "./OrderItemTable";
import { supabase } from "@/integrations/supabase/client";
import { generateCustomerName } from "@/utils/customerUtils";
import { ArrowLeft, Truck, Download } from "lucide-react";
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

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_profiles_fkey(*),
          shipping_settings!orders_delivery_option_id_fkey(
            id,
            name,
            description,
            price
          )
        `)
        .eq("id", orderId)
        .maybeSingle();
      setOrder(data || null);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    
    setDownloadingInvoice(true);
    try {
      await InvoiceService.downloadInvoiceForOrder(orderId);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Check if invoice can be downloaded (order completed or delivered)
  const canDownloadInvoice = order && (order.status === 'completed' || order.status === 'delivered' || order.status === 'shipped');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-xl mx-auto">
          <CardContent>
            <div className="text-center py-10">Order not found.</div>
            <Button variant="outline" onClick={() => navigate("/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/orders")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap">
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
              {canDownloadInvoice && (
                <div className="mt-2">
                  <Button 
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadingInvoice ? "Generating..." : "Download Invoice"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  <p className="text-gray-600 mt-1">{order.shipping_settings.description}</p>
                )}
                <p className="text-gray-600 mt-1">
                  Shipping Cost: ₹{Number(order.delivery_price || order.shipping_settings?.price || 0).toFixed(2)}
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
              <h4 className="font-medium mb-2">Order Status</h4>
              <Badge className="text-base" variant={badgeVariants[order.status] || "default"}>
                {statusLabels[order.status] || order.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Order ID</h4>
              <p className="text-sm text-gray-600">{order.id}</p>
            </div>
            {canDownloadInvoice && (
              <div>
                <h4 className="font-medium mb-2">Invoice</h4>
                <Button 
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingInvoice ? "Generating..." : "Download Invoice"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Tax invoice with GST details and HSN codes
                </p>
              </div>
            )}
          </div>
          <OrderItemTable orderId={order.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails;
