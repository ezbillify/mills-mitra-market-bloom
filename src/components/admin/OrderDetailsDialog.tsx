import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus } from "@/types/order";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import OrderStatusCard from "./order-details/OrderStatusCard";
import OrderTimelineCard from "./order-details/OrderTimelineCard";
import TrackingCard from "./order-details/TrackingCard";
import CustomerInfoCard from "./order-details/CustomerInfoCard";
import InvoiceInfoCard from "./order-details/InvoiceInfoCard";
import ShippingAddressCard from "./order-details/ShippingAddressCard";
import PackingInstructionsCard from "./order-details/PackingInstructionsCard";
import OrderItemsCard from "./order-details/OrderItemsCard";
import PDFInvoiceCard from "./order-details/PDFInvoiceCard";

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
  const { toast } = useToast();

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
            <CustomerInfoCard customerInfo={customerInfo} />

            {/* Invoice Information */}
            <InvoiceInfoCard 
              orderId={orderDetails.id} 
              createdAt={orderDetails.created_at} 
              paymentType={orderDetails.payment_type} // Pass payment type to InvoiceInfoCard
            />

            {/* Shipping Address */}
            <ShippingAddressCard shippingAddress={orderDetails.shipping_address} />

            {/* What to Pack */}
            <PackingInstructionsCard 
              orderItems={orderItems}
              total={orderDetails.total}
              customerInfo={customerInfo}
            />

            {/* Order Items */}
            <OrderItemsCard 
              orderItems={orderItems}
              total={orderDetails.total}
            />

            {/* PDF Invoice Generation */}
            <PDFInvoiceCard orderId={orderDetails.id} />

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
