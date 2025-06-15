
import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, Info, Calculator, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CheckoutDialog from "@/components/customer/CheckoutDialog";
import { TaxCalculator } from "@/utils/taxCalculator";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    discounted_price: number | null;
    gst_percentage: number | null;
    selling_price_with_tax: number | null;
    image: string | null;
    category: string;
    stock: number;
  };
}

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          discounted_price,
          gst_percentage,
          selling_price_with_tax,
          image,
          category,
          stock
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } else {
      setCartItems(data || []);
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } else {
      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    } else {
      setCartItems(items => items.filter(item => item.id !== itemId));
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    }
  };

  const calculateItemTotals = (item: CartItem) => {
    const gstPercentage = item.products.gst_percentage || 18;
    const basePrice = item.products.discounted_price || item.products.price;
    const itemTotal = basePrice * item.quantity;
    
    // Use proper tax calculation for consistent pricing
    const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstPercentage, ""); // Empty address for cart
    
    return {
      basePrice,
      itemTotal,
      taxableAmount: taxBreakdown.taxableAmount,
      totalTax: taxBreakdown.totalTax,
      finalAmount: taxBreakdown.taxableAmount + taxBreakdown.totalTax,
      discountPerItem: item.products.discounted_price ? (item.products.price - item.products.discounted_price) : 0
    };
  };

  const calculateCartTotals = () => {
    let totalTaxableAmount = 0;
    let totalTaxAmount = 0;
    let totalFinalPrice = 0;
    let totalDiscount = 0;

    cartItems.forEach(item => {
      const itemTotals = calculateItemTotals(item);
      totalTaxableAmount += itemTotals.taxableAmount;
      totalTaxAmount += itemTotals.totalTax;
      totalFinalPrice += itemTotals.finalAmount;
      totalDiscount += itemTotals.discountPerItem * item.quantity;
    });

    const shipping = totalFinalPrice > 500 ? 0 : 50;
    const grandTotal = totalFinalPrice + shipping;

    return {
      totalTaxableAmount,
      totalTaxAmount,
      totalFinalPrice,
      totalDiscount,
      shipping,
      grandTotal
    };
  };

  const cartTotals = calculateCartTotals();

  const handleOrderComplete = () => {
    fetchCartItems(); // Refresh cart after order completion
    toast({
      title: "Order placed successfully!",
      description: "You will receive a confirmation email shortly.",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
          <Link to="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <ShoppingBag className="h-8 w-8" />
        Shopping Cart
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const itemTotals = calculateItemTotals(item);
            
            return (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={item.products.image || "/placeholder.svg"}
                      alt={item.products.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.products.name}</h3>
                      <Badge variant="secondary" className="mt-1 mb-2">
                        {item.products.category}
                      </Badge>
                      
                      {/* Detailed Price Breakdown */}
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          Price Breakdown
                        </h4>
                        
                        {item.products.discounted_price ? (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Original Price:</span>
                              <span className="line-through text-gray-500 flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {Number(item.products.price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Discounted Price:</span>
                              <span className="font-medium text-green-600 flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {Number(item.products.discounted_price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price:</span>
                            <span className="font-medium flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {Number(item.products.price).toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">GST ({item.products.gst_percentage || 18}%):</span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {itemTotals.totalTax.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="border-t pt-1 mt-1">
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Price per unit:</span>
                            <span className="text-primary flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {itemTotals.finalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-1 mt-1">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Total for {item.quantity} unit(s):</span>
                            <span className="text-primary flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {(itemTotals.finalAmount * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {item.products.discounted_price && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3 text-green-600" />
                            <p className="text-xs text-green-700 flex items-center gap-1">
                              You save <IndianRupee className="h-2 w-2" />{(itemTotals.discountPerItem * item.quantity).toFixed(2)} on this item!
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Detailed Order Breakdown */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Price Breakdown</h4>
                
                <div className="flex justify-between text-sm">
                  <span>Subtotal (Taxable):</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {cartTotals.totalTaxableAmount.toFixed(2)}
                  </span>
                </div>
                
                {cartTotals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Total Discount:</span>
                    <span className="flex items-center gap-1">
                      -<IndianRupee className="h-3 w-3" />{cartTotals.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Total GST:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {cartTotals.totalTaxAmount.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Products Total:</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {cartTotals.totalFinalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="flex items-center gap-1">
                  {cartTotals.shipping === 0 ? 'Free' : (
                    <>
                      <IndianRupee className="h-3 w-3" />
                      {cartTotals.shipping.toFixed(2)}
                    </>
                  )}
                </span>
              </div>
              
              <hr />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {cartTotals.grandTotal.toFixed(2)}
                </span>
              </div>

              {cartTotals.totalFinalPrice < 500 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-blue-600" />
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      Add <IndianRupee className="h-2 w-2" />{(500 - cartTotals.totalFinalPrice).toFixed(2)} more for free shipping!
                    </p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setCheckoutOpen(true)}
              >
                Proceed to Checkout
              </Button>
              <Link to="/products">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cartItems={cartItems}
        total={cartTotals.grandTotal}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
};

export default Cart;
