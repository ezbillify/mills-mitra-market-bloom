
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/hooks/useOrders";
import { Package, Clock, Truck, CheckCircle } from "lucide-react";

interface OrdersStatsProps {
  orders: Order[];
}

const OrdersStats = ({ orders }: OrdersStatsProps) => {
  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "text-royal-green",
      bgColor: "bg-royal-green/10",
      borderColor: "border-l-royal-green"
    },
    {
      title: "Pending",
      value: orders.filter(o => o.status === 'pending').length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-l-orange-600"
    },
    {
      title: "Processing",
      value: orders.filter(o => o.status === 'processing').length,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-l-blue-600"
    },
    {
      title: "Revenue",
      value: `₹${orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2)}`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-l-emerald-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${stat.borderColor} border-l-4 bg-white`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrdersStats;
