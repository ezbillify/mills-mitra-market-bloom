import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="absolute inset-0 animate-ping">
                <CheckCircle className="h-16 w-16 text-green-400 opacity-75" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Package className="h-5 w-5" />
              <span className="font-medium">Order confirmation sent to your email</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/orders')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              View My Orders
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
            >
              Continue Shopping
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

export default PaymentSuccess;
