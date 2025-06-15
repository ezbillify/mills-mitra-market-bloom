
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "@/types/order";
import { OrderService } from "@/services/orderService";
import { useOrderSubscriptions } from "@/hooks/useOrderSubscriptions";
import { supabase } from "@/integrations/supabase/client";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Check if user is authenticated before fetching
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("👤 No authenticated user, clearing orders");
        setOrders([]);
        return;
      }

      const fetchedOrders = await OrderService.fetchOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("💥 Unexpected error in fetchOrders:", error);
      
      // Only show error toast if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred while fetching orders",
          variant: "destructive",
        });
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Check if user is authenticated before updating
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update order status",
          variant: "destructive",
        });
        return;
      }

      await OrderService.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Unexpected error updating order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred while updating the order",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscriptions
  useOrderSubscriptions({ onOrdersChange: fetchOrders });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    fetchOrders,
    updateOrderStatus,
  };
};

// Re-export types for backward compatibility
export type { Order, OrderStatus } from "@/types/order";
