
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer";
import { fetchCustomersData } from "@/services/customerService";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";

export const useCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
        console.log('🔄 Manual refresh triggered...');
      } else {
        setLoading(true);
      }

      const processedCustomers = await fetchCustomersData();
      
      console.log('📊 Setting customers state:', processedCustomers.length);
      setCustomers(processedCustomers);

      if (showRefreshToast) {
        toast({
          title: "✅ Data Refreshed",
          description: `Found ${processedCustomers.length} customers`,
        });
      }
    } catch (error) {
      console.error('💥 Error fetching customers:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const handleRefresh = useCallback(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  const handleRealtimeDataChange = useCallback(() => {
    console.log('🔔 Real-time change detected, refreshing...');
    fetchCustomers(false);
  }, [fetchCustomers]);

  // Set up real-time subscriptions
  useRealtimeSubscriptions({ onDataChange: handleRealtimeDataChange });

  useEffect(() => {
    console.log('🚀 Initial customer fetch...');
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    refreshing,
    fetchCustomers,
    handleRefresh
  };
};
