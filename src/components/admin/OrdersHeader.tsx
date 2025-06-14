
import { Button } from "@/components/ui/button";
import { Package, RefreshCw } from "lucide-react";
import { useState } from "react";

interface OrdersHeaderProps {
  onRefresh: () => void;
}

const OrdersHeader = ({ onRefresh }: OrdersHeaderProps) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold text-warm-brown mb-2">Orders Management</h1>
        <p className="text-earth-brown/70">Track and manage all customer orders</p>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-olive-leaf/30 text-olive-leaf hover:bg-olive-leaf hover:text-warm-cream transition-all duration-200 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Orders'}
        </Button>
        <Button 
          className="bg-golden-millet hover:bg-golden-millet/90 text-warm-brown shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Package className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
