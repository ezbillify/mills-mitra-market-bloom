
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface CustomerInfo {
  name: string;
  phone: string;
}

interface PackingInstructionsCardProps {
  orderItems: OrderItem[];
  total: number;
  customerInfo: CustomerInfo;
}

const PackingInstructionsCard = ({ orderItems, total, customerInfo }: PackingInstructionsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          What to Pack - Items Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Packing Instructions</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Total items: {orderItems.length} different products</li>
              <li>• Total quantity: {orderItems.reduce((sum, item) => sum + item.quantity, 0)} pieces</li>
              <li>• Order value: ₹{Number(total).toFixed(2)}</li>
              <li>• Customer: {customerInfo.name}</li>
              <li>• Phone: {customerInfo.phone}</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h5 className="font-medium">Items to pack:</h5>
            {orderItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.products.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackingInstructionsCard;
