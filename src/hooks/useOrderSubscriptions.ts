
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseOrderSubscriptionsProps {
  onOrdersChange: () => void;
}

export const useOrderSubscriptions = ({ onOrdersChange }: UseOrderSubscriptionsProps) => {
  const ordersChannelRef = useRef<any>(null);
  const profilesChannelRef = useRef<any>(null);

  useEffect(() => {
    console.log("📡 Setting up order subscriptions...");

    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          console.log("Orders changed, refetching...");
          onOrdersChange();
        }
      )
      .subscribe();

    // Also listen for profile changes since they affect order display
    const profilesChannel = supabase
      .channel("profiles-changes-for-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          console.log("Profiles changed, refetching orders...");
          onOrdersChange();
        }
      )
      .subscribe();

    ordersChannelRef.current = ordersChannel;
    profilesChannelRef.current = profilesChannel;

    return () => {
      console.log("🧹 Cleaning up order subscriptions...");
      if (ordersChannelRef.current) {
        supabase.removeChannel(ordersChannelRef.current);
      }
      if (profilesChannelRef.current) {
        supabase.removeChannel(profilesChannelRef.current);
      }
    };
  }, [onOrdersChange]);
};
