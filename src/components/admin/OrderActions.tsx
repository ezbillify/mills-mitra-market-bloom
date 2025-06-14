
import { Button } from "@/components/ui/button";
import { Eye, Truck } from "lucide-react";

interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed";
}

interface OrderActionsProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => void;
}

const OrderActions = ({ order, onUpdateStatus }: OrderActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        className="border-warm-beige text-earth-brown hover:bg-warm-beige"
      >
        <Eye className="h-4 w-4" />
      </Button>
      {order.status === 'pending' && (
        <Button 
          size="sm" 
          onClick={() => onUpdateStatus(order.id, 'accepted')}
          className="bg-millet-gold hover:bg-warm-beige text-warm-brown"
        >
          Accept
        </Button>
      )}
      {order.status === 'accepted' && (
        <Button 
          size="sm" 
          onClick={() => onUpdateStatus(order.id, 'processing')}
          className="bg-sage-green hover:bg-millet-gold text-warm-cream"
        >
          Process
        </Button>
      )}
      {order.status === 'processing' && (
        <Button 
          size="sm" 
          onClick={() => onUpdateStatus(order.id, 'shipped')}
          className="bg-millet-gold hover:bg-sage-green text-warm-brown"
        >
          <Truck className="h-4 w-4 mr-1" />
          Ship
        </Button>
      )}
      {order.status === 'shipped' && (
        <Button 
          size="sm" 
          onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}
          className="bg-sage-green hover:bg-millet-gold text-warm-cream"
        >
          Out for Delivery
        </Button>
      )}
      {order.status === 'out_for_delivery' && (
        <Button 
          size="sm" 
          onClick={() => onUpdateStatus(order.id, 'delivered')}
          className="bg-millet-gold hover:bg-sage-green text-warm-brown"
        >
          Mark Delivered
        </Button>
      )}
    </div>
  );
};

export default OrderActions;
