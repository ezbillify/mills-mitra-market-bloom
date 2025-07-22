
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PricingUtils } from '@/utils/pricingUtils';
import { useCartCount } from '@/hooks/useCartCount';

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

interface CartItemCardProps {
  item: CartItem;
  onUpdate: () => void;
}

const CartItemCard = ({ item, onUpdate }: CartItemCardProps) => {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const { toast } = useToast();
  const { refetchCartCount } = useCartCount();

  const pricing = PricingUtils.calculateProductPrice(item.products, quantity);

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.products.stock) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (error) throw error;

      setQuantity(newQuantity);
      onUpdate();
      refetchCartCount();

      toast({
        title: "Cart updated",
        description: "Item quantity has been updated",
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      onUpdate();
      refetchCartCount();

      toast({
        title: "Item removed",
        description: `${item.products.name} has been removed from your cart`,
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
      <div className="flex-shrink-0">
        <img
          src={item.products.image || '/placeholder.svg'}
          alt={item.products.name}
          className="w-full sm:w-20 h-20 object-cover rounded"
        />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="font-medium text-warm-brown">{item.products.name}</h3>
            <p className="text-sm text-muted-foreground">{item.products.category}</p>
          </div>
          
          <div className="text-right">
            <div className="space-y-1">
              {PricingUtils.hasDiscount(item.products) && (
                <div className="text-xs text-muted-foreground line-through">
                  {PricingUtils.formatPrice(item.products.price * quantity)}
                </div>
              )}
              <div className="font-semibold text-warm-brown">
                {PricingUtils.formatPrice(pricing.finalPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                (incl. tax)
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(quantity - 1)}
              disabled={loading || quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const newQty = Math.max(1, Math.min(item.products.stock, parseInt(e.target.value) || 1));
                setQuantity(newQty);
              }}
              onBlur={() => updateQuantity(quantity)}
              className="w-16 h-8 text-center"
              min="1"
              max={item.products.stock}
              disabled={loading}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(quantity + 1)}
              disabled={loading || quantity >= item.products.stock}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {item.products.stock} in stock
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeItem}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
