
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrdersStats from "@/components/admin/OrdersStats";
import OrdersTable from "@/components/admin/OrdersTable";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";

// The OrderProfile type should only allow a valid profile object or null (NEVER { error: true }).
type OrderProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
} | null;

interface Order {
  id: string;
  user_id: string;
  total: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "accepted"
    | "out_for_delivery"
    | "completed";
  created_at: string;
  shipping_address: string;
  tracking_number: string | null;
  profiles: OrderProfile;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          console.log("Orders changed, refetching...");
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to sanitize profiles so the UI never gets the error object
  function sanitizeProfile(profile: any): OrderProfile {
    if (
      !profile ||
      (typeof profile === "object" &&
        Object.prototype.hasOwnProperty.call(profile, "error"))
    ) {
      return null;
    }
    // check minimal shape
    if (
      typeof profile.first_name === "undefined" ||
      typeof profile.last_name === "undefined" ||
      typeof profile.email === "undefined"
    ) {
      return null;
    }
    return profile;
  }

  const fetchOrders = async () => {
    try {
      console.log("Fetching orders...");

      // Use explicit join: profiles:profiles!user_id matches orders.user_id -> profiles.id
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles:profiles!user_id (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Supabase error fetching orders:", ordersError);
        toast({
          title: "Error",
          description: `Failed to fetch orders: ${ordersError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Orders fetched successfully:", ordersData);

      // Only valid profile shape or null goes into order.profiles
      const sanitizedOrders =
        ordersData?.map((order: any) => ({
          ...order,
          profiles: sanitizeProfile(order.profiles),
        })) || [];

      setOrders(sanitizedOrders);
    } catch (error) {
      console.error("Unexpected error fetching orders:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus:
      | "pending"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "accepted"
      | "out_for_delivery"
      | "completed"
  ) => {
    try {
      console.log(`Updating order ${orderId} to status ${newStatus}`);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
        toast({
          title: "Error",
          description: `Failed to update order status: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      await fetchOrders();
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Unexpected error updating order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the order",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (orderId: string) => {
    console.log("Opening order details for:", orderId);
    setSelectedOrderId(orderId);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders}>
            <Package className="h-4 w-4 mr-2" />
            Refresh Orders
          </Button>
        </div>
      </div>

      <OrdersStats orders={orders} />
      <OrdersTable
        orders={orders}
        onUpdateStatus={updateOrderStatus}
        onViewDetails={handleViewDetails}
      />

      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdateStatus={updateOrderStatus}
      />
    </div>
  );
};

export default AdminOrders;
