
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeSubscriptionsProps {
  onDataChange: () => void;
}

export const useRealtimeSubscriptions = ({ onDataChange }: UseRealtimeSubscriptionsProps) => {
  const mountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('📡 Setting up real-time subscriptions...');
    
    // Create a single channel for all table changes
    const channel = supabase
      .channel('customer-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔴 Profile change detected:', payload.eventType);
          if (mountedRef.current) {
            setTimeout(() => onDataChange(), 300);
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
          console.log('🟡 Order change detected:', payload.eventType);
          if (mountedRef.current) {
            setTimeout(() => onDataChange(), 300);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up subscriptions...');
      mountedRef.current = false;
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
