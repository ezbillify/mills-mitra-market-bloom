import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import CartItemCard from './CartItemCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    discounted_price: number | null;
    gst_percentage: number | null;
    image: string | null;
    stock: number;
    category: string;
  };
}

interface CartItemsProps {
  items: CartItem[];
  onUpdate: () => void;
}

const CartItems = ({ items, onUpdate }: CartItemsProps) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load cart items. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  try {
    return (
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-primary">Cart Items</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </Card>
    );
  } catch (error) {
    console.error('Error rendering cart items:', error);
    setHasError(true);
    return null;
  }
};

export default CartItems;