
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface OrderTimelineCardProps {
  createdAt: string;
  updatedAt: string;
}

const OrderTimelineCard = ({ createdAt, updatedAt }: OrderTimelineCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-sm font-medium">Order Date:</span>
          <p className="text-sm">{formatDate(createdAt)}</p>
        </div>
        <div>
          <span className="text-sm font-medium">Last Updated:</span>
          <p className="text-sm">{formatDate(updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTimelineCard;
