import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentFailed = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="absolute inset-0 animate-ping">
                <XCircle className="h-16 w-16 text-red-400 opacity-75" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>

          <p className="text-gray-600 mb-6">
            Unfortunately, your payment could not be processed. Please try again or use a different payment method.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              Your order has been cancelled. No charges were made to your account.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/cart')}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Return to Cart
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
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

export default PaymentFailed;
