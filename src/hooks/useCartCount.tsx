
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useCartCount = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

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
    // Cleanup any existing subscription first
    if (subscriptionRef.current) {
      console.log('🧹 Cleaning up existing cart subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

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

      // Store the subscription reference
      subscriptionRef.current = subscription;

      return () => {
        console.log('🧹 Cleaning up cart subscription');
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    } else {
      setCartCount(0);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object or fetchCartCount

  return { cartCount, refetchCartCount: fetchCartCount };
};
