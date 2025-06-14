
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useCartCount = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const subscriptionRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

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
    const cleanupSubscription = () => {
      if (subscriptionRef.current) {
        console.log('🧹 Cleaning up existing cart subscription');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };

    // If user changed, cleanup previous subscription
    if (userIdRef.current && userIdRef.current !== user?.id) {
      cleanupSubscription();
    }

    if (user) {
      // Only create new subscription if we don't have one for this user
      if (!subscriptionRef.current || userIdRef.current !== user.id) {
        cleanupSubscription(); // Make sure we're clean
        
        // Initial fetch
        fetchCartCount();
        
        // Create unique channel name with user ID and timestamp
        const channelName = `cart_changes_${user.id}_${Date.now()}`;
        console.log('🔔 Setting up cart real-time subscription:', channelName);
        
        const subscription = supabase
          .channel(channelName)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'cart_items',
              filter: `user_id=eq.${user.id}`
            }, 
            (payload) => {
              console.log('🔔 Cart change detected:', payload.eventType, payload);
              fetchCartCount();
            }
          )
          .subscribe((status) => {
            console.log('🔔 Cart subscription status:', status);
          });

        subscriptionRef.current = subscription;
        userIdRef.current = user.id;
      }
    } else {
      cleanupSubscription();
      setCartCount(0);
      userIdRef.current = null;
    }

    return () => {
      if (subscriptionRef.current) {
        console.log('🧹 Cleaning up cart subscription on unmount');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent multiple subscriptions

  return { cartCount, refetchCartCount: fetchCartCount };
};
