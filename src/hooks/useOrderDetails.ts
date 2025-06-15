
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types/order";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  products: {
    name: string;
    image: string | null;
    description: string | null;
  };
}

export const useOrderDetails = (orderId: string | null, open: boolean) => {
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrderDetails = async (id: string) => {
    try {
      console.log(`Fetching order details for: ${id}`);
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ No authenticated user found:", userError);
        throw new Error("Authentication required to fetch order details");
      }

      const isAdmin = user.email === 'admin@ezbillify.com' || user.email === 'admin@millsmitra.com';

      let orderQuery = supabase
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
        .eq("id", id);

      // For non-admin users, add user_id filter to respect RLS
      if (!isAdmin) {
        orderQuery = orderQuery.eq("user_id", user.id);
      }

      const { data: order, error: orderError } = await orderQuery.maybeSingle();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        throw new Error(`Failed to fetch order: ${orderError.message}`);
      }

      if (!order) {
        console.log(`Order ${id} not found or access denied`);
        setOrderDetails(null);
        setOrderItems([]);
        return;
      }

      console.log("Order details fetched:", order);
      setOrderDetails(order);

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
        .eq("order_id", id);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
      }

      console.log("Order items fetched:", items);
      setOrderItems(items || []);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      setOrderDetails(null);
      setOrderItems([]);
      throw error;
    }
  };

  useEffect(() => {
    if (orderId && open) {
      setLoading(true);
      fetchOrderDetails(orderId)
        .finally(() => setLoading(false));
    } else {
      setOrderDetails(null);
      setOrderItems([]);
    }
  }, [orderId, open]);

  return {
    orderDetails,
    setOrderDetails,
    orderItems,
    loading,
  };
};
