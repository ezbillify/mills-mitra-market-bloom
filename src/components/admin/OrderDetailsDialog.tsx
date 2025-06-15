
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Truck,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Hash,
  FileText,
  Save,
  Download,
  Building,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus } from "@/types/order";
import { InvoiceService } from "@/services/invoiceService";

interface OrderDetailsProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image: string | null;
    description: string | null;
  };
}

interface OrderDetails {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  tracking_number: string | null;
  profiles: OrderDetailsProfile | null;
}

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
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
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

      // First, fetch the order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        throw new Error(`Failed to fetch order: ${orderError.message}`);
      }

      // Then fetch the profile separately using the user_id from the order
      let profileData = null;
      if (order.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, phone, address, city, postal_code, country")
          .eq("id", order.user_id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // Don't throw error for profile, just log it
        } else {
          profileData = profile;
        }
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
      console.log("Profile data fetched:", profileData);
      console.log("Order items fetched:", items);

      // Combine the data
      const orderWithProfile = {
        ...order,
        profiles: profileData
      };

      setOrderDetails(orderWithProfile);
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

  const getCustomerInfo = () => {
    if (!orderDetails) return { name: "Unknown", email: "Unknown", phone: "Unknown" };
    
    if (orderDetails.profiles) {
      const { first_name, last_name, email, phone } = orderDetails.profiles;
      const name = first_name || last_name 
        ? `${first_name || ''} ${last_name || ''}`.trim()
        : email || `Customer ${orderDetails.user_id?.substring(0, 8)}`;
      
      return {
        name,
        email: email || "No email provided",
        phone: phone || "No phone provided",
        hasProfile: true
      };
    }
    
    return {
      name: `Customer ${orderDetails.user_id?.substring(0, 8)}`,
      email: "Profile not completed",
      phone: "Profile not completed",
      hasProfile: false
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge className={getStatusColor(orderDetails.status)}>
                      {orderDetails.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status-select">Change Status:</Label>
                    <Select
                      value={orderDetails.status}
                      onValueChange={(value: OrderStatus) => {
                        onUpdateStatus(orderDetails.id, value);
                        setOrderDetails({ ...orderDetails, status: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">₹{Number(orderDetails.total).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Order Date:</span>
                    <p className="text-sm">{formatDate(orderDetails.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Last Updated:</span>
                    <p className="text-sm">{formatDate(orderDetails.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping & Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="tracking-number">Tracking Number:</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tracking-number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                      <Button
                        size="sm"
                        onClick={updateTrackingNumber}
                        disabled={isUpdatingTracking}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Information - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                  {!customerInfo.hasProfile && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Profile Incomplete
                    </Badge>
                  )}
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
                    <div className="text-xs text-gray-500">
                      Customer ID: {orderDetails.user_id.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Profile Address:</span>
                      <p className="text-sm text-gray-600">
                        {orderDetails.profiles?.address ? (
                          <>
                            {orderDetails.profiles.address}
                            <br />
                            {orderDetails.profiles.city && `${orderDetails.profiles.city}, `}
                            {orderDetails.profiles.postal_code && `${orderDetails.profiles.postal_code}`}
                            <br />
                            {orderDetails.profiles.country}
                          </>
                        ) : (
                          <span className="text-orange-600">No address on file - Customer needs to complete profile</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information - New Section */}
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
                  Generate and download a professional A4 PDF invoice for this order with complete customer and company information.
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
