
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface ShippingAddressCardProps {
  shippingAddress: string;
}

const ShippingAddressCard = ({ shippingAddress }: ShippingAddressCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line bg-gray-50 p-3 rounded-md">{shippingAddress}</p>
      </CardContent>
    </Card>
  );
};

export default ShippingAddressCard;
