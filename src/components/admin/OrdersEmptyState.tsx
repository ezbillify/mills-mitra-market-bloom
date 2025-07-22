
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

const OrdersEmptyState = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-white to-gray-50">
        <CardTitle className="text-royal-green">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-700 text-lg">No orders found</p>
          <p className="text-gray-500 text-sm mt-2">Orders will appear here once customers start placing them.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersEmptyState;
