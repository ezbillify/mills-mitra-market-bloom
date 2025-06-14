
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
import {
  Package,
  Truck,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Hash,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Allow profiles to be a valid profile object, null, or SelectQueryError or error-like object
type OrderDetailsProfile =
  | {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      postal_code: string | null;
      country: string | null;
    }
  | null
  | { error: true };

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
  status: string;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  tracking_number: string | null;
  profiles: OrderDetailsProfile;
}

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
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
  const { toast } = useToast();

  useEffect(() => {
    if (orderId && open) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line
  }, [orderId, open]);

  // Helper to sanitize "profiles" so UI never gets the error object
  function sanitizeProfile(profile: any): OrderDetailsProfile {
    if (!profile) return null;
    if (
      typeof profile === "object" &&
      Object.prototype.hasOwnProperty.call(profile, "error")
    ) {
      return null;
    }
    return profile;
  }

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      console.log("Fetching order details for:", orderId);

      // Fetch order details with complete profile information
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles!orders_user_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order details:", orderError);
        throw orderError;
      }

      // Fetch order items with complete product information
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          *,
          products (
            name,
            image,
            description
          )
        `
        )
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw itemsError;
      }

      console.log("Order details fetched:", order);
      console.log("Order items fetched:", items);

      setOrderDetails({
        ...order,
        profiles: sanitizeProfile(order.profiles),
      });
      setOrderItems(items || []);
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

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      pending: "accepted",
      accepted: "processing",
      processing: "shipped",
      shipped: "out_for_delivery",
      out_for_delivery: "delivered",
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const labels: Record<string, string> = {
      pending: "Accept Order",
      accepted: "Start Processing",
      processing: "Mark as Shipped",
      shipped: "Out for Delivery",
      out_for_delivery: "Mark as Delivered",
    };
    return labels[currentStatus] || "";
  };

  const safeProfile = orderDetails?.profiles && typeof orderDetails.profiles === "object" && !("error" in orderDetails.profiles) ? orderDetails.profiles : null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                    <span className="text-sm font-medium">
                      Current Status:
                    </span>
                    <Badge className={getStatusColor(orderDetails.status)}>
                      {orderDetails.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Total Amount:
                    </span>
                    <span className="font-bold text-lg">
                      ₹{Number(orderDetails.total).toFixed(2)}
                    </span>
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
                    <p className="text-sm">
                      {formatDate(orderDetails.created_at)}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium">
                      Last Updated:
                    </span>
                    <p className="text-sm">
                      {formatDate(orderDetails.updated_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderDetails.tracking_number ? (
                    <div>
                      <span className="text-sm font-medium">
                        Tracking Number:
                      </span>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {orderDetails.tracking_number}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No tracking number assigned yet
                    </p>
                  )}
                </CardContent>
              </Card>
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
                    <div>
                      <span className="text-sm font-medium">
                        Full Name:
                      </span>
                      <p>
                        {safeProfile
                          ? `${safeProfile.first_name || ""} ${safeProfile.last_name || ""}`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <div>
                        <span className="text-sm font-medium">
                          Email:
                        </span>
                        <p>{safeProfile?.email || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <div>
                        <span className="text-sm font-medium">
                          Phone:
                        </span>
                        <p>{safeProfile?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">
                        Profile Address:
                      </span>
                      <p className="text-sm">
                        {safeProfile?.address ? (
                          <>
                            {safeProfile.address}
                            <br />
                            {safeProfile.city && `${safeProfile.city}, `}
                            {safeProfile.postal_code &&
                              `${safeProfile.postal_code}`}
                            <br />
                            {safeProfile.country}
                          </>
                        ) : (
                          "No address on file"
                        )}
                      </p>
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
                <p className="whitespace-pre-line">
                  {orderDetails.shipping_address}
                </p>
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
                        <h4 className="font-medium">
                          {item.products.name}
                        </h4>
                        {item.products.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.products.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            Quantity: {item.quantity}
                          </span>
                          <span className="text-sm">
                            Unit Price: ₹{Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{(item.quantity * Number(item.price)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between items-center pt-4">
                    <div className="space-y-1">
                      <p className="text-sm">
                        Items Total: ₹{calculateItemsTotal().toFixed(2)}
                      </p>
                      <p className="text-lg font-bold">
                        Order Total: ₹{Number(orderDetails.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {getNextStatus(orderDetails.status) && (
                <Button
                  onClick={() => {
                    const nextStatus = getNextStatus(orderDetails.status);
                    if (nextStatus) {
                      onUpdateStatus(orderDetails.id, nextStatus);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  {getNextStatusLabel(orderDetails.status)}
                </Button>
              )}

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
