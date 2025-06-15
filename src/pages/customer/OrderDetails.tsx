
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OrderItemTable from "./OrderItemTable";
import { supabase } from "@/integrations/supabase/client";
import { generateCustomerName } from "@/utils/customerUtils";
import { ArrowLeft, Truck, Download, IndianRupee } from "lucide-react";
import { InvoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { TaxCalculator } from "@/utils/taxCalculator";

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
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
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

      if (orderError) {
        console.error("Error fetching order:", orderError);
        setLoading(false);
        return;
      }

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products (
            name,
            description,
            price,
            discounted_price,
            gst_percentage,
            selling_price_with_tax,
            hsn_code
          )
        `)
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
      }

      setOrder(orderData || null);
      setOrderItems(itemsData || []);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const calculateOrderTotals = () => {
    if (!orderItems.length) return { subtotal: 0, totalTax: 0, grandTotal: 0 };

    let subtotal = 0;
    let totalTax = 0;

    orderItems.forEach((item: any) => {
      if (!item.products) return;
      
      const gstPercentage = item.products.gst_percentage || 18;
      const basePrice = item.products.discounted_price || item.products.price;
      const itemTotal = basePrice * item.quantity;
      
      // Calculate tax breakdown
      const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstPercentage, order?.shipping_address || '');
      
      subtotal += taxBreakdown.taxableAmount;
      totalTax += taxBreakdown.totalTax;
    });

    const shippingCost = Number(order?.delivery_price || 0);
    const grandTotal = subtotal + totalTax + shippingCost;

    return { subtotal, totalTax, grandTotal, shippingCost };
  };

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

  const orderTotals = calculateOrderTotals();

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
              <div className="text-lg font-bold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {orderTotals.grandTotal.toFixed(2)}
              </div>
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
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Order Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal (Taxable Amount):</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {orderTotals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total GST:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {orderTotals.totalTax.toFixed(2)}
                </span>
              </div>
              {orderTotals.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {orderTotals.shippingCost.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 font-semibold">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {orderTotals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
                <p className="text-gray-600 mt-1 flex items-center gap-1">
                  Shipping Cost: <IndianRupee className="h-3 w-3" />{orderTotals.shippingCost.toFixed(2)}
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
