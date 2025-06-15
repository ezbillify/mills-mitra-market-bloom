
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin } from "lucide-react";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CustomerInfoCardProps {
  customerInfo: CustomerInfo;
}

const CustomerInfoCard = ({ customerInfo }: CustomerInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Customer Name:</span>
                <p className="text-gray-900">{customerInfo.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-gray-900">{customerInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Phone:</span>
                <p className="text-gray-900">{customerInfo.phone}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <span className="text-sm font-medium">Address:</span>
                <p className="text-sm text-gray-900 mt-1">{customerInfo.address}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard;
