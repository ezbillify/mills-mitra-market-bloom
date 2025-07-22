
import React from 'react';
import { Card } from '@/components/ui/card';
import CartItemCard from './CartItemCard';

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
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-brown">Cart Items</h2>
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
};

export default CartItems;
