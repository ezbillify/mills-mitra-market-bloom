
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface OrdersHeaderProps {
  onRefresh: () => void;
}

const OrdersHeader = ({ onRefresh }: OrdersHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-warm-brown">Orders Management</h1>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="border-sage-green text-sage-green hover:bg-sage-green hover:text-warm-cream"
        >
          <Package className="h-4 w-4 mr-2" />
          Refresh Orders
        </Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
