import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ShoppingCart, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentError = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/cart');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <AlertCircle className="h-16 w-16 text-orange-500" />
              <div className="absolute inset-0 animate-ping">
                <AlertCircle className="h-16 w-16 text-orange-400 opacity-75" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Error
          </h1>

          <p className="text-gray-600 mb-6">
            An unexpected error occurred while processing your payment. Please try again later or contact support if the problem persists.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-700">
              If you were charged, please contact our support team with your order details.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/cart')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/orders')}
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Orders
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Redirecting to cart in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentError;
