
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useCartCount = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const subscriptionRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const isSubscribingRef = useRef(false);

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
        try {
          subscriptionRef.current.unsubscribe();
        } catch (error) {
          console.log('🧹 Subscription already cleaned up or error during cleanup:', error);
        }
        subscriptionRef.current = null;
      }
      isSubscribingRef.current = false;
    };

    // Always cleanup first
    cleanupSubscription();

    if (!user) {
      setCartCount(0);
      userIdRef.current = null;
      return;
    }

    // Prevent multiple subscriptions
    if (isSubscribingRef.current) {
      console.log('🛒 Already subscribing, skipping...');
      return;
    }

    isSubscribingRef.current = true;
    userIdRef.current = user.id;

    // Initial fetch
    fetchCartCount();
    
    // Set up subscription with a delay to ensure cleanup is complete
    const setupSubscription = () => {
      if (!isSubscribingRef.current || !user) {
        return;
      }

      try {
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
            if (status === 'SUBSCRIBED') {
              subscriptionRef.current = subscription;
            }
          });
      } catch (error) {
        console.error('🔔 Error setting up subscription:', error);
        isSubscribingRef.current = false;
      }
    };

    // Small delay to ensure any existing subscriptions are fully cleaned up
    const timeoutId = setTimeout(setupSubscription, 100);

    return () => {
      clearTimeout(timeoutId);
      cleanupSubscription();
    };
  }, [user?.id]); // Only depend on user.id to prevent multiple subscriptions

  return { cartCount, refetchCartCount: fetchCartCount };
};
