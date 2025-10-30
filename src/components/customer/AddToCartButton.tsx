import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useCartCount } from "@/hooks/useCartCount";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  disabled?: boolean;
  showBuyNow?: boolean;
}

const AddToCartButton = ({ productId, productName, disabled, showBuyNow = false }: AddToCartButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refetchCartCount } = useCartCount();

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setLoading(true);
    console.log('🛒 Adding product to cart:', productId);
    
    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
        console.log('🛒 Updated existing cart item quantity');
      } else {
        // Add new item to cart
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1,
          });

        if (error) throw error;
        console.log('🛒 Added new item to cart');
      }

      // Immediately refresh cart count to ensure UI updates
      await refetchCartCount();

      // Fire custom event so CustomerHeader catches and updates instantly
      window.dispatchEvent(new Event("cart_instant_update"));

      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to purchase items",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setLoading(true);
    console.log('🛒 Adding product to cart for immediate purchase:', productId);
    
    try {
      // Add item to cart first
      await handleAddToCart();
      
      // Then navigate to checkout
      navigate("/cart");
    } catch (error) {
      console.error('Error with buy now:', error);
      toast({
        title: "Error",
        description: "Failed to process buy now request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showBuyNow) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={handleAddToCart}
          disabled={disabled || loading}
          className="flex-1 h-10 organic-button bg-millet-gold hover:bg-warm-beige text-warm-brown"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {loading ? "Adding..." : "Add to Cart"}
        </Button>
        <Button 
          onClick={handleBuyNow}
          disabled={disabled || loading}
          className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white"
        >
          Buy Now
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className="w-full h-10 organic-button bg-millet-gold hover:bg-warm-beige text-warm-brown"
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
};

export default AddToCartButton;