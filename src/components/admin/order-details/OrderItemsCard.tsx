
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image: string | null;
    description: string | null;
  };
}

interface OrderItemsCardProps {
  orderItems: OrderItem[];
  total: number;
}

const OrderItemsCard = ({ orderItems, total }: OrderItemsCardProps) => {
  const calculateItemsTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.price),
      0
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Items ({orderItems.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orderItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                {item.products.image ? (
                  <img
                    src={item.products.image}
                    alt={item.products.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <Package className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.products.name}</h4>
                {item.products.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {item.products.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm">Quantity: {item.quantity}</span>
                  <span className="text-sm">Unit Price: ₹{Number(item.price).toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{(item.quantity * Number(item.price)).toFixed(2)}</p>
              </div>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between items-center pt-4">
            <div className="space-y-1">
              <p className="text-sm">Items Total: ₹{calculateItemsTotal().toFixed(2)}</p>
              <p className="text-lg font-bold">Order Total: ₹{Number(total).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsCard;
