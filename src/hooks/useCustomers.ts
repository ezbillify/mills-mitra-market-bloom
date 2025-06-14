
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
        console.log('🔄 Manual refresh triggered for customers data...');
      } else {
        setLoading(true);
      }

      const processedCustomers = await fetchCustomersData();
      setCustomers(processedCustomers);

      if (showRefreshToast) {
        toast({
          title: "✅ Data Refreshed",
          description: `Found ${processedCustomers.length} customers (including users with orders)`,
        });
      }
    } catch (error) {
      console.error('💥 === ERROR IN CUSTOMER FETCH ===', error);
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
    console.log('🔄 Manual refresh triggered by user...');
    fetchCustomers(true);
  }, [fetchCustomers]);

  // Set up real-time subscriptions
  useRealtimeSubscriptions({ onDataChange: fetchCustomers });

  useEffect(() => {
    // Initial fetch
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
