
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
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-royal-green mb-2">Orders Management</h1>
        <p className="text-gray-600">Track and manage all customer orders</p>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-royal-green/30 text-royal-green hover:bg-royal-green hover:text-white transition-all duration-200 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Orders'}
        </Button>
        <Button className="bg-royal-green hover:bg-medium-green text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <Package className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
