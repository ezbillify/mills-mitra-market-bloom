
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useCartCount = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    console.log('🛒 Fetching cart count for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cart count:', error);
        return;
      }

      const totalCount = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      console.log('🛒 Cart count updated to:', totalCount);
      setCartCount(totalCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchCartCount();
      
      // Subscribe to cart changes with enhanced real-time updates
      console.log('🔔 Setting up cart real-time subscription for user:', user.id);
      
      const subscription = supabase
        .channel(`cart_changes_${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('🔔 Cart change detected:', payload.eventType, payload);
            // Immediate refetch on any cart change
            fetchCartCount();
          }
        )
        .subscribe((status) => {
          console.log('🔔 Cart subscription status:', status);
        });

      return () => {
        console.log('🧹 Cleaning up cart subscription');
        subscription.unsubscribe();
      };
    } else {
      setCartCount(0);
    }
  }, [user, fetchCartCount]);

  return { cartCount, refetchCartCount: fetchCartCount };
};
