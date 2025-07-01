
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

interface PaymentProgressIndicatorProps {
  paymentType: string;
  orderStatus: string;
  createdAt: string;
}

const PaymentProgressIndicator = ({ paymentType, orderStatus, createdAt }: PaymentProgressIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Only show for online payments
  if (paymentType !== 'razorpay') {
    return null;
  }

  const steps = [
    { label: "Payment Initiated", icon: Clock, status: "initiated" },
    { label: "Payment Processing", icon: CreditCard, status: "processing" },
    { label: "Payment Verified", icon: CheckCircle, status: "verified" },
    { label: "Order Confirmed", icon: CheckCircle, status: "confirmed" }
  ];

  useEffect(() => {
    // Determine progress based on order status
    let stepIndex = 0;
    let progressValue = 0;

    switch (orderStatus) {
      case 'pending':
        stepIndex = 0;
        progressValue = 25;
        break;
      case 'processing':
      case 'accepted':
        stepIndex = 3;
        progressValue = 100;
        break;
      case 'shipped':
      case 'delivered':
      case 'completed':
        stepIndex = 3;
        progressValue = 100;
        break;
      case 'cancelled':
        stepIndex = 0;
        progressValue = 0;
        break;
      default:
        stepIndex = 1;
        progressValue = 50;
    }

    setCurrentStep(stepIndex);
    setProgress(progressValue);
  }, [orderStatus]);

  const getStepStatus = (stepIndex: number) => {
    if (orderStatus === 'cancelled') {
      return 'cancelled';
    }
    if (stepIndex <= currentStep) {
      return 'completed';
    }
    if (stepIndex === currentStep + 1) {
      return 'current';
    }
    return 'pending';
  };

  const getStatusColor = () => {
    if (orderStatus === 'cancelled') return 'bg-red-100 text-red-800';
    if (progress === 100) return 'bg-green-100 text-green-800';
    if (progress > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = () => {
    if (orderStatus === 'cancelled') return 'Payment Cancelled';
    if (progress === 100) return 'Payment Completed';
    if (progress > 0) return 'Payment In Progress';
    return 'Payment Pending';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Online Payment Progress
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
          <span className="text-sm text-gray-500">
            Started {new Date(createdAt).toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  ${status === 'completed' ? 'bg-green-100 text-green-600' : 
                    status === 'current' ? 'bg-blue-100 text-blue-600' :
                    status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-400'}
                `}>
                  {status === 'cancelled' ? (
                    <XCircle className="h-4 w-4" />
                  ) : status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    status === 'completed' ? 'text-green-700' :
                    status === 'current' ? 'text-blue-700' :
                    status === 'cancelled' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {status === 'completed' ? 'Completed' :
                     status === 'current' ? 'In Progress' :
                     status === 'cancelled' ? 'Cancelled' :
                     'Pending'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        {orderStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Payment is being processed. This may take a few minutes.
              </span>
            </div>
          </div>
        )}

        {orderStatus === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                Payment was cancelled or failed. Please try again or contact support.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentProgressIndicator;
