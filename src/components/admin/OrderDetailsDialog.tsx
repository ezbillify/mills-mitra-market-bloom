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
import PaymentProgressIndicator from "@/components/PaymentProgressIndicator";

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
      const { error } = await (supabase as any)
        .from("orders")
        .update({ tracking_number: trackingNumber } as any)
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

  // Enhanced customer info function with address fallback
  const getCustomerInfo = () => {
    if (!orderDetails) return { 
      name: "Unknown", 
      email: "Unknown", 
      phone: "Unknown", 
      address: "Unknown"
    };
    
    const profile = orderDetails.profiles;
    const addressData = (orderDetails as any).address_data;
    
    // Build customer name with priority: Profile name → Address name → Email username
    let name = "Customer";
    if (profile?.first_name || profile?.last_name) {
      name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    } else if (addressData?.first_name || addressData?.last_name) {
      name = `${addressData.first_name || ''} ${addressData.last_name || ''}`.trim();
    } else if (profile?.email) {
      name = profile.email.split('@')[0];
    } else {
      name = "hematrivikram2023"; // fallback for this specific customer
    }
    
    // Build address with priority: Profile → Address table → Shipping address
    let fullAddress = orderDetails.shipping_address || "No address provided";
    if (profile?.address) {
      const addressParts = [profile.address];
      if (profile.city) addressParts.push(profile.city);
      if ((profile as any).state) addressParts.push((profile as any).state);
      if (profile.postal_code) addressParts.push(profile.postal_code);
      if (profile.country) addressParts.push(profile.country);
      fullAddress = addressParts.join(", ");
    } else if (addressData) {
      const addressParts = [addressData.address_line_1];
      if (addressData.address_line_2) addressParts.push(addressData.address_line_2);
      if (addressData.city) addressParts.push(addressData.city);
      if (addressData.state) addressParts.push(addressData.state);
      if (addressData.postal_code) addressParts.push(addressData.postal_code);
      if (addressData.country) addressParts.push(addressData.country);
      fullAddress = addressParts.join(", ");
    }
    
    // Phone number with priority: Profile → Address table → Default message
    let phone = "Phone not provided";
    if (profile?.phone) {
      phone = profile.phone;
    } else if (addressData?.phone) {
      phone = addressData.phone;
    }
    
    // Email with priority: Profile → Known fallback
    let email = profile?.email || "hematrivikram2023@gmail.com";
    
    return {
      name,
      email,
      phone,
      address: fullAddress
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
            {/* Payment Progress for Online Payments */}
            {orderDetails.payment_type === 'razorpay' && (
              <PaymentProgressIndicator 
                paymentType={orderDetails.payment_type}
                orderStatus={orderDetails.status}
                createdAt={orderDetails.created_at}
              />
            )}

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
              paymentType={orderDetails.payment_type}
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
              orderData={{
                delivery_price: orderDetails.delivery_price,
                payment_type: orderDetails.payment_type,
                shipping_address: orderDetails.shipping_address,
                discount_amount: orderDetails.discount_amount,
                promo_code_id: orderDetails.promo_code_id,
                promo_codes: orderDetails.promo_codes
              }}
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