
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrdersStats from "@/components/admin/OrdersStats";
import OrdersTable from "@/components/admin/OrdersTable";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed";
  created_at: string;
  shipping_address: string;
  tracking_number: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      // First, fetch orders without the problematic join
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      const userIds = [...new Set(ordersData?.map(order => order.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        }

        const profilesMap = new Map(
          (profilesData || []).map(profile => [profile.id, profile])
        );

        const ordersWithProfiles = (ordersData || []).map(order => ({
          ...order,
          profiles: profilesMap.get(order.user_id) || null
        })) as Order[];

        setOrders(ordersWithProfiles);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Error",
          description: "Failed to update order status",
          variant: "destructive",
        });
        return;
      }

      await fetchOrders();
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
        </div>
      </div>

      <OrdersStats orders={orders} />
      <OrdersTable 
        orders={orders} 
        onUpdateStatus={updateOrderStatus}
        onViewDetails={handleViewDetails}
      />
      
      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdateStatus={updateOrderStatus}
      />
    </div>
  );
};

export default AdminOrders;
