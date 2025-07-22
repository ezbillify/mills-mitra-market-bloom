
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeSubscriptionsProps {
  onDataChange: () => void;
}

export const useRealtimeSubscriptions = ({ onDataChange }: UseRealtimeSubscriptionsProps) => {
  const mountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('📡 Setting up enhanced real-time subscriptions...');
    
    // Create a single channel for all table changes
    const channel = supabase
      .channel('customer-data-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔴 Profile change detected:', {
            event: payload.eventType,
            table: payload.table,
            record: payload.new || payload.old,
            timestamp: new Date().toISOString()
          });
          if (mountedRef.current) {
            // Immediate trigger for profile changes
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
          console.log('🟡 Order change detected:', {
            event: payload.eventType,
            table: payload.table,
            record: payload.new || payload.old,
            timestamp: new Date().toISOString()
          });
          if (mountedRef.current) {
            // Immediate trigger for order changes
            onDataChange();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Enhanced subscription status:', status, new Date().toISOString());
      });

    channelRef.current = channel;

    // Also set up a periodic refresh to catch any missed updates
    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        console.log('⏰ Periodic refresh triggered');
        onDataChange();
      }
    }, 30000); // Every 30 seconds

    return () => {
      console.log('🧹 Cleaning up enhanced subscriptions...');
      mountedRef.current = false;
      clearInterval(intervalId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [onDataChange]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
};
