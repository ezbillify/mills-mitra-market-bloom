
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
}

const AddToCartButton = ({ productId, productName, disabled }: AddToCartButtonProps) => {
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

  return (
    <Button 
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className="w-full h-9 sm:h-10 organic-button bg-millet-gold hover:bg-warm-beige text-warm-brown"
      size="sm"
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
};

export default AddToCartButton;
