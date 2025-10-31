import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentPending = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Pending
          </h1>

          <p className="text-gray-600 mb-6">
            Your payment is being processed. This may take a few minutes. Please check your orders for the latest status.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700">
              We will send you an email confirmation once the payment is verified.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/orders')}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Check Order Status
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Redirecting to orders in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPending;
