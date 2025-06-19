
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCartCount } from '@/hooks/useCartCount';
import CartItems from '@/components/customer/CartItems';
import CartSummary from '@/components/customer/CartSummary';
import EmptyCart from '@/components/customer/EmptyCart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Cart = () => {
  const { user } = useAuth();
  const { cartCount } = useCartCount();

  const { data: cartItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cart-items', user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('🛒 Fetching cart items for user:', user.id);

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            discounted_price,
            gst_percentage,
            image,
            stock,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart items:', error);
        throw error;
      }

      console.log('🛒 Cart items fetched:', data?.length || 0);
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to view your cart.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load cart items. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-brown">
            Shopping Cart
          </h1>
          <div className="text-sm text-muted-foreground">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CartItems items={cartItems} onUpdate={refetch} />
          </div>
          <div className="lg:col-span-1">
            <CartSummary items={cartItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
