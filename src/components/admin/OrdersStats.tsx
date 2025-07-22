import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/hooks/useOrders";
import { Package, Clock, Truck, CheckCircle, Ban, ShoppingBag, Plane } from "lucide-react";

interface OrdersStatsProps {
  orders: Order[];
  onFilterChange?: (status: string | null) => void;
  activeFilter?: string | null;
}

const OrdersStats = ({ orders, onFilterChange, activeFilter }: OrdersStatsProps) => {
  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "text-royal-green",
      bgColor: "bg-royal-green/10",
      borderColor: "border-l-royal-green",
      filterStatus: null
    },
    {
      title: "Pending",
      value: orders.filter(o => o.status === 'pending').length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-l-orange-600",
      filterStatus: "pending"
    },
    {
      title: "Accepted",
      value: orders.filter(o => o.status === 'accepted').length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-l-green-600",
      filterStatus: "accepted"
    },
    {
      title: "Processing",
      value: orders.filter(o => o.status === 'processing').length,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-l-blue-600",
      filterStatus: "processing"
    },
    {
      title: "Cancelled",
      value: orders.filter(o => o.status === 'cancelled').length,
      icon: Ban,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-l-red-600",
      filterStatus: "cancelled"
    },
    {
      title: "Completed",
      value: orders.filter(o => o.status === 'completed').length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-l-emerald-600",
      filterStatus: "completed"
    },
    {
      title: "Out for Delivery",
      value: orders.filter(o => o.status === 'out_for_delivery').length,
      icon: Truck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-l-purple-600",
      filterStatus: "out_for_delivery"
    },
    {
      title: "Shipped",
      value: orders.filter(o => o.status === 'shipped').length,
      icon: Plane,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-l-indigo-600",
      filterStatus: "shipped"
    }
  ];

  const handleCardClick = (filterStatus: string | null) => {
    if (onFilterChange) {
      onFilterChange(filterStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${stat.borderColor} border-l-4 bg-white cursor-pointer ${
            activeFilter === stat.filterStatus ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleCardClick(stat.filterStatus)}
        >
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
