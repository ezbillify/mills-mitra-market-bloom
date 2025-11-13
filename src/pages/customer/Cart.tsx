import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCartCount } from '@/hooks/useCartCount';
import CartItems from '@/components/customer/CartItems';
import CartSummary from '@/components/customer/CartSummary';
import EmptyCart from '@/components/customer/EmptyCart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShoppingCart as CartIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Cart = () => {
  const { user } = useAuth();
  const { cartCount, refetchCartCount } = useCartCount();
  const [hasError, setHasError] = useState(false);

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

  const handleOrderComplete = () => {
    // Refresh cart data and cart count after successful order
    refetch();
    refetchCartCount();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
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

  if (error || hasError) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
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

  try {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                Shopping Cart
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
              <Link to="/products">
                <CartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CartItems items={cartItems} onUpdate={refetch} />
            </div>
            <div className="lg:col-span-1">
              <CartSummary items={cartItems} onOrderComplete={handleOrderComplete} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error rendering cart:', err);
    setHasError(true);
    return null;
  }
};

export default Cart;