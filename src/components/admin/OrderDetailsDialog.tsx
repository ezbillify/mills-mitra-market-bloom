
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, Calendar, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image: string | null;
  };
}

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

const OrderDetailsDialog = ({ orderId, open, onOpenChange, onUpdateStatus }: OrderDetailsDialogProps) => {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
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
      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            image
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrderDetails(order);
      setOrderItems(items || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
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
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!orderDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div>Order not found</div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{orderDetails.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(orderDetails.status)}>
                  {orderDetails.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total:</span>
                <span className="font-semibold">₹{Number(orderDetails.total).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Order Date:</span>
                <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
              </div>
              
              {orderDetails.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Tracking:</span>
                  <span className="font-mono text-sm">{orderDetails.tracking_number}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium">Name:</span>
                <p>{orderDetails.profiles?.first_name} {orderDetails.profiles?.last_name}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p>{orderDetails.profiles?.email}</p>
              </div>
              
              {orderDetails.profiles?.phone && (
                <div>
                  <span className="text-sm font-medium">Phone:</span>
                  <p>{orderDetails.profiles.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{orderDetails.shipping_address}</p>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
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
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">₹{(item.quantity * Number(item.price)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => onUpdateStatus(orderDetails.id, getNextStatus(orderDetails.status))}
            disabled={!getNextStatus(orderDetails.status)}
          >
            {getNextStatusLabel(orderDetails.status)}
          </Button>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getNextStatus = (currentStatus: string) => {
  const statusFlow: Record<string, string> = {
    pending: 'accepted',
    accepted: 'processing',
    processing: 'shipped',
    shipped: 'out_for_delivery',
    out_for_delivery: 'delivered'
  };
  return statusFlow[currentStatus];
};

const getNextStatusLabel = (currentStatus: string) => {
  const labels: Record<string, string> = {
    pending: 'Accept Order',
    accepted: 'Start Processing',
    processing: 'Mark as Shipped',
    shipped: 'Out for Delivery',
    out_for_delivery: 'Mark as Delivered'
  };
  return labels[currentStatus] || '';
};

export default OrderDetailsDialog;
