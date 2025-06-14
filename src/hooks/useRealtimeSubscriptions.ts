
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeSubscriptionsProps {
  onDataChange: () => void;
}

export const useRealtimeSubscriptions = ({ onDataChange }: UseRealtimeSubscriptionsProps) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    console.log('📡 Setting up simplified real-time subscriptions...');
    
    // Create unique channel names to avoid conflicts
    const channelName = `customers-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔴 REAL-TIME: Profile change detected!', payload.eventType);
          if (mountedRef.current) {
            onDataChange();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🟡 REAL-TIME: Order change detected!', payload.eventType);
          if (mountedRef.current) {
            onDataChange();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up subscriptions...');
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [onDataChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
};
