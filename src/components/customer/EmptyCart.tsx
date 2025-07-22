
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmptyCart = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2 text-warm-brown">
            Your cart is empty
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any items to your cart yet. 
            Start exploring our products to find something you love!
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/products')}
              className="w-full organic-button bg-millet-gold hover:bg-warm-beige text-warm-brown"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmptyCart;
