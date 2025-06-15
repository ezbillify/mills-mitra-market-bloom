
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CreditCard, Calendar, Building, BadgeDollarSign } from "lucide-react";

interface InvoiceInfoCardProps {
  orderId: string;
  createdAt: string;
  paymentType?: string; // Add paymentType as optional
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  razorpay: "Paid via Razorpay",
};

const InvoiceInfoCard = ({ orderId, createdAt, paymentType }: InvoiceInfoCardProps) => {
  const readablePayment = paymentType && PAYMENT_LABELS[paymentType]
    ? PAYMENT_LABELS[paymentType]
    : paymentType
    ? paymentType.charAt(0).toUpperCase() + paymentType.slice(1)
    : "N/A";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Invoice Number:</span>
                <p className="text-gray-900">INV-{orderId.substring(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Invoice Date:</span>
                <p className="text-gray-900">{new Date(createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Payment Method:</span>
                <p className="text-gray-900">{readablePayment}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Company:</span>
                <p className="text-gray-900">Your Company Name</p>
                <p className="text-xs text-gray-500">GST: Your GST Number</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceInfoCard;
