
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus } from "@/types/order";

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

export const useOrderDetails = (orderId: string | null, open: boolean) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      console.log("Fetching order details for:", orderId);

      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ No authenticated user found:", userError);
        throw new Error("Authentication required to fetch order details");
      }

      // Fetch order with explicit user filtering
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
        .eq("user_id", user.id) // Ensure user can only see their own orders
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        throw new Error(`Failed to fetch order: ${orderError.message}`);
      }

      // Fetch order items with additional security check
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

      // Verify the order belongs to the current user
      if (order.user_id !== user.id) {
        console.error("❌ Order does not belong to current user");
        throw new Error("You don't have permission to view this order");
      }

      console.log("Order details fetched:", order);
      console.log("Order items fetched:", items);

      setOrderDetails(order);
      setOrderItems(items || []);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: `Failed to fetch order details: ${error.message}`,
        variant: "destructive",
      });
      setOrderDetails(null);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId && open) {
      fetchOrderDetails();
    }
  }, [orderId, open]);

  return {
    orderDetails,
    setOrderDetails,
    orderItems,
    loading,
    fetchOrderDetails
  };
};
