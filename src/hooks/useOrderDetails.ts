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

      // Updated query with LEFT JOIN instead of INNER JOIN to handle empty profiles
      let orderQuery = supabase
        .from("orders")
        .select(`
          *,
          profiles(
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            state
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

      // If profile data is missing key info, try to get address data as fallback
      let enhancedOrder: any = order; // Temporary TypeScript fix
      
      console.log("🔍 Profile check:", order.profiles);
      console.log("🔍 Should fetch address?", !order.profiles || (!order.profiles.phone || !order.profiles.address));
      console.log("🔍 Order user_id:", order.user_id);
      
      if (!order.profiles || (!order.profiles.phone || !order.profiles.address)) {
        console.log("🔄 Fetching address data as fallback...");
        
        // First, let's check if there are any addresses for this user at all
        const { data: allAddresses, error: allAddressError } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", order.user_id);
          
        console.log("📋 All addresses for user:", allAddresses);
        console.log("📋 All addresses error:", allAddressError);
        
        try {
          const { data: addressData, error: addressError } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", order.user_id)
            .order("created_at", { ascending: false }) // Get most recent address
            .limit(1)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 results

          console.log("📍 Address query result:", addressData);
          console.log("📍 Address query error:", addressError);

          if (addressData) {
            // Merge address data into profile if profile data is missing
            enhancedOrder = {
              ...order,
              profiles: {
                ...order.profiles,
                // Use address data if profile data is missing
                first_name: order.profiles.first_name || addressData.first_name,
                last_name: order.profiles.last_name || addressData.last_name,
                phone: order.profiles.phone || addressData.phone,
                address: order.profiles.address || addressData.address_line_1,
                city: order.profiles.city || addressData.city,
                postal_code: order.profiles.postal_code || addressData.postal_code,
                country: order.profiles.country || addressData.country,
                state: (order.profiles as any).state || addressData.state,
              },
              // Also store the address data separately for reference
              address_data: addressData
            };
          }
        } catch (addressError) {
          console.warn("Could not fetch address data as fallback:", addressError);
        }
      }

      console.log("Order details fetched:", enhancedOrder);
      setOrderDetails(enhancedOrder);

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