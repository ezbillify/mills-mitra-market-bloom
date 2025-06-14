
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeSubscriptionsProps {
  onDataChange: () => void;
}

export const useRealtimeSubscriptions = ({ onDataChange }: UseRealtimeSubscriptionsProps) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    console.log('📡 Setting up enhanced real-time subscriptions for customer data...');
    
    // Create unique channel names to avoid conflicts
    const channelName = `customer-data-${Date.now()}`;
    
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
          console.log('🔴 REAL-TIME: Profile change detected!', {
            eventType: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old
          });
          if (mountedRef.current) {
            // Add a small delay to ensure database consistency
            setTimeout(() => {
              onDataChange();
            }, 500);
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
          console.log('🟡 REAL-TIME: Order change detected!', {
            eventType: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old
          });
          if (mountedRef.current) {
            // Add a small delay to ensure database consistency
            setTimeout(() => {
              onDataChange();
            }, 500);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
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
