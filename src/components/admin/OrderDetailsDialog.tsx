import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Hash,
  FileText,
  Download,
  Building,
  CreditCard,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus } from "@/types/order";
import { InvoiceService } from "@/services/invoiceService";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import OrderStatusCard from "./order-details/OrderStatusCard";
import OrderTimelineCard from "./order-details/OrderTimelineCard";
import TrackingCard from "./order-details/TrackingCard";

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const OrderDetailsDialog = ({
  orderId,
  open,
  onOpenChange,
  onUpdateStatus,
}: OrderDetailsDialogProps) => {
  const { orderDetails, setOrderDetails, orderItems, loading } = useOrderDetails(orderId, open);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId && open) {
      fetchOrderDetails();
    }
  }, [orderId, open]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      console.log("Fetching order details for:", orderId);

      // Fetch order with profile data using a simple join
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_profiles_fkey(
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        throw new Error(`Failed to fetch order: ${orderError.message}`);
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products (
            name,
            image,
            description
          )
        `)
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
      }

      console.log("Order details fetched:", order);
      console.log("Order items fetched:", items);

      setOrderDetails(order);
      setOrderItems(items || []);
      setTrackingNumber(order.tracking_number || "");
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: `Failed to fetch order details: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTrackingNumber = async () => {
    if (!orderDetails) return;

    setIsUpdatingTracking(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber })
        .eq("id", orderDetails.id);

      if (error) throw error;

      setOrderDetails({ ...orderDetails, tracking_number: trackingNumber });
      toast({
        title: "Success",
        description: "Tracking number updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating tracking number:", error);
      toast({
        title: "Error",
        description: `Failed to update tracking number: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const generatePDFInvoice = async () => {
    if (!orderDetails) return;

    setIsGeneratingPDF(true);
    try {
      await InvoiceService.downloadInvoiceForOrder(orderDetails.id);
      toast({
        title: "Success",
        description: "PDF invoice generated and downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error generating PDF invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF invoice",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      out_for_delivery: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateItemsTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.price),
      0
    );
  };

  // Simplified customer info function
  const getCustomerInfo = () => {
    if (!orderDetails) return { 
      name: "Unknown", 
      email: "Unknown", 
      phone: "Unknown", 
      address: "Unknown"
    };
    
    if (orderDetails.profiles) {
      const { first_name, last_name, email, phone, address, city, postal_code, country } = orderDetails.profiles;
      
      let name = "Customer";
      if (first_name || last_name) {
        name = `${first_name || ''} ${last_name || ''}`.trim();
      } else if (email && email.includes('@')) {
        name = email;
      } else {
        name = `Customer ${orderDetails.user_id?.substring(0, 8)}`;
      }
      
      let fullAddress = "No address provided";
      if (address) {
        const addressParts = [address];
        if (city) addressParts.push(city);
        if (postal_code) addressParts.push(postal_code);
        if (country) addressParts.push(country);
        fullAddress = addressParts.join(", ");
      }
      
      return {
        name,
        email: email || "No email provided",
        phone: phone || "No phone provided",
        address: fullAddress
      };
    }
    
    return {
      name: `Customer ${orderDetails.user_id?.substring(0, 8)}`,
      email: "Profile not completed",
      phone: "Profile not completed",
      address: "Profile not completed"
    };
  };

  if (!orderDetails && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Order not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const customerInfo = getCustomerInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Order #{orderDetails?.id.slice(0, 8) || "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <OrderStatusCard
                status={orderDetails.status}
                total={orderDetails.total}
                onStatusChange={(value: OrderStatus) => {
                  onUpdateStatus(orderDetails.id, value);
                  setOrderDetails({ ...orderDetails, status: value });
                }}
              />

              <OrderTimelineCard
                createdAt={orderDetails.created_at}
                updatedAt={orderDetails.updated_at}
              />

              <TrackingCard
                trackingNumber={trackingNumber}
                onTrackingNumberChange={setTrackingNumber}
                onUpdate={updateTrackingNumber}
                isUpdating={isUpdatingTracking}
              />
            </div>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Customer Name:</span>
                        <p className="text-gray-900">{customerInfo.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Email:</span>
                        <p className="text-gray-900">{customerInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Phone:</span>
                        <p className="text-gray-900">{customerInfo.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <span className="text-sm font-medium">Address:</span>
                        <p className="text-sm text-gray-900 mt-1">{customerInfo.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Invoice Number:</span>
                        <p className="text-gray-900">INV-{orderDetails.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Invoice Date:</span>
                        <p className="text-gray-900">{new Date(orderDetails.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Company:</span>
                        <p className="text-gray-900">Your Company Name</p>
                        <p className="text-xs text-gray-500">GST: Your GST Number</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line bg-gray-50 p-3 rounded-md">{orderDetails.shipping_address}</p>
              </CardContent>
            </Card>

            {/* What to Pack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  What to Pack - Items Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Packing Instructions</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Total items: {orderItems.length} different products</li>
                      <li>• Total quantity: {orderItems.reduce((sum, item) => sum + item.quantity, 0)} pieces</li>
                      <li>• Order value: ₹{Number(orderDetails.total).toFixed(2)}</li>
                      <li>• Customer: {customerInfo.name}</li>
                      <li>• Phone: {customerInfo.phone}</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium">Items to pack:</h5>
                    {orderItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.products.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({orderItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        {item.products.image ? (
                          <img
                            src={item.products.image}
                            alt={item.products.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.products.name}</h4>
                        {item.products.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.products.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Quantity: {item.quantity}</span>
                          <span className="text-sm">Unit Price: ₹{Number(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{(item.quantity * Number(item.price)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between items-center pt-4">
                    <div className="space-y-1">
                      <p className="text-sm">Items Total: ₹{calculateItemsTotal().toFixed(2)}</p>
                      <p className="text-lg font-bold">Order Total: ₹{Number(orderDetails.total).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Invoice Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  PDF Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Generate and download a professional PDF invoice for this order.
                </p>
                <Button
                  onClick={generatePDFInvoice}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingPDF ? "Generating PDF..." : "Download PDF Invoice"}
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
